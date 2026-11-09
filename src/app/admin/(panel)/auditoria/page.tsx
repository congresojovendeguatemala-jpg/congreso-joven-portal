import { desc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { requireCapability } from "@/lib/auth";
import { fmtDate } from "@/lib/format";

export default async function Auditoria() {
  await requireCapability("audit.view");
  const rows = await db
    .select({ id: s.auditLog.id, action: s.auditLog.action, entity: s.auditLog.entity, entityId: s.auditLog.entityId, detail: s.auditLog.detail, at: s.auditLog.createdAt, user: s.users.name })
    .from(s.auditLog)
    .leftJoin(s.users, eq(s.auditLog.userId, s.users.id))
    .orderBy(desc(s.auditLog.createdAt))
    .limit(300);
  return (
    <>
      <h1 className="font-serif text-3xl">Registro de auditoría</h1>
      <div className="mt-6 overflow-x-auto border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-paper text-xs uppercase tracking-wider text-graphite">
            <tr><th className="p-3">Fecha</th><th className="p-3">Usuario</th><th className="p-3">Acción</th><th className="p-3">Entidad</th><th className="p-3">Detalle</th></tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="whitespace-nowrap p-3 text-graphite">{fmtDate(r.at, { dateStyle: "short", timeStyle: "short" })}</td>
                <td className="p-3">{r.user ?? "—"}</td>
                <td className="p-3 font-mono text-xs">{r.action}</td>
                <td className="p-3 font-mono text-xs">{r.entity}{r.entityId ? ` #${r.entityId.slice(0, 8)}` : ""}</td>
                <td className="p-3 font-mono text-xs text-graphite">{r.detail ? JSON.stringify(r.detail) : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
