import type { Metadata } from "next";
import { Container, PageHero, Placeholder, SectionHeader, VerificationBadge } from "@/components/ui";
import { DocumentList } from "@/components/site/DocumentList";
import { publicDocs } from "@/lib/documents";

export const metadata: Metadata = { title: "Elecciones y democracia interna" };

const DATA = [
  { value: "2,000", label: "Jóvenes en la comunidad activa", note: "Registro institucional · nov. 2026" },
  { value: "928", label: "Padrón electoral de referencia", note: "Fecha y proceso por confirmar" },
  { value: "22", label: "Departamentos representados", note: "Registro institucional · 2024" },
];

const ELECTORAL: [string, string][] = [["convocatoria", "Convocatorias"], ["reglamento", "Reglamento electoral"], ["resultados", "Resultados y autoridades electas"], ["acta", "Actas"]];

export default async function Elecciones() {
  const docs = await publicDocs(ELECTORAL.map(([k]) => k));
  const missing = ELECTORAL.filter(([k]) => !docs.some((d) => d.docType === k));
  return (
    <>
      <PageHero n={10} label="Elecciones y democracia interna" title="Transparencia electoral" intro="Documentación histórica de los procesos electorales internos: convocatorias, reglamentos, calendarios, candidaturas, resultados y actas. No es un sistema de votación en vivo." />
      <section className="py-20">
        <Container>
          <SectionHeader n={1} label="Datos de referencia" title="Participación electoral" intro="Datos del registro institucional. Se actualizarán con su fecha de corte y documento fuente." />
          <div className="grid gap-px bg-stone-200 md:grid-cols-3">
            {DATA.map((d) => (
              <div key={d.label} className="bg-white p-8">
                <p className="font-serif text-5xl font-light text-navy-900">{d.value}</p>
                <p className="eyebrow mt-3 text-[0.62rem]">{d.label}</p>
                <p className="mt-2 text-xs text-stone-400">{d.note}</p>
                <div className="mt-3"><VerificationBadge level="internal" /></div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-graphite">Participación territorial: Distrito Metropolitano, departamento de Guatemala y departamentos del interior.</p>
        </Container>
      </section>
      <section className="border-t border-stone-200 bg-white py-20">
        <Container>
          <SectionHeader n={2} label="Documentación electoral" title="Procesos por generación" />
          {docs.length > 0 && <DocumentList docs={docs} />}
          {missing.length > 0 && (
            <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${docs.length ? "mt-8" : ""}`}>
              {missing.map(([, label]) => (
                <Placeholder key={label} icon="doc" label={label} hint="Documento pendiente" className="min-h-44" />
              ))}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
