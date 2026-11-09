import Link from "next/link";
import { notFound } from "next/navigation";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { requireCapability } from "@/lib/auth";
import { getEditableResource as getResource } from "@/lib/admin/resources";
import { refOptions } from "@/lib/admin/ref-options";
import { fmtDate } from "@/lib/format";

export default async function ResourceList({ params, searchParams }: { params: Promise<{ res: string }>; searchParams: Promise<{ q?: string; eliminado?: string; archivados?: string }> }) {
  const { res: key } = await params;
  const { q = "", eliminado, archivados } = await searchParams;
  const res = getResource(key);
  if (!res) notFound();
  await requireCapability(res.cap);
  const rows = (await db.select().from(res.table).orderBy(asc(res.table[res.orderCol]))) as Record<string, unknown>[];
  const refs = await refOptions(res);
  const nq = q.toLowerCase();
  const hasArchive = "archived" in res.table;
  const archivedCount = hasArchive ? rows.filter((r) => r.archived).length : 0;
  const showArchived = archivados === "1";
  const filtered = rows
    .filter((r) => !hasArchive || Boolean(r.archived) === showArchived)
    .filter((r) => !nq || String(r[res.titleCol] ?? "").toLowerCase().includes(nq));

  const cell = (name: string, v: unknown) => {
    if (typeof v === "boolean") return v ? "Sí" : "No";
    if (v instanceof Date) return fmtDate(v, { dateStyle: "medium", timeStyle: "short" });
    if (refs[name]) return refs[name].find((o) => o.id === v)?.label ?? "—";
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return fmtDate(v);
    return v == null || v === "" ? "—" : String(v);
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl">{res.label}</h1>
          <p className="mt-1 text-sm text-graphite">
            {showArchived ? `${archivedCount} archivados` : `${rows.length - archivedCount} registros`}
            {hasArchive && (archivedCount > 0 || showArchived) && (
              <>
                {" · "}
                <Link href={showArchived ? `/admin/r/${key}` : `/admin/r/${key}?archivados=1`} className="text-blue-600">
                  {showArchived ? "Ver activos" : `Ver archivados (${archivedCount})`}
                </Link>
              </>
            )}
          </p>
        </div>
        <Link href={res.createHref ?? `/admin/r/${key}/nuevo`} className="rounded bg-navy-900 px-4 py-2 text-sm text-white hover:bg-blue-600">
          + Nuevo {res.singular}
        </Link>
      </div>
      {eliminado && <p className="mt-4 border-l-2 border-emerald-600 bg-emerald-50 px-4 py-2 text-sm">Registro eliminado.</p>}
      <form className="mt-6">
        <input name="q" defaultValue={q} placeholder="Buscar…" className="w-full max-w-sm border border-stone-200 bg-white px-3 py-2 text-sm" />
      </form>
      <div className="mt-4 overflow-x-auto border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-paper text-xs uppercase tracking-wider text-graphite">
            <tr>{res.listCols.map((c) => <th key={c.name} className="p-3">{c.label}</th>)}<th className="p-3" /></tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {filtered.map((r) => (
              <tr key={String(r.id)} className="hover:bg-paper">
                {res.listCols.map((c, i) => (
                  <td key={c.name} className="p-3">
                    {i === 0 ? <Link href={`/admin/r/${key}/${r.id}`} className="font-medium text-blue-600">{cell(c.name, r[c.name])}</Link> : cell(c.name, r[c.name])}
                  </td>
                ))}
                <td className="p-3 text-right text-xs">
                  {res.publicHref?.(r) && <Link href={res.publicHref(r)!} target="_blank" className="text-stone-400 hover:text-blue-600">Ver ↗</Link>}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={res.listCols.length + 1} className="p-6 text-center text-graphite">Sin registros.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
