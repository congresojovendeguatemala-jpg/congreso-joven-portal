import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { Container, PageHero, SectionHeader, VerificationBadge } from "@/components/ui";
import { Portrait } from "@/components/ui/Portrait";
import { OrgChart } from "@/components/site/OrgChart";

export const metadata: Metadata = { title: "Estructura nacional", description: "Organigrama oficial, presidencias, Tribunal de Honor, comisiones y presidencias regionales de Congreso Joven Guatemala." };

export default async function Estructura() {
  const [organs, positions] = await Promise.all([
    db.select().from(s.organs).where(eq(s.organs.active, true)).orderBy(asc(s.organs.sortOrder)),
    db
      .select({
        id: s.positions.id,
        title: s.positions.title,
        periodLabel: s.positions.periodLabel,
        current: s.positions.current,
        elect: s.positions.elect,
        verification: s.positions.verification,
        organId: s.positions.organId,
        organSlug: s.organs.slug,
        slug: s.people.slug,
        name: s.people.fullName,
        knownAs: s.people.knownAs,
        photo: s.people.photoUrl,
      })
      .from(s.positions)
      .innerJoin(s.people, eq(s.positions.personId, s.people.id))
      .leftJoin(s.organs, eq(s.positions.organId, s.organs.id))
      .where(eq(s.people.public, true))
      .orderBy(asc(s.positions.sortOrder)),
  ]);

  // Galería en orden cronológico según el período («Período 2025–2026»…)
  const presidents = positions
    .filter((p) => p.organSlug === "presidencia")
    .sort((a, b) => (a.periodLabel ?? "").localeCompare(b.periodLabel ?? ""));
  const currentPres = presidents.find((p) => p.current);
  const electPres = presidents.find((p) => p.elect);
  const activeOthers = positions.filter((p) => p.organSlug !== "presidencia" && p.current);
  const others = positions.filter((p) => p.organSlug !== "presidencia" && !p.current);
  const holders = positions.filter((p) => p.current).map((p) => ({ organId: p.organId, name: p.knownAs ?? p.name, slug: p.slug }));

  return (
    <>
      <PageHero n={2} label="Estructura nacional" title="Órganos, autoridades y representación" intro="Organigrama oficial de Congreso Joven Guatemala: Presidencia, Secretaría General y Coordinación Nacional, vicepresidencias, secretarías, Vocería Oficial, bancadas y Tribunal de Honor." />

      {/* ───── Presidencia ───── */}
      <section className="border-b border-stone-200 bg-white py-20">
        <Container>
          <SectionHeader n={1} label="Autoridades en funciones" title="Conducción de Congreso Joven" />
          <div className="grid gap-8 md:grid-cols-2">
            {currentPres && <PresidentCard p={currentPres} badge="Presidencia vigente" />}
            {electPres && <PresidentCard p={electPres} badge="Presidente electo" />}
          </div>
          {activeOthers.length > 0 && (
            <ul className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {activeOthers.map((p) => (
                <li key={p.id}>
                  <Link href={`/estructura/${p.slug}`} className="group block">
                    <Portrait src={p.photo} alt={p.name} className="aspect-[4/5] transition group-hover:opacity-90" />
                    <p className="eyebrow mt-4 text-[0.6rem] leading-relaxed text-blue-600">{p.title}</p>
                    <p className="mt-1 font-serif text-lg leading-snug group-hover:text-blue-600">{p.knownAs ?? p.name}</p>
                    <div className="mt-2"><VerificationBadge level={p.verification} /></div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>

      {/* ───── Organigrama ───── */}
      <section className="py-20">
        <Container>
          <SectionHeader n={2} label="Organigrama" title="Estructura Nacional" intro="Los colores corresponden a las ramas del organigrama oficial. Los titulares de cada cargo se publican a medida que se confirman." />
          <OrgChart organs={organs} holders={holders} />
        </Container>
      </section>

      {/* ───── Galería de presidentes ───── */}
      <section className="relative overflow-hidden bg-ink py-20 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(244,230,192,0.10),transparent_60%)]" />
        <Container className="relative">
          <SectionHeader n={3} label="Galería institucional" title="Presidentes de Congreso Joven" dark />
          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {presidents.map((p) => (
              <li key={p.id}>
                <Link href={`/estructura/${p.slug}`} className="group block">
                  <div className="border border-glow/40 p-1.5 transition group-hover:border-glow">
                    <Portrait src={p.photo} alt={p.name} className="aspect-[3/4]" />
                  </div>
                  <p className="eyebrow mt-4 text-[0.62rem] text-glow">{p.elect ? "Presidente electo" : p.current ? "Presidencia vigente" : "Presidencia"}</p>
                  <p className="mt-1 font-serif text-xl leading-snug group-hover:text-glow">{p.knownAs ?? p.name}</p>
                  <p className="mt-1 text-sm text-blue-100/60">{p.periodLabel?.replace("Período ", "")}</p>
                </Link>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* ───── Registro histórico ───── */}
      {others.length > 0 && (
        <section className="py-20">
          <Container>
            <SectionHeader n={4} label="Registro histórico" title="Otras autoridades documentadas" intro="Cargos registrados en fuentes oficiales. Los períodos completos se confirmarán con las actas de elección." />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {others.map((p) => (
                <Link key={p.id} href={`/estructura/${p.slug}`} className="group block border border-stone-200 bg-white p-5 hover:border-blue-500/50">
                  <p className="eyebrow text-[0.62rem] text-blue-600">{p.title}</p>
                  <p className="mt-2 font-serif text-xl group-hover:text-blue-600">{p.name}</p>
                  {p.periodLabel && <p className="mt-1 text-xs text-graphite/80">{p.periodLabel}</p>}
                  <div className="mt-3"><VerificationBadge level={p.verification} /></div>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}

function PresidentCard({ p, badge }: { p: { slug: string; name: string; knownAs: string | null; photo: string | null; periodLabel: string | null; verification: string }; badge: string }) {
  return (
    <Link href={`/estructura/${p.slug}`} className="group grid grid-cols-[120px_1fr] gap-6 border border-stone-200 p-5 transition hover:border-blue-500/50 sm:grid-cols-[160px_1fr]">
      <Portrait src={p.photo} alt={p.name} className="aspect-[3/4]" />
      <div className="self-center">
        <p className="eyebrow text-[0.62rem] text-blue-600">{badge}</p>
        <h3 className={`mt-2 font-serif leading-tight group-hover:text-blue-600 ${(p.knownAs ?? p.name).length > 24 ? "text-xl md:text-2xl" : "text-2xl md:text-3xl"}`}>{p.knownAs ?? p.name}</h3>
        {p.knownAs && <p className="mt-1 text-sm text-graphite">{p.name}</p>}
        <p className="mt-3 text-sm text-graphite">{p.periodLabel}</p>
        <div className="mt-3"><VerificationBadge level={p.verification} /></div>
      </div>
    </Link>
  );
}
