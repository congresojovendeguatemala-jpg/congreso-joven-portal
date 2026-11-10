import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { requireCapability } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { fmtDate } from "@/lib/format";
import { setRegistrationStatus } from "../../../attendance-actions";

const LABEL = { confirmado: "Confirmado", asistio: "Asistió", cancelado: "Cancelado" } as const;
const TONE = { confirmado: "bg-blue-100 text-navy-800", asistio: "bg-emerald-50 text-emerald-800", cancelado: "bg-stone-200 text-stone-400" } as const;
const norm = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const fmtDpi = (d: string) => `${d.slice(0, 4)} ${d.slice(4, 9)} ${d.slice(9)}`;

export default async function AsistenciaEvento({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ q?: string; estado?: string }> }) {
  const user = await requireCapability("events.manage");
  const { id } = await params;
  const { q = "", estado = "" } = await searchParams;
  if (!/^\d+$/.test(id)) notFound();
  const [ev] = await db.select().from(s.events).where(eq(s.events.id, Number(id)));
  if (!ev) notFound();
  const all = await db.select().from(s.eventRegistrations).where(eq(s.eventRegistrations.eventId, ev.id)).orderBy(asc(s.eventRegistrations.createdAt));
  await audit(user.id, "registrations.view", "events", ev.id, { total: all.length });

  const confirmados = all.filter((r) => r.status !== "cancelado");
  const asistieron = all.filter((r) => r.status === "asistio").length;
  const cancelados = all.length - confirmados.length;
  const nq = norm(q.trim());
  const rows = all.filter(
    (r) =>
      (!estado || r.status === estado) &&
      (!nq || norm([r.firstNames, r.lastNames, r.dpi, r.institution, r.email, r.phone].join(" ")).includes(nq.replace(/\s/g, "")) || norm(`${r.firstNames} ${r.lastNames} ${r.institution} ${r.email}`).includes(nq)),
  );
  // Resumen por institución (solo confirmados)
  const byInstitution = Object.entries(
    confirmados.reduce<Record<string, number>>((acc, r) => {
      const k = r.institution.trim();
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const avgAge = confirmados.length ? Math.round(confirmados.reduce((a, r) => a + r.age, 0) / confirmados.length) : null;

  return (
    <div className="max-w-6xl">
      <Link href="/admin/asistencia" className="text-sm text-blue-600">← Asistencia a eventos</Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl">{ev.title}</h1>
          <p className="text-sm text-graphite">
            {fmtDate(ev.startsAt, { dateStyle: "full", timeStyle: "short" })} · {ev.location} · {ev.registrationOpen ? "Inscripciones abiertas" : "Inscripciones cerradas"}
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <a href={`/admin/asistencia/${ev.id}/csv`} className="rounded bg-navy-900 px-4 py-2 text-white hover:bg-blue-600">Descargar Excel (CSV)</a>
          <Link href={`/admin/r/eventos/${ev.id}`} className="rounded border border-stone-300 px-4 py-2 hover:bg-white">Editar evento</Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-stone-200 bg-white p-5">
          <p className="font-serif text-4xl text-navy-900">{confirmados.length}</p>
          <p className="text-sm text-graphite">Confirmados{ev.capacity ? ` de ${ev.capacity} cupos` : ""}</p>
        </div>
        <div className="border border-stone-200 bg-white p-5">
          <p className="font-serif text-4xl text-emerald-700">{asistieron}</p>
          <p className="text-sm text-graphite">Asistieron (registrados el día del evento)</p>
        </div>
        <div className="border border-stone-200 bg-white p-5">
          <p className="font-serif text-4xl text-stone-400">{cancelados}</p>
          <p className="text-sm text-graphite">Cancelados</p>
        </div>
        <div className="border border-stone-200 bg-white p-5">
          <p className="font-serif text-4xl text-navy-900">{byInstitution.length}</p>
          <p className="text-sm text-graphite">Instituciones{avgAge ? ` · edad promedio ${avgAge}` : ""}</p>
        </div>
      </div>

      {byInstitution.length > 0 && (
        <details className="mt-4 border border-stone-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-medium">Confirmados por institución</summary>
          <ul className="mt-3 grid gap-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {byInstitution.map(([name, n]) => (
              <li key={name} className="flex justify-between gap-3 border-b border-stone-100 py-1">
                <span>{name}</span>
                <span className="font-medium">{n}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <form className="mt-6 flex flex-wrap gap-3">
        <input name="q" defaultValue={q} placeholder="Buscar por nombre, DPI, institución, correo…" className="w-full max-w-md border border-stone-200 bg-white px-3 py-2 text-sm" />
        <select name="estado" defaultValue={estado} className="border border-stone-200 bg-white px-3 py-2 text-sm" aria-label="Estado">
          <option value="">Todos los estados</option>
          {Object.entries(LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button className="rounded bg-navy-900 px-4 py-2 text-sm text-white">Filtrar</button>
        {(q || estado) && <Link href={`/admin/asistencia/${ev.id}`} className="self-center text-sm text-blue-600">Limpiar</Link>}
      </form>
      <p className="mt-3 text-xs text-graphite">{rows.length} de {all.length} registros · Datos personales: no compartir fuera del equipo organizador.</p>

      <div className="mt-3 overflow-x-auto border border-stone-200 bg-white">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="border-b border-stone-200 bg-paper text-xs uppercase tracking-wider text-graphite">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">Nombres</th>
              <th className="p-3">Apellidos</th>
              <th className="p-3">DPI</th>
              <th className="p-3">Institución</th>
              <th className="p-3">Edad</th>
              <th className="p-3">Correo</th>
              <th className="p-3">Teléfono</th>
              <th className="p-3">Registro</th>
              <th className="p-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {rows.map((r) => (
              <tr key={r.id} className={r.status === "cancelado" ? "text-stone-400" : ""}>
                <td className="p-3 text-xs text-stone-400">{all.indexOf(r) + 1}</td>
                <td className="p-3">{r.firstNames}</td>
                <td className="p-3">{r.lastNames}</td>
                <td className="whitespace-nowrap p-3 font-mono text-xs">{fmtDpi(r.dpi)}</td>
                <td className="p-3">{r.institution}</td>
                <td className="p-3">{r.age}</td>
                <td className="p-3"><a href={`mailto:${r.email}`} className="text-blue-600">{r.email}</a></td>
                <td className="whitespace-nowrap p-3">{r.phone}</td>
                <td className="whitespace-nowrap p-3 text-xs text-graphite">{fmtDate(r.createdAt, { dateStyle: "short", timeStyle: "short" })}</td>
                <td className="p-3">
                  <form action={setRegistrationStatus.bind(null, r.id, ev.id)} className="flex items-center gap-1">
                    <span className={`mr-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs ${TONE[r.status]}`}>{LABEL[r.status]}</span>
                    {r.status !== "asistio" && <button name="status" value="asistio" className="rounded bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800 hover:bg-emerald-100" title="Marcar asistencia">✓ Asistió</button>}
                    {r.status !== "confirmado" && <button name="status" value="confirmado" className="rounded bg-stone-100 px-2 py-0.5 text-xs hover:bg-stone-200" title="Volver a confirmado">↺</button>}
                    {r.status !== "cancelado" && <button name="status" value="cancelado" className="rounded bg-stone-100 px-2 py-0.5 text-xs text-graphite hover:bg-stone-200" title="Cancelar">✕</button>}
                  </form>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={10} className="p-6 text-center text-graphite">{all.length ? "Ningún registro coincide con la búsqueda." : "Todavía no hay confirmaciones para este evento."}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
