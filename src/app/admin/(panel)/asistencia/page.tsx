import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { requireCapability } from "@/lib/auth";
import { fmtDate } from "@/lib/format";

export default async function Asistencia() {
  await requireCapability("events.manage");
  const r = s.eventRegistrations;
  const rows = await db
    .select({
      id: s.events.id,
      title: s.events.title,
      slug: s.events.slug,
      startsAt: s.events.startsAt,
      capacity: s.events.capacity,
      registrationOpen: s.events.registrationOpen,
      confirmados: sql<number>`count(${r.id}) filter (where ${r.status} <> 'cancelado')`.mapWith(Number),
      asistieron: sql<number>`count(${r.id}) filter (where ${r.status} = 'asistio')`.mapWith(Number),
      cancelados: sql<number>`count(${r.id}) filter (where ${r.status} = 'cancelado')`.mapWith(Number),
    })
    .from(s.events)
    .leftJoin(r, eq(r.eventId, s.events.id))
    .groupBy(s.events.id)
    .orderBy(desc(s.events.startsAt));
  const visible = rows.filter((e) => e.registrationOpen || e.confirmados + e.cancelados > 0);

  return (
    <div className="max-w-5xl">
      <h1 className="font-serif text-3xl">Asistencia a eventos</h1>
      <p className="mt-1 text-sm text-graphite">
        Confirmaciones recibidas desde el formulario de cada evento. Para abrir o cerrar las inscripciones, edita el evento en «Eventos y convocatorias».
      </p>
      <div className="mt-6 grid gap-4">
        {visible.map((e) => (
          <Link key={e.id} href={`/admin/asistencia/${e.id}`} className="grid gap-4 border border-stone-200 bg-white p-5 hover:border-blue-500 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="font-serif text-xl">{e.title}</p>
              <p className="text-sm text-graphite">
                {fmtDate(e.startsAt, { dateStyle: "long", timeStyle: "short" })} · {e.registrationOpen ? "Inscripciones abiertas" : "Inscripciones cerradas"}
              </p>
            </div>
            <div className="flex gap-6 text-center">
              <div>
                <p className="font-serif text-3xl text-navy-900">{e.confirmados}</p>
                <p className="text-xs text-graphite">Confirmados{e.capacity ? ` / ${e.capacity}` : ""}</p>
              </div>
              <div>
                <p className="font-serif text-3xl text-emerald-700">{e.asistieron}</p>
                <p className="text-xs text-graphite">Asistieron</p>
              </div>
              <div>
                <p className="font-serif text-3xl text-stone-400">{e.cancelados}</p>
                <p className="text-xs text-graphite">Cancelados</p>
              </div>
            </div>
          </Link>
        ))}
        {visible.length === 0 && <p className="border border-dashed border-stone-300 p-8 text-center text-sm text-graphite">Ningún evento tiene inscripciones abiertas todavía.</p>}
      </div>
    </div>
  );
}
