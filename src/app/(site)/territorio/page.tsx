import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { Container, PageHero, SectionHeader } from "@/components/ui";
import { TileMap } from "@/components/site/TileMap";

export const metadata: Metadata = { title: "Organización territorial", description: "Mapa interactivo y regiones de Congreso Joven Guatemala." };

export default async function Territorio() {
  const [depts, regions] = await Promise.all([
    db
      .select({ slug: s.departments.slug, name: s.departments.name, x: s.departments.tileX, y: s.departments.tileY, description: s.departments.description, regionSlug: s.regions.slug, regionName: s.regions.name })
      .from(s.departments)
      .leftJoin(s.regions, eq(s.departments.regionId, s.regions.id)),
    db.select().from(s.regions).where(eq(s.regions.active, true)).orderBy(asc(s.regions.sortOrder)),
  ]);
  const unassigned = depts.filter((d) => !d.regionSlug).length;

  return (
    <>
      <PageHero n={4} label="Organización territorial" title="Presencia en todo el país" intro="Congreso Joven se organiza territorialmente en regiones y departamentos. La estructura es administrable: se pueden agregar municipios y nuevas divisiones sin modificar el código." />
      <section className="bg-ink pb-24 text-white">
        <Container>
          <TileMap departments={depts} />
          {unassigned > 0 && (
            <p className="mt-6 text-xs text-blue-100/50">
              {unassigned} de 22 departamentos aún no tienen región asignada. La distribución regional se publicará cuando sea confirmada.
            </p>
          )}
        </Container>
      </section>
      <section className="py-20">
        <Container>
          <SectionHeader n={1} label="Regiones" title="Estructura regional" />
          <div className="grid gap-px bg-stone-200 sm:grid-cols-2 lg:grid-cols-3">
            {regions.map((r) => {
              const n = depts.filter((d) => d.regionSlug === r.slug).length;
              return (
                <Link key={r.slug} href={`/territorio/${r.slug}`} className="group bg-paper p-7 transition hover:bg-white">
                  <h3 className="font-serif text-2xl group-hover:text-blue-600">{r.name}</h3>
                  <p className="mt-2 text-sm text-graphite">{n > 0 ? `${n} departamentos` : "Departamentos por asignar"}</p>
                </Link>
              );
            })}
          </div>
        </Container>
      </section>
    </>
  );
}
