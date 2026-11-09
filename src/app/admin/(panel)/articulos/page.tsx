import Link from "next/link";
import { redirect } from "next/navigation";
import { and, count, desc, eq, type SQL } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { STATUS_LABEL, STATUS_TONE, type ArticleStatus } from "@/lib/editorial";
import { fmtDate } from "@/lib/format";

export default async function Articulos({ searchParams }: { searchParams: Promise<{ estado?: string; eliminado?: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/ingresar");
  const editor = can(user.role, "articles.review") || can(user.role, "articles.publish");
  if (!editor && !can(user.role, "articles.submit")) redirect("/admin?denegado=1");
  const { estado, eliminado } = await searchParams;

  // Los autores solo ven sus propios artículos.
  const scope: SQL[] = editor ? [] : [eq(s.articles.createdBy, user.id)];
  const counts = await db.select({ status: s.articles.status, c: count() }).from(s.articles).where(scope.length ? and(...scope) : undefined).groupBy(s.articles.status);
  const where = [...scope];
  if (estado && estado in STATUS_LABEL) where.push(eq(s.articles.status, estado as ArticleStatus));
  const rows = await db
    .select({ id: s.articles.id, title: s.articles.title, status: s.articles.status, updatedAt: s.articles.updatedAt, author: s.authors.name, category: s.categories.name })
    .from(s.articles)
    .leftJoin(s.authors, eq(s.articles.authorId, s.authors.id))
    .leftJoin(s.categories, eq(s.articles.categoryId, s.categories.id))
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(s.articles.updatedAt));
  const total = counts.reduce((a, b) => a + b.c, 0);
  const tab = (href: string, label: string, n: number, active: boolean) => (
    <Link key={href} href={href} className={`shrink-0 rounded-full px-3 py-1 text-xs ${active ? "bg-navy-900 text-white" : "bg-white text-graphite hover:bg-stone-200"}`}>
      {label} <span className="opacity-60">{n}</span>
    </Link>
  );

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl">{editor ? "Artículos" : "Mis artículos"}</h1>
          <p className="mt-1 text-sm text-graphite">{editor ? "Todos los artículos del medio institucional." : "Escribe, guarda borradores y envíalos a revisión editorial."}</p>
        </div>
        <Link href="/admin/articulos/nuevo" className="rounded bg-navy-900 px-4 py-2 text-sm text-white hover:bg-blue-600">+ Nuevo artículo</Link>
      </div>
      {eliminado && <p className="mt-4 border-l-2 border-emerald-600 bg-emerald-50 px-4 py-2 text-sm">Artículo eliminado.</p>}
      <nav className="mt-6 flex gap-2 overflow-x-auto pb-1" aria-label="Estados">
        {tab("/admin/articulos", "Todos", total, !estado)}
        {(Object.keys(STATUS_LABEL) as ArticleStatus[]).map((k) => tab(`/admin/articulos?estado=${k}`, STATUS_LABEL[k], counts.find((c) => c.status === k)?.c ?? 0, estado === k))}
      </nav>
      <div className="mt-4 overflow-x-auto border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-paper text-xs uppercase tracking-wider text-graphite">
            <tr><th className="p-3">Título</th><th className="p-3">Autor</th><th className="p-3">Categoría</th><th className="p-3">Estado</th><th className="p-3">Actualizado</th></tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-paper">
                <td className="p-3"><Link href={`/admin/articulos/${r.id}`} className="font-medium text-blue-600">{r.title}</Link></td>
                <td className="p-3">{r.author ?? "—"}</td>
                <td className="p-3">{r.category ?? "—"}</td>
                <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_TONE[r.status]}`}>{STATUS_LABEL[r.status]}</span></td>
                <td className="p-3 text-graphite">{fmtDate(r.updatedAt, { dateStyle: "medium", timeStyle: "short" })}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-graphite">No hay artículos en esta vista.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
