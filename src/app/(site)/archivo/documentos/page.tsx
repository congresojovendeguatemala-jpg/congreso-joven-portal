import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { Container, EmptyState, PageHero } from "@/components/ui";
import { ArchivoNav } from "@/components/site/ArchivoNav";
import { DocumentList } from "@/components/site/DocumentList";
import { DOC_TYPES } from "@/lib/media";

export const metadata: Metadata = { title: "Biblioteca de documentos", description: "Estatutos, reglamentos, actas, informes, convocatorias, memorias y reconocimientos de Congreso Joven Guatemala." };

export default async function Documentos({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const { tipo } = await searchParams;
  const docs = await db
    .select({ id: s.media.id, url: s.media.url, title: s.media.title, caption: s.media.caption, docType: s.media.docType, date: s.media.date, year: s.media.year, bytes: s.media.bytes })
    .from(s.media)
    .where(and(eq(s.media.kind, "document"), eq(s.media.public, true), tipo && tipo in DOC_TYPES ? eq(s.media.docType, tipo) : undefined))
    .orderBy(desc(s.media.date), desc(s.media.createdAt));
  const groups = Object.keys(DOC_TYPES).map((k) => ({ k, items: docs.filter((d) => (d.docType ?? "otro") === k) })).filter((g) => g.items.length);
  return (
    <>
      <PageHero n={9} label="Transparencia" title="Biblioteca de documentos" intro="Estatutos, reglamentos, actas, informes, convocatorias, memorias institucionales y reconocimientos." />
      <ArchivoNav active="/archivo/documentos" />
      <section className="py-14">
        <Container className="max-w-4xl">
          <div className="mb-8 flex flex-wrap gap-2">
            <Link href="/archivo/documentos" className={`rounded-full border px-4 py-1.5 text-sm ${!tipo ? "border-navy-900 bg-navy-900 text-white" : "border-stone-200 bg-white"}`}>Todos</Link>
            {Object.entries(DOC_TYPES).map(([k, v]) => (
              <Link key={k} href={`/archivo/documentos?tipo=${k}`} className={`rounded-full border px-4 py-1.5 text-sm ${tipo === k ? "border-navy-900 bg-navy-900 text-white" : "border-stone-200 bg-white hover:border-blue-500"}`}>{v}</Link>
            ))}
          </div>
          {groups.length === 0 ? (
            <EmptyState title="Aún no hay documentos publicados en esta sección">Los documentos institucionales se publicarán a medida que sean aprobados.</EmptyState>
          ) : (
            groups.map((g) => (
              <div key={g.k} className="mb-12">
                <h2 className="eyebrow rule-under mb-4 inline-block text-blue-600">{DOC_TYPES[g.k]}</h2>
                <DocumentList docs={g.items} />
              </div>
            ))
          )}
        </Container>
      </section>
    </>
  );
}
