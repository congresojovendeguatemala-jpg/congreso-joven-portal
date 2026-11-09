import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { Container } from "@/components/ui";
import { ApplicationForm } from "@/components/site/ApplicationForm";
import { getModality } from "@/lib/modalities";

type P = { params: Promise<{ modalidad: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const m = getModality((await params).modalidad);
  return { title: m?.title ?? "Participa", description: m?.description };
}

export default async function Modalidad({ params }: P) {
  const m = getModality((await params).modalidad);
  if (!m || m.slug === "contacto") notFound();
  const departments = await db.select({ slug: s.departments.slug, name: s.departments.name }).from(s.departments).orderBy(asc(s.departments.name));

  return (
    <section className="pb-24 pt-28 md:pt-36">
      <Container className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <Link href="/participa" className="text-sm text-blue-600">← Modalidades</Link>
          <p className="mt-8 font-serif text-6xl font-light text-blue-600/50">{m.letter}</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight">{m.title}</h1>
          <p className="mt-4 leading-relaxed text-graphite">{m.description}</p>
          {m.steps.length > 0 && (
            <ol className="mt-8 space-y-4 border-l border-stone-200 pl-5">
              {m.steps.map((st, i) => (
                <li key={st} className="text-sm">
                  <span className="eyebrow mr-2 text-blue-600">Paso {i + 1}</span>
                  <span className="text-graphite">{st}</span>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-8 text-xs text-stone-400">Los datos personales de postulantes no se publican y solo los consulta el personal autorizado.</p>
        </aside>
        <div className="border border-stone-200 bg-white p-6 md:p-10">
          <ApplicationForm slug={m.slug} fields={m.fields} departments={departments} />
        </div>
      </Container>
    </section>
  );
}
