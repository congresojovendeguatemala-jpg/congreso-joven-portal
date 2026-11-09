import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHero } from "@/components/ui";
import { LISTED_MODALITIES } from "@/lib/modalities";

export const metadata: Metadata = { title: "Participa", description: "Modalidades de participación en Congreso Joven Guatemala." };

export default function Participa() {
  return (
    <>
      <PageHero n={5} label="Modalidades de participación" title={<>Hay un lugar para ti <span className="text-blue-300">en Congreso Joven.</span></>} intro="Elige cómo quieres involucrarte. Cada modalidad tiene su propio proceso y todas las solicitudes las revisa una persona del equipo institucional." />
      <section className="py-20">
        <Container className="space-y-px bg-stone-200">
          {LISTED_MODALITIES.map((m) => (
            <Link key={m.slug} href={`/participa/${m.slug}`} className="group grid gap-6 bg-paper p-7 transition hover:bg-white md:grid-cols-[80px_1fr_1.2fr_auto] md:items-center md:p-9">
              <span className="font-serif text-5xl font-light text-blue-600/40 transition group-hover:text-blue-600">{m.letter}</span>
              <div>
                <h2 className="font-serif text-2xl">{m.title}</h2>
                <p className="mt-1 text-sm text-graphite">{m.short}</p>
              </div>
              <ol className="flex flex-col gap-1.5 text-xs text-graphite/80">
                {m.steps.map((st, i) => (
                  <li key={st}>
                    <span className="mr-2 text-blue-600">{i + 1}</span>
                    {st}
                  </li>
                ))}
              </ol>
              <span className="text-sm font-medium text-blue-600">Postular →</span>
            </Link>
          ))}
        </Container>
        <Container className="mt-10 text-sm text-graphite">
          ¿Tienes una idea de proyecto? <Link href="/participa/propuesta" className="text-blue-600 underline underline-offset-2">Preséntala aquí</Link>.
        </Container>
      </section>
    </>
  );
}
