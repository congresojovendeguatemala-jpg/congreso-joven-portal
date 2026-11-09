import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { Container, EmptyState, PageHero } from "@/components/ui";
import { fmtDate } from "@/lib/format";

export const metadata: Metadata = { title: "Eventos y convocatorias" };

export default async function Eventos() {
  const events = await db.select().from(s.events).where(eq(s.events.published, true)).orderBy(asc(s.events.startsAt));
  const now = Date.now();
  const upcoming = events.filter((e) => e.startsAt.getTime() >= now);
  const past = events.filter((e) => e.startsAt.getTime() < now).reverse();
  return (
    <>
      <PageHero label="Calendario institucional" title="Eventos y convocatorias" intro="Encuentros, capacitaciones, parlamentos juveniles y actividades abiertas." />
      <section className="py-20">
        <Container className="max-w-4xl space-y-12">
          {upcoming.length === 0 ? (
            <EmptyState title="No hay eventos programados">
              <Link href="/participa/participante" className="text-blue-600">Déjanos tus datos</Link> y te avisaremos de la próxima convocatoria.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-stone-200 border-y border-stone-200">
              {upcoming.map((e) => (
                <li key={e.id} className="grid gap-4 py-6 md:grid-cols-[160px_1fr_auto] md:items-center">
                  <time className="eyebrow text-blue-600">{fmtDate(e.startsAt)}</time>
                  <div>
                    <p className="font-serif text-xl">{e.title}</p>
                    {e.location && <p className="text-sm text-graphite">{e.location}</p>}
                  </div>
                  {e.registrationOpen && <Link href="/participa/participante" className="text-sm font-medium text-blue-600">Inscribirme →</Link>}
                </li>
              ))}
            </ul>
          )}
          {past.length > 0 && (
            <div>
              <p className="eyebrow mb-4 text-stone-400">Eventos anteriores</p>
              <ul className="space-y-2 text-graphite">{past.map((e) => <li key={e.id}>{fmtDate(e.startsAt)} · {e.title}</li>)}</ul>
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
