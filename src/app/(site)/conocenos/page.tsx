import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { Container, PageHero, Placeholder, SectionHeader } from "@/components/ui";
import { Timeline } from "@/components/site/Timeline";
import { DocumentList } from "@/components/site/DocumentList";
import { publicDocs } from "@/lib/documents";

export const metadata: Metadata = { title: "Conócenos", description: "Quiénes somos, historia, principios y transparencia de Congreso Joven Guatemala." };

const PRINCIPLES = [
  ["Apartidismo", "Congreso Joven no pertenece ni responde a ningún partido político. Sus espacios están abiertos a jóvenes de toda orientación."],
  ["Representación territorial", "La organización busca presencia en los 22 departamentos y una voz para la juventud de todo el país."],
  ["Formación", "Conocer el funcionamiento del Estado y del proceso legislativo es la base de una participación informada."],
  ["Deliberación democrática", "Las decisiones se construyen mediante debate, votación y respeto a las reglas internas."],
  ["Transparencia", "Autoridades, procesos electorales y documentos se publican con su fecha y su fuente."],
  ["Cooperación", "Diálogo con instituciones nacionales e internacionales para ampliar oportunidades a la juventud."],
];

export default async function Conocenos() {
  const timeline = await db.select().from(s.timelineEvents).where(eq(s.timelineEvents.public, true)).orderBy(asc(s.timelineEvents.date));
  const TRANSPARENCY: [string, string][] = [["estatutos", "Estatutos"], ["reglamento", "Reglamento interno"], ["codigo", "Código de conducta"], ["memoria", "Memoria institucional"]];
  const docs = await publicDocs(TRANSPARENCY.map(([k]) => k));
  const missing = TRANSPARENCY.filter(([k]) => !docs.some((d) => d.docType === k));

  return (
    <>
      <PageHero n={1} label="Conócenos" title={<>Una organización <span className="text-blue-300">de jóvenes, para jóvenes.</span></>} intro="Congreso Joven Guatemala es una plataforma juvenil apartidista, con presencia nacional, orientada a la participación democrática, la formación política y la construcción de propuestas." />

      <section className="py-20">
        <Container className="grid gap-12 md:grid-cols-3">
          {[
            ["Propósito", "Generar oportunidades para que las nuevas generaciones participen en la toma de decisiones, conozcan el funcionamiento del Estado, desarrollen liderazgo y contribuyan al desarrollo de Guatemala."],
            ["Misión", null],
            ["Visión", null],
          ].map(([t, body]) => (
            <div key={t as string}>
              <p className="eyebrow rule-under inline-block text-blue-600">{t}</p>
              {body ? <p className="mt-5 text-lg leading-relaxed text-graphite">{body}</p> : <Placeholder icon="doc" label={`${t} oficial`} hint="Texto aprobado pendiente de recibir" className="mt-5 min-h-40" />}
            </div>
          ))}
        </Container>
      </section>

      <section className="border-y border-stone-200 bg-white py-20">
        <Container>
          <SectionHeader n={2} label="Principios" title="Lo que define a Congreso Joven" intro="Principios de trabajo del portal. Se reemplazarán por los principios oficiales en cuanto estén aprobados." />
          <div className="grid gap-px bg-stone-200 md:grid-cols-3">
            {PRINCIPLES.map(([t, d], i) => (
              <div key={t} className="bg-white p-7">
                <span className="font-serif text-sm text-blue-600">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 font-serif text-xl">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-graphite">{d}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section id="historia" className="py-20">
        <Container className="grid gap-12 md:grid-cols-[0.8fr_1.2fr]">
          <div className="md:sticky md:top-28 md:self-start">
            <SectionHeader n={3} label="Nuestra historia" title="Línea de tiempo" intro="Cada hito indica su fuente y su nivel de verificación. La fundación y las primeras generaciones se incorporarán con los documentos institucionales." />
            <Placeholder icon="doc" label="Fundación" hint="Fecha, fundadores y actas pendientes" className="min-h-36" />
          </div>
          <Timeline items={timeline} />
        </Container>
      </section>

      <section id="transparencia" className="bg-ink py-20 text-white">
        <Container>
          <SectionHeader n={4} label="Transparencia institucional" title="Documentos institucionales" dark intro="Estatutos, reglamentos, código de conducta, memorias e informes. Se publican en el archivo a medida que se aprueban." action={{ href: "/archivo/documentos", label: "Biblioteca de documentos" }} />
          {docs.length > 0 && <DocumentList docs={docs} dark />}
          {missing.length > 0 && (
            <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${docs.length ? "mt-8" : ""}`}>
              {missing.map(([, label]) => (
                <Placeholder key={label} dark icon="doc" label={label} hint="Documento pendiente" className="min-h-40" />
              ))}
            </div>
          )}
          <p className="mt-8 text-sm text-blue-100/60">
            ¿Necesitas información institucional? <Link href="/contacto" className="text-blue-300 underline underline-offset-2">Solicítala aquí</Link>.
          </p>
        </Container>
      </section>
    </>
  );
}
