"use server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { getSessionUser, type SessionUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { saveUpload } from "@/lib/storage";
import { slugify } from "@/db/seed-data";
import { allowedTransitions, canEditContent, docText, readingMinutes, TRANSITIONS, type Doc } from "@/lib/editorial";

const to = (id: string | number, q: Record<string, string> = {}) => `/admin/articulos/${id}?${new URLSearchParams(q)}`;

async function requireEditorial(): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) redirect("/admin/ingresar");
  if (!(can(u.role, "articles.submit") || can(u.role, "articles.review") || can(u.role, "articles.publish"))) redirect("/admin?denegado=1");
  return u;
}

/** Perfil de autor vinculado a la cuenta; se crea la primera vez que la persona escribe. */
async function ownAuthorId(u: SessionUser) {
  const [a] = await db.select({ id: s.authors.id }).from(s.authors).where(eq(s.authors.userId, u.id));
  if (a) return a.id;
  const base = slugify(u.name) || "autor";
  const [created] = await db
    .insert(s.authors)
    .values({ userId: u.id, name: u.name, slug: `${base}-${u.id.slice(0, 4)}` })
    .returning({ id: s.authors.id });
  return created.id;
}

const GT = (v: string) => new Date(`${v}:00-06:00`); // Guatemala, UTC−6 todo el año

export async function saveArticle(id: string, form: FormData) {
  const user = await requireEditorial();
  const isNew = id === "nuevo";
  const editor = can(user.role, "articles.review") || can(user.role, "articles.publish");

  let current: typeof s.articles.$inferSelect | undefined;
  if (!isNew) {
    [current] = await db.select().from(s.articles).where(eq(s.articles.id, Number(id)));
    if (!current) redirect("/admin/articulos");
    if (!canEditContent(user.role, current.status, current.createdBy === user.id)) redirect(to(id, { error: "No puedes editar este artículo en su estado actual." }));
  }

  const title = String(form.get("title") ?? "").trim();
  if (!title) redirect(to(id, { error: "El artículo necesita un título." }));

  let content: Doc | null = null;
  const raw = String(form.get("content") ?? "");
  if (raw) {
    if (raw.length > 600_000) redirect(to(id, { error: "El contenido es demasiado extenso." }));
    try {
      content = JSON.parse(raw) as Doc;
      if (content?.type !== "doc") throw new Error();
    } catch {
      redirect(to(id, { error: "No se pudo leer el contenido del editor." }));
    }
  } else if (current) {
    content = current.content as Doc | null;
  }
  const text = docText(content).trim();

  const values: Partial<typeof s.articles.$inferInsert> = {
    title,
    subtitle: String(form.get("subtitle") ?? "").trim() || null,
    categoryId: Number(form.get("categoryId")) || null,
    content,
    contentText: text,
    readingMinutes: text ? readingMinutes(text) : null,
    sources: String(form.get("sources") ?? "").trim() || null,
    authorshipDeclared: form.get("authorshipDeclared") === "on",
    seoTitle: String(form.get("seoTitle") ?? "").trim() || null,
    seoDescription: String(form.get("seoDescription") ?? "").trim().slice(0, 300) || null,
    updatedAt: new Date(),
  };
  const sched = String(form.get("scheduledAt") ?? "");
  if (can(user.role, "articles.publish")) values.scheduledAt = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(sched) ? GT(sched) : null;
  if (editor) {
    values.authorId = Number(form.get("authorId")) || (isNew ? await ownAuthorId(user) : current!.authorId);
    const slug = slugify(String(form.get("slug") ?? ""));
    if (slug) values.slug = slug;
  } else if (isNew) {
    values.authorId = await ownAuthorId(user);
  }

  const cover = form.get("cover__file");
  if (form.get("cover__remove") === "on") values.coverUrl = null;
  else if (cover instanceof File && cover.size > 0) {
    try {
      values.coverUrl = (await saveUpload(cover, "articulos")).url;
    } catch (e) {
      redirect(to(id, { error: (e as Error).message }));
    }
  }

  let articleId = Number(id);
  try {
    if (isNew) {
      const base = (values.slug as string | undefined) ?? (slugify(title).slice(0, 90) || "articulo");
      // Sufijo solo si el identificador ya está en uso
      const [taken] = await db.select({ id: s.articles.id }).from(s.articles).where(eq(s.articles.slug, base));
      const slug = taken ? `${base}-${Date.now().toString(36).slice(-4)}` : base;
      const [row] = await db
        .insert(s.articles)
        .values({ ...values, title, slug, status: "borrador", createdBy: user.id })
        .returning({ id: s.articles.id });
      articleId = row.id;
    } else {
      await db.update(s.articles).set(values).where(eq(s.articles.id, articleId));
    }
  } catch {
    redirect(to(id, { error: "No se pudo guardar. ¿El identificador URL ya existe?" }));
  }
  await audit(user.id, isNew ? "create" : "update", "articles", articleId, { titulo: title });

  const next = String(form.get("_transition") ?? "");
  if (next) return transitionArticle(articleId, next, form);
  redirect(to(articleId, { ok: "Borrador guardado." }));
}

