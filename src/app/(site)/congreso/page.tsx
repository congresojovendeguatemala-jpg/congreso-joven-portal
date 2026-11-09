import type { Metadata } from "next";
import { and, desc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { Container, PageHero } from "@/components/ui";
import { Timeline } from "@/components/site/Timeline";

export const metadata: Metadata = { title: "Relación con el Congreso de la República", description: "Cronología de encuentros de Congreso Joven con el Organismo Legislativo de Guatemala." };

export default async function Congreso() {
  const items = await db.select().from(s.timelineEvents).where(and(eq(s.timelineEvents.public, true), eq(s.timelineEvents.showInCongress, true))).orderBy(desc(s.timelineEvents.date));
  return (
    <>
      <PageHero n={8} label="Congreso de la República" title="Diálogo con el Organismo Legislativo" intro="Archivo de actividades con diputados y bancadas. Se indica en cada caso si la actividad la organizó Congreso Joven, el Congreso de la República o un despacho legislativo." />
      <section className="py-20">
        <Container className="max-w-4xl">
          <p className="mb-12 border-l-2 border-blue-600 pl-4 text-sm text-graphite">
            Congreso Joven es una organización independiente. Su participación en actividades del Congreso de la República no implica representación oficial de ese Organismo.
          </p>
          <Timeline items={items} />
        </Container>
      </section>
    </>
  );
}
