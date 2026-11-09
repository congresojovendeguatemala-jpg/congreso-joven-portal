import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { asc, desc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { allowedTransitions, canEditContent, STATUS_LABEL, STATUS_TONE, type ArticleStatus, type Doc } from "@/lib/editorial";
import { fmtDate } from "@/lib/format";
import { inputCls } from "@/components/admin/FieldInput";
import { RichEditor } from "@/components/admin/RichEditor";
import { deleteArticle, saveArticle, transitionArticle } from "../../../article-actions";

const toLocalDT = (d: Date | null) => (d ? new Date(d.getTime() - 6 * 3600_000).toISOString().slice(0, 16) : "");

export default async function ArticuloEditor({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/ingresar");
  const reviewer = can(user.role, "articles.review");
  const publisher = can(user.role, "articles.publish");
  if (!reviewer && !publisher && !can(user.role, "articles.submit")) redirect("/admin?denegado=1");
  const { id } = await params;
  const { ok, error } = await searchParams;
  const isNew = id === "nuevo";

  let a: typeof s.articles.$inferSelect | null = null;
  if (!isNew) {
    if (!/^\d+$/.test(id)) notFound();
    [a] = await db.select().from(s.articles).where(eq(s.articles.id, Number(id)));
    if (!a) notFound();
    // Un autor solo puede abrir sus propios artículos.
    if (!reviewer && !publisher && a.createdBy !== user.id) redirect("/admin/articulos");
  }
  const status: ArticleStatus = a?.status ?? "borrador";
  const isOwner = isNew || a?.createdBy === user.id;
  const editable = isNew || canEditContent(user.role, status, isOwner);
  const transitions = a ? allowedTransitions(user.role, status, isOwner) : [];

  const [cats, authors, reviews] = await Promise.all([
    db.select().from(s.categories).orderBy(asc(s.categories.sortOrder)),
    reviewer || publisher ? db.select({ id: s.authors.id, name: s.authors.name }).from(s.authors).orderBy(asc(s.authors.name)) : Promise.resolve([]),
    a
      ? db
          .select({ id: s.articleReviews.id, from: s.articleReviews.fromStatus, to: s.articleReviews.toStatus, comment: s.articleReviews.comment, at: s.articleReviews.createdAt, who: s.users.name })
          .from(s.articleReviews)
          .leftJoin(s.users, eq(s.articleReviews.reviewerId, s.users.id))
          .where(eq(s.articleReviews.articleId, a.id))
          .orderBy(desc(s.articleReviews.createdAt))
      : Promise.resolve([]),
  ]);
  const lastCorrection = reviews.find((r) => r.to === "requiere_correcciones");
  const L = ({ children }: { children: React.ReactNode }) => <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-graphite">{children}</span>;

  return (
    <div className="max-w-6xl">
      <Link href="/admin/articulos" className="text-sm text-blue-600">← Artículos</Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-3xl">{isNew ? "Nuevo artículo" : a!.title}</h1>
        <span className={`rounded-full px-2.5 py-0.5 text-xs ${STATUS_TONE[status]}`}>{STATUS_LABEL[status]}</span>
        {a?.status === "publicado" && <Link href={`/actualidad/${a.slug}`} target="_blank" className="text-sm text-blue-600">Ver publicado ↗</Link>}
      </div>
      {ok && <p className="mt-4 border-l-2 border-emerald-600 bg-emerald-50 px-4 py-2 text-sm" role="status">{ok}</p>}
      {error && <p className="mt-4 border-l-2 border-rose-600 bg-rose-50 px-4 py-2 text-sm text-rose-800" role="alert">{error}</p>}
      {status === "requiere_correcciones" && lastCorrection?.comment && (
        <div className="mt-4 border-l-2 border-amber-600 bg-amber-50 px-4 py-3 text-sm">
          <p className="font-medium">Correcciones solicitadas por {lastCorrection.who ?? "el equipo editorial"}:</p>
          <p className="mt-1 whitespace-pre-line">{lastCorrection.comment}</p>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <form action={saveArticle.bind(null, id)} className="min-w-0 space-y-5">
          <fieldset disabled={!editable} className="space-y-5 disabled:opacity-80">
            <label className="block"><L>Título *</L><input name="title" required defaultValue={a?.title ?? ""} className={`${inputCls} font-serif text-xl`} /></label>
            <label className="block"><L>Subtítulo</L><input name="subtitle" defaultValue={a?.subtitle ?? ""} className={inputCls} /></label>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <L>Categoría</L>
                <select name="categoryId" defaultValue={a?.categoryId ?? ""} className={inputCls}>
                  <option value="">— Elegir —</option>
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              {(reviewer || publisher) && (
                <label className="block">
                  <L>Autor</L>
                  <select name="authorId" defaultValue={a?.authorId ?? ""} className={inputCls}>
                    <option value="">— Yo —</option>
                    {authors.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </select>
                </label>
              )}
            </div>
            <div>
              <L>Fotografía de portada</L>
              <div className="flex items-start gap-4 border border-stone-200 bg-white p-3">
                {a?.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.coverUrl} alt="" className="h-20 w-32 object-cover" />
                ) : (
                  <div className="placeholder-hatch flex h-20 w-32 items-center justify-center border border-dashed border-stone-400/60 text-[0.6rem]">Sin portada</div>
                )}
                <div className="space-y-2 text-xs">
                  <input type="file" name="cover__file" accept="image/jpeg,image/png,image/webp" />
                  {a?.coverUrl && <label className="flex items-center gap-2 text-rose-700"><input type="checkbox" name="cover__remove" /> Quitar portada</label>}
                </div>
              </div>
            </div>
            <div>
              <L>Contenido</L>
              <RichEditor name="content" initial={(a?.content as Doc | null) ?? null} disabled={!editable} />
              {a?.readingMinutes ? <p className="mt-1 text-xs text-stone-400">Tiempo estimado de lectura: {a.readingMinutes} min</p> : null}
            </div>
            <label className="block">
              <L>Fuentes y referencias</L>
              <textarea name="sources" rows={3} defaultValue={a?.sources ?? ""} className={inputCls} placeholder="Una por línea" />
            </label>
            <details className="border border-stone-200 bg-white p-4">
              <summary className="cursor-pointer text-sm font-medium">SEO y publicación</summary>
              <div className="mt-4 grid gap-4">
                {(reviewer || publisher) && <label><L>Identificador URL</L><input name="slug" defaultValue={a?.slug ?? ""} className={inputCls} placeholder="Se genera a partir del título" /></label>}
                <label><L>Título para buscadores</L><input name="seoTitle" defaultValue={a?.seoTitle ?? ""} maxLength={70} className={inputCls} /></label>
                <label><L>Descripción para buscadores</L><textarea name="seoDescription" rows={2} maxLength={300} defaultValue={a?.seoDescription ?? ""} className={inputCls} /></label>
                {publisher && <label><L>Publicación programada (hora de Guatemala)</L><input name="scheduledAt" type="datetime-local" defaultValue={toLocalDT(a?.scheduledAt ?? null)} className={inputCls} /></label>}
              </div>
            </details>
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" name="authorshipDeclared" defaultChecked={a?.authorshipDeclared} className="mt-1 accent-blue-600" />
              <span>Declaro que este texto es de mi autoría (o de la persona indicada como autora), que las fuentes están citadas y que autorizo su publicación en el medio institucional de Congreso Joven.</span>
            </label>
          </fieldset>
          {editable && (
            <div className="flex flex-wrap gap-3">
              <button className="rounded bg-navy-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-600">Guardar</button>
              {(isNew || ["borrador", "requiere_correcciones"].includes(status)) && (
                <button name="_transition" value="enviar" className="rounded border border-navy-900 px-5 py-2.5 text-sm font-medium text-navy-900 hover:bg-navy-900 hover:text-white">
                  Guardar y enviar a revisión
                </button>
              )}
            </div>
          )}
        </form>

        <aside className="space-y-5">
          {transitions.length > 0 && (
            <div className="border border-stone-200 bg-white p-4">
              <p className="text-sm font-medium">Flujo editorial</p>
              <div className="mt-3 space-y-3">
                {transitions.map((t) => (
                  <form key={t.key} action={transitionArticle.bind(null, a!.id, t.key)} className="space-y-2">
                    {t.needsComment && <textarea name="comment" rows={3} required placeholder="¿Qué debe corregirse?" className={`${inputCls} text-xs`} />}
                    <button
                      className={`w-full rounded px-3 py-2 text-sm ${t.tone === "primary" ? "bg-navy-900 text-white hover:bg-blue-600" : t.tone === "danger" ? "border border-rose-300 text-rose-700 hover:bg-rose-50" : "border border-stone-300 hover:bg-stone-100"}`}
                    >
                      {t.label}
                    </button>
                  </form>
                ))}
              </div>
              {status === "aprobado" && <p className="mt-3 text-xs text-stone-400">Para programar: define la fecha en «SEO y publicación», guarda y pulsa «Programar publicación».</p>}
              {status === "programado" && a?.scheduledAt && <p className="mt-3 text-xs text-graphite">Se publicará el {fmtDate(a.scheduledAt, { dateStyle: "long", timeStyle: "short" })}.</p>}
            </div>
          )}
          {reviews.length > 0 && (
            <div className="border border-stone-200 bg-white p-4">
              <p className="text-sm font-medium">Historial</p>
              <ol className="mt-3 space-y-3 text-xs">
                {reviews.map((r) => (
                  <li key={r.id} className="border-l-2 border-blue-600 pl-3">
                    <p>{STATUS_LABEL[r.from]} → <strong>{STATUS_LABEL[r.to]}</strong></p>
                    <p className="text-graphite">{r.who ?? "—"} · {fmtDate(r.at, { dateStyle: "medium", timeStyle: "short" })}</p>
                    {r.comment && <p className="mt-1 whitespace-pre-line">{r.comment}</p>}
                  </li>
                ))}
              </ol>
            </div>
          )}
          {a && can(user.role, "articles.delete") && (
            <form action={deleteArticle.bind(null, a.id)} className="space-y-2 border border-rose-200 bg-rose-50/50 p-4 text-xs">
              <label className="flex items-center gap-2"><input type="checkbox" name="confirm" /> Confirmo eliminar este artículo de forma permanente</label>
              <button className="rounded border border-rose-300 px-3 py-1.5 text-rose-700 hover:bg-rose-100">Eliminar</button>
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}