export async function transitionArticle(articleId: number, key: string, form: FormData) {
  const user = await requireEditorial();
  const [a] = await db.select().from(s.articles).where(eq(s.articles.id, articleId));
  if (!a) redirect("/admin/articulos");
  const t = allowedTransitions(user.role, a.status, a.createdBy === user.id).find((x) => x.key === key);
  if (!t) redirect(to(articleId, { error: "Esa acción no está disponible para tu rol en este estado." }));

  const comment = String(form.get("comment") ?? "").trim() || null;
  if (t.needsComment && !comment) redirect(to(articleId, { error: "Indica qué debe corregirse." }));

  const patch: Partial<typeof s.articles.$inferInsert> = { status: t.to, updatedAt: new Date() };
  if (t.key === "enviar") {
    if (!a.contentText || a.contentText.length < 200) redirect(to(articleId, { error: "El artículo es demasiado corto para enviarlo (mínimo 200 caracteres)." }));
    if (!a.authorshipDeclared) redirect(to(articleId, { error: "Marca la declaración de autoría antes de enviar." }));
    if (!a.categoryId) redirect(to(articleId, { error: "Elige una categoría antes de enviar." }));
  }
  if (t.key === "programar") {
    if (!a.scheduledAt || a.scheduledAt.getTime() <= Date.now()) redirect(to(articleId, { error: "Define una fecha de publicación futura y guarda antes de programar." }));
  }
  if (t.key === "publicar") patch.publishedAt = a.publishedAt ?? new Date();

  await db.update(s.articles).set(patch).where(eq(s.articles.id, articleId));
  await db.insert(s.articleReviews).values({ articleId, reviewerId: user.id, fromStatus: a.status, toStatus: t.to, comment });
  await audit(user.id, `article.${t.key}`, "articles", articleId, { de: a.status, a: t.to });
  redirect(to(articleId, { ok: `${TRANSITIONS.find((x) => x.key === key)?.label ?? "Acción"}: hecho.` }));
}

export async function deleteArticle(articleId: number, form: FormData) {
  const user = await getSessionUser();
  if (!user || !can(user.role, "articles.delete")) redirect("/admin?denegado=1");
  if (form.get("confirm") !== "on") redirect(to(articleId, { error: "Marca la casilla de confirmación para eliminar." }));
  const [a] = await db.select({ title: s.articles.title, status: s.articles.status }).from(s.articles).where(eq(s.articles.id, articleId));
  await db.delete(s.articles).where(eq(s.articles.id, articleId));
  await audit(user.id, "delete", "articles", articleId, a as Record<string, unknown>);
  redirect("/admin/articulos?eliminado=1");
}
