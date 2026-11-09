import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { Container, EngagementStatus, PageHero, SectionHeader, EmptyState } from "@/components/ui";
import { fmtRange } from "@/lib/format";

export const metadata: Metadata = { title: "Relaciones internacionales" };

const RELATION: Record<string, string> = {
  convenio_firmado: "Convenio firmado",
  colaboracion: "Colaboración",
  contacto: "Contacto institucional",
  participacion_evento: "Participación en evento",
};

export default async function Internacional() {
  const [engagements, partners] = await Promise.all([
    db.select().from(s.engagements).orderBy(asc(s.engagements.startDate)),
    db.select().from(s.partners).where(eq(s.partners.public, true)),
  ]);
  return (
    <>
      <PageHero n={7} label="Relaciones internacionales" title="Proyección internacional" intro="Participaciones en foros y parlamentos juveniles, y directorio de cooperación institucional. Cada actividad muestra su estado real." />
      <section className="py-20">
        <Container>
          <SectionHeader n={1} label="Participaciones" title="Foros y parlamentos juveniles" />
          <div className="space-y-px bg-stone-200">
            {engagements.map((e) => (
              <Link key={e.slug} href={`/internacional/${e.slug}`} className="group grid gap-4 bg-paper p-7 transition hover:bg-white md:grid-cols-[140px_1fr_auto] md:items-center">
                <span className="eyebrow text-blue-600">{e.country}</span>
                <div>
                  <h2 className="font-serif text-2xl group-hover:text-blue-600">{e.name}</h2>
                  <p className="mt-1 text-sm text-graphite">{fmtRange(e.startDate, e.endDate)}{e.host ? ` · ${e.host}` : ""}</p>
                </div>
                <EngagementStatus status={e.status} />
              </Link>
            ))}
          </div>
        </Container>
      </section>
      <section className="border-t border-stone-200 bg-white py-20">
        <Container>
          <SectionHeader n={2} label="Directorio de cooperación" title="Alianzas y organizaciones" intro="Se distingue entre convenios firmados, colaboraciones, contactos institucionales y participaciones en eventos." />
          {partners.length === 0 ? (
            <EmptyState title="Directorio en construcción">Solo se publican alianzas confirmadas por Congreso Joven.</EmptyState>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {partners.map((p) => (
                <div key={p.slug} className="border border-stone-200 p-6">
                  <p className="eyebrow text-blue-600">{RELATION[p.relation]}</p>
                  <h3 className="mt-2 font-serif text-xl">{p.name}</h3>
                  <p className="text-sm text-graphite">{p.country}</p>
                </div>
              ))}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
