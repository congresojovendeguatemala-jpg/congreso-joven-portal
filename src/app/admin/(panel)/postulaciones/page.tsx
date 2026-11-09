import Link from "next/link";
import { and, desc, eq, type SQL } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { requireCapability } from "@/lib/auth";
import { MODALITIES } from "@/lib/modalities";
import { fmtDate } from "@/lib/format";

import { STATUS_LABEL } from "@/lib/labels";

type Status = (typeof s.applications.$inferSelect)["status"];
type AType = (typeof s.applications.$inferSelect)["type"];

export default async function Postulaciones({ searchParams }: { searchParams: Promise<{ tipo?: string; estado?: string }> }) {
  await requireCapability("applications.view");
  const { tipo, estado } = await searchParams;
  const where: SQL[] = [];
  if (tipo) where.push(eq(s.applications.type, tipo as AType));
  if (estado) where.push(eq(s.applications.status, estado as Status));
  const rows = await db
    .select({ id: s.applications.id, type: s.applications.type, status: s.applications.status, fullName: s.applications.fullName, createdAt: s.applications.createdAt, dept: s.departments.name })
    .from(s.applications)
    .leftJoin(s.departments, eq(s.applications.departmentId, s.departments.id))
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(s.applications.createdAt))
    .limit(200);
  const sel = "border border-stone-200 bg-white px-3 py-2 text-sm";
  return (
    <>
      <h1 className="font-serif text-3xl">Postulaciones</h1>
      <form className="mt-6 flex flex-wrap gap-3">
        <select name="tipo" defaultValue={tipo ?? ""} className={sel} aria-label="Modalidad">
          <option value="">Todas las modalidades</option>
          {MODALITIES.map((m) => <option key={m.type} value={m.type}>{m.title}</option>)}
        </select>
        <select name="estado" defaultValue={estado ?? ""} className={sel} aria-label="Estado">
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button className="rounded bg-navy-900 px-4 py-2 text-sm text-white">Filtrar</button>
      </form>
      <div className="mt-6 overflow-x-auto border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-paper text-xs uppercase tracking-wider text-graphite">
            <tr><th className="p-3">Nombre</th><th className="p-3">Modalidad</th><th className="p-3">Departamento</th><th className="p-3">Estado</th><th className="p-3">Fecha</th></tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-paper">
                <td className="p-3"><Link href={`/admin/postulaciones/${r.id}`} className="font-medium text-blue-600">{r.fullName}</Link></td>
                <td className="p-3">{MODALITIES.find((m) => m.type === r.type)?.title}</td>
                <td className="p-3">{r.dept ?? "—"}</td>
                <td className="p-3">{STATUS_LABEL[r.status]}</td>
                <td className="p-3 text-graphite">{fmtDate(r.createdAt)}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-graphite">No hay postulaciones con estos filtros.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
