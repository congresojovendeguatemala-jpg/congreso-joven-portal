import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { Container, EngagementStatus, PageHero, Placeholder, SectionHeader, VerificationBadge } from "@/components/ui";
import { fmtRange } from "@/lib/format";

type P = { params: Promise<{ slug: string }> };
const load = async (slug: string) => (await db.select().from(s.engagements).where(eq(s.engagements.slug, slug)))[0];

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const e = await load((await params).slug);
  return { title: e?.name ?? "Relaciones internacionales" };
}

export default async function Engagement({ params }: P) {
  const e = await load((await params).slug);
  if (!e) notFound();
  const done = e.status === "realizado";
  return (
    <>
      <PageHero label={`Relaciones internacionales · ${e.country}`} title={e.name} intro={e.summary} />
      <section className="py-20">
        <Container className="grid gap-14 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-12">
            {e.statusNote && (
              <div className="border-l-2 border-amber-600 bg-amber-50 px-5 py-4">
                <EngagementStatus status={e.status} />
                <p className="mt-2 text-graphite">{e.statusNote}</p>
              </div>
            )}
            <div>
              <SectionHeader label="Delegación" />
              {e.delegation && e.delegation.length > 0 ? (
                <ul className="divide-y divide-stone-200 border-y border-stone-200">
                  {e.delegation.map((d) => (
                    <li key={d.name} className="flex items-center justify-between py-4">
                      <span className="font-serif text-xl">{d.name}</span>
                      <span className="flex items-center gap-3 text-sm text-graphite">
                        {done ? "Delegado" : "Delegación propuesta"} <VerificationBadge level={d.verification} />
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <Placeholder icon="person" label="Delegación" hint="Por confirmar" className="min-h-32" />
              )}
            </div>
            <div>
              <SectionHeader label={done ? "Programa y resultados" : "Objetivos y programa"} />
              {e.program || e.results ? (
                <div className="prose-cj text-graphite">
                  {e.program && <p>{e.program}</p>}
                  {done && e.results && <p>{e.results}</p>}
                </div>
              ) : (
                <Placeholder icon="doc" label="Programa" hint="Invitación y programa pendientes" className="min-h-32" />
              )}
            </div>
          </div>
          <aside className="border border-stone-200 bg-white p-6 lg:sticky lg:top-28 lg:self-start">
            <dl className="space-y-4 text-sm">
              <div><dt className="text-stone-400">Estado</dt><dd className="mt-1"><EngagementStatus status={e.status} /></dd></div>
              <div><dt className="text-stone-400">Fechas</dt><dd className="mt-1 font-serif text-lg">{fmtRange(e.startDate, e.endDate)}</dd></div>
              <div><dt className="text-stone-400">País</dt><dd className="mt-1 font-serif text-lg">{e.country}</dd></div>
              {e.host && <div><dt className="text-stone-400">Institución anfitriona</dt><dd className="mt-1 font-serif text-lg">{e.host}</dd></div>}
              {e.costNote && <div><dt className="text-stone-400">Costo</dt><dd className="mt-1 text-graphite">{e.costNote}</dd></div>}
            </dl>
            <Link href="/internacional" className="mt-6 inline-block text-sm text-blue-600">← Relaciones internacionales</Link>
          </aside>
        </Container>
      </section>
    </>
  );
}
