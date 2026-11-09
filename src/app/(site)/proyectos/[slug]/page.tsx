import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { Container, PageHero, Placeholder, SectionHeader, VerificationBadge } from "@/components/ui";

type P = { params: Promise<{ slug: string }> };

const load = async (slug: string) => (await db.select().from(s.projects).where(eq(s.projects.slug, slug)))[0];

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const p = await load((await params).slug);
  return { title: p?.name ?? "Proyecto", description: p?.summary ?? undefined };
}

export default async function Proyecto({ params }: P) {
  const p = await load((await params).slug);
  if (!p || !p.active) notFound();
  return (
    <>
      <PageHero label="Proyectos institucionales" title={p.name} intro={p.summary} />
      <section className="py-20">
        <Container className="grid gap-14 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-12">
            {p.body ? <div className="prose-cj text-lg text-graphite">{p.body}</div> : <Placeholder icon="doc" label="Descripción completa" hint="Pendiente de recibir" className="min-h-40" />}
            {p.objectives && p.objectives.length > 0 && (
              <div>
                <SectionHeader label="Objetivos" />
                <ul className="space-y-3">
                  {p.objectives.map((o) => (
                    <li key={o} className="flex gap-4 border-b border-stone-200 pb-3 text-lg">
                      <span className="text-blue-600">—</span>
                      {o}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <SectionHeader label="Galería y documentos" />
              <div className="grid gap-4 sm:grid-cols-3">
                <Placeholder label="Fotografías" className="aspect-square" />
                <Placeholder label="Videos" className="aspect-square" />
                <Placeholder icon="doc" label="Documentos" className="aspect-square" />
              </div>
            </div>
          </div>
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="border border-stone-200 bg-white p-6">
              <p className="eyebrow text-blue-600">Ficha</p>
              <dl className="mt-4 space-y-4">
                {(p.facts ?? []).map((f) => (
                  <div key={f.label} className="border-b border-stone-200 pb-3">
                    <dt className="text-xs text-stone-400">{f.label}</dt>
                    <dd className="mt-1 font-serif text-lg">{f.value}</dd>
                    <VerificationBadge level={f.verification} />
                  </div>
                ))}
                {(p.facts ?? []).length === 0 && <p className="text-sm text-graphite">Participantes, resultados y cifras se publicarán con sus fuentes.</p>}
              </dl>
            </div>
            <Link href="/proyectos" className="mt-6 inline-block text-sm text-blue-600">← Todos los proyectos</Link>
          </aside>
        </Container>
      </section>
    </>
  );
}
