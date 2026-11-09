import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { Container, PageHero, Placeholder, VerificationBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Proyectos institucionales" };

export default async function Proyectos() {
  const projects = await db.select().from(s.projects).where(eq(s.projects.active, true)).orderBy(asc(s.projects.sortOrder));
  return (
    <>
      <PageHero n={6} label="Proyectos institucionales" title="Del debate a la acción" intro="Parlamentos juveniles, programas educativos, formación política y obras sociales impulsados por Congreso Joven." />
      <section className="py-20">
        <Container className="grid gap-6 md:grid-cols-2">
          {projects.map((p) => (
            <Link key={p.slug} href={`/proyectos/${p.slug}`} className="group border border-stone-200 bg-white transition hover:border-blue-500/50">
              <Placeholder label="Fotografía" hint="Pendiente" className="aspect-[16/8] border-0 border-b" />
              <div className="p-7">
                <VerificationBadge level={p.verification} />
                <h2 className="mt-3 font-serif text-2xl group-hover:text-blue-600">{p.name}</h2>
                <p className="mt-2 leading-relaxed text-graphite">{p.summary}</p>
              </div>
            </Link>
          ))}
        </Container>
      </section>
    </>
  );
}
