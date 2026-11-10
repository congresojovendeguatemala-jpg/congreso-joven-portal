import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { Container, EmptyState, PageHero } from "@/components/ui";
import { fmtDate } from "@/lib/format";

export const metadata: Metadata = { title: "Eventos y convocatorias" };

const time = (d: Date) => new Intl.DateTimeFormat("es-GT", { timeZone: "America/Guatemala", hour: "numeric", minute: "2-digit" }).format(d);

export default async function Eventos() {
  const events = await db.select().from(s.events).where(eq(s.events.published, true)).orderBy(asc(s.events.startsAt));
  const now = Date.now();
  // Un evento sigue en «próximos» hasta que termina (o hasta 4 h después de empezar si no tiene hora de fin).
  const isPast = (e: (typeof events)[number]) => (e.endsAt ?? new Date(e.startsAt.getTime() + 4 * 3600_000)).getTime() < now;
  const upcoming = events.filter((e) => !isPast(e));
  const past = events.filter(isPast).reverse();
  return (
    <>
      <PageHero label="Calendario institucional" title="Eventos y convocatorias" intro="Encuentros, conferencias, parlamentos juveniles y actividades abiertas." />
      <section className="py-20">
        <Container className="max-w-5xl space-y-14">
          {upcoming.length === 0 ? (
            <EmptyState title="No hay eventos programados">
              <Link href="/participa/participante" className="text-blue-600">Déjanos tus datos</Link> y te avisaremos de la próxima convocatoria.
            </EmptyState>
          ) : (
            <div className="space-y-8">
              {upcoming.map((e) => (
                <Link key={e.id} href={`/eventos/${e.slug}`} className="group grid gap-6 border border-stone-200 bg-white p-5 transition hover:border-blue-500/50 hover:shadow-[0_20px_50px_-30px_rgba(11,26,61,0.5)] md:grid-cols-[220px_1fr] md:p-6">
                  {e.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.images[0]} alt={`Afiche: ${e.title}`} loading="lazy" className="aspect-[4/5] w-full object-cover" />
                  ) : (
                    <div className="flex aspect-[4/5] flex-col items-center justify-center bg-navy-900 text-white">
                      <span className="font-serif text-5xl">{e.startsAt.toLocaleDateString("es-GT", { day: "numeric", timeZone: "America/Guatemala" })}</span>
                      <span className="eyebrow mt-2 text-blue-300">{fmtDate(e.startsAt, { month: "long" })}</span>
                    </div>
                  )}
                  <div className="self-center">
                    <p className="eyebrow text-blue-600">{fmtDate(e.startsAt, { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · {time(e.startsAt)}</p>
                    <h2 className="mt-3 font-serif text-3xl leading-tight group-hover:text-blue-600">{e.title}</h2>
                    {e.summary && <p className="mt-2 text-lg text-graphite">{e.summary}</p>}
                    {e.location && <p className="mt-4 text-sm text-graphite">📍 {e.location}</p>}
                    {e.speakers && e.speakers.length > 0 && (
                      <p className="mt-2 text-sm text-graphite">
                        <span className="font-medium text-ink">Participan:</span> {e.speakers.map((x) => x.name).join(" · ")}
                      </p>
                    )}
                    <span className="mt-5 inline-block text-sm font-medium text-blue-600">Ver detalles →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {past.length > 0 && (
            <div>
              <p className="eyebrow mb-4 text-stone-400">Eventos anteriores</p>
              <ul className="divide-y divide-stone-200 border-y border-stone-200">
                {past.map((e) => (
                  <li key={e.id}>
                    <Link href={`/eventos/${e.slug}`} className="flex flex-wrap gap-x-4 py-3 text-graphite hover:text-blue-600">
                      <span className="text-stone-400">{fmtDate(e.startsAt)}</span> {e.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
