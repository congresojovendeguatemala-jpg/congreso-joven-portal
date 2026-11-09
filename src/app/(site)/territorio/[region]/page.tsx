import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { Container, PageHero, Placeholder, SectionHeader } from "@/components/ui";

type P = { params: Promise<{ region: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const [r] = await db.select().from(s.regions).where(eq(s.regions.slug, (await params).region));
  return { title: r?.name ?? "Región" };
}

export default async function Region({ params }: P) {
  const [r] = await db.select().from(s.regions).where(eq(s.regions.slug, (await params).region));
  if (!r) notFound();
  const depts = await db.select().from(s.departments).where(eq(s.departments.regionId, r.id));
  return (
    <>
      <PageHero label="Organización territorial" title={r.name} intro={r.description ?? "Coordinación regional, departamentos, actividades y convocatorias de la región."} />
      <section className="py-20">
        <Container className="grid gap-12 md:grid-cols-2">
          <div>
            <SectionHeader label="Coordinación regional" />
            <Placeholder icon="person" label="Coordinación regional" hint="Solo se publican personas confirmadas" className="min-h-56" />
          </div>
          <div>
            <SectionHeader label="Departamentos" />
            {depts.length === 0 ? (
              <Placeholder icon="doc" label="Departamentos" hint="Asignación regional por confirmar" className="min-h-56" />
            ) : (
              <ul className="divide-y divide-stone-200 border-y border-stone-200">
                {depts.map((d) => (
                  <li key={d.id} className="py-4 font-serif text-lg">{d.name}</li>
                ))}
              </ul>
            )}
          </div>
        </Container>
        <Container className="mt-12">
          <Link href="/territorio" className="text-sm text-blue-600">← Volver al mapa</Link>
        </Container>
      </section>
    </>
  );
}
