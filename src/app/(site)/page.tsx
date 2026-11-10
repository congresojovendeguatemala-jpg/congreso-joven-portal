import Link from "next/link";
import { and, asc, desc, eq, gte } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { Hemicycle } from "@/components/ui/Hemicycle";
import { Container, EngagementStatus, Placeholder, SectionHeader, VerificationBadge, EmptyState } from "@/components/ui";
import { Reveal } from "@/components/ui/Reveal";
import { Timeline } from "@/components/site/Timeline";
import { LISTED_MODALITIES } from "@/lib/modalities";
import { getSettings, getSiteMeta, type Stat } from "@/lib/settings";
import { fmtDate, fmtRange } from "@/lib/format";
import { promoteScheduled } from "@/lib/articles";

export default async function Home() {
  await promoteScheduled();
  const [{ editorialName }, settings, projects, engagements, timeline, articles, events] = await Promise.all([
    getSiteMeta(),
    getSettings<{ "home.stats": Stat[] }>(["home.stats"]),
    db.select().from(s.projects).where(and(eq(s.projects.active, true), eq(s.projects.featured, true))).orderBy(asc(s.projects.sortOrder)),
    db.select().from(s.engagements).orderBy(asc(s.engagements.startDate)),
    db.select().from(s.timelineEvents).where(and(eq(s.timelineEvents.public, true), eq(s.timelineEvents.showInCongress, true))).orderBy(desc(s.timelineEvents.date)).limit(3),
    db
      .select({ slug: s.articles.slug, title: s.articles.title, subtitle: s.articles.subtitle, publishedAt: s.articles.publishedAt, category: s.categories.name })
      .from(s.articles)
      .leftJoin(s.categories, eq(s.articles.categoryId, s.categories.id))
      .where(eq(s.articles.status, "publicado"))
      .orderBy(desc(s.articles.publishedAt))
      .limit(3),
    db.select().from(s.events).where(and(eq(s.events.published, true), gte(s.events.startsAt, new Date()))).orderBy(asc(s.events.startsAt)).limit(3),
  ]);
  const stats = (settings["home.stats"] as Stat[] | undefined) ?? [];

  return (
    <>
      {/* ───────── Hero ───────── */}
      <section className="relative isolate overflow-hidden bg-ink text-white">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_110%,rgba(59,106,224,0.35),transparent_60%)]" />
        <Container className="grid min-h-[92svh] items-center gap-10 pb-16 pt-28 md:grid-cols-[1fr_1.15fr] md:pt-24">
          <div>
            <p className="eyebrow rule-under inline-block text-blue-300">Plataforma juvenil · apartidista · nacional</p>
            <h1 className="mt-7 font-serif text-[2.6rem] leading-[1.05] md:text-[4.2rem]">
              Una iniciativa <span className="text-blue-300">de jóvenes,</span>
              <br className="hidden md:block" /> para jóvenes.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-blue-100/75">
              Congreso Joven Guatemala es una comunidad activa de 2,000 jóvenes en toda la República que abre espacios para que las nuevas generaciones conozcan el funcionamiento del Estado, deliberen, formen liderazgo y construyan propuestas para el país.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/participa" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:bg-glow">
                Cómo participar
              </Link>
              <Link href="/conocenos" className="rounded-full border border-white/25 px-6 py-3 text-sm font-medium text-white transition hover:border-white/60">
                Conoce la organización
              </Link>
            </div>
          </div>
          <div className="relative">
            <Hemicycle lit={104} seed={11} className="w-full drop-shadow-[0_30px_60px_rgba(0,0,0,0.5)]" title="Hemiciclo de 160 curules, motivo de Congreso Joven" />
            <p className="mt-3 text-center text-xs text-blue-100/50">
              Una comunidad activa de 2,000 jóvenes en toda la República.
            </p>
          </div>
        </Container>
      </section>

      {/* ───────── Qué es ───────── */}
      <section className="py-20 md:py-28">
        <Container className="grid gap-12 md:grid-cols-[1fr_1.2fr]">
          <Reveal>
            <SectionHeader n={1} label="Quiénes somos" title="Un modelo legislativo juvenil con alcance nacional" />
          </Reveal>
          <Reveal delay={100}>
            <div className="space-y-5 text-lg leading-relaxed text-graphite">
              <p>
                Congreso Joven es una comunidad activa de 2,000 jóvenes en toda la República: una plataforma juvenil de carácter apartidista orientada a la participación democrática, la formación política, el liderazgo juvenil y la representación territorial.
              </p>
              <p>
                Sus integrantes, jóvenes de entre 20 y 32 años según el registro institucional, se organizan en un modelo inspirado en el Congreso de la República y ejercen períodos de un año.
              </p>
              <Link href="/conocenos" className="inline-block text-base font-medium text-blue-600">
                Historia, principios y transparencia →
              </Link>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ───────── Cifras ───────── */}
      {stats.length > 0 && (
        <section className="border-y border-stone-200 bg-white">
          <Container className="grid grid-cols-2 divide-stone-200 md:grid-cols-4 md:divide-x">
            {stats.map((st, i) => (
              <Reveal key={st.label} delay={i * 80} className="px-2 py-10 md:px-8">
                <p className="font-serif text-5xl font-light tracking-tight text-navy-900 md:text-6xl">{st.value}</p>
                <p className="eyebrow mt-3 text-[0.62rem] text-ink">{st.label}</p>
                <p className="mt-2 text-xs text-stone-400">{st.note}</p>
              </Reveal>
            ))}
          </Container>
        </section>
      )}

      {/* ───────── Modalidades ───────── */}
      <section className="py-20 md:py-28">
        <Container>
          <SectionHeader n={2} label="Participa" title="Seis formas de involucrarte" intro="Cada modalidad tiene su propio proceso. Todas las solicitudes son revisadas por el equipo institucional." action={{ href: "/participa", label: "Todas las modalidades" }} />
          <div className="grid gap-px bg-stone-200 sm:grid-cols-2 lg:grid-cols-3">
            {LISTED_MODALITIES.map((m) => (
              <Link key={m.slug} href={`/participa/${m.slug}`} className="group relative bg-paper p-7 transition hover:bg-white">
                <span className="font-serif text-4xl font-light text-blue-600/40 transition group-hover:text-blue-600">{m.letter}</span>
                <h3 className="mt-4 font-serif text-xl">{m.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-graphite">{m.short}</p>
                <span className="mt-5 inline-block text-sm font-medium text-blue-600 opacity-0 transition group-hover:opacity-100">Postular →</span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* ───────── Relación con el Congreso ───────── */}
      <section className="bg-ink py-20 text-white md:py-28">
        <Container className="grid gap-14 md:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeader n={3} label="Congreso de la República" title="Diálogo con el Organismo Legislativo" intro="Encuentros documentados con diputados y bancadas. Cada registro enlaza a su fuente oficial e indica quién lo organizó." dark action={{ href: "/congreso", label: "Cronología completa" }} />
          </div>
          <Timeline items={timeline} dark />
        </Container>
      </section>

      {/* ───────── Proyectos ───────── */}
      <section className="py-20 md:py-28">
        <Container>
          <SectionHeader n={4} label="Proyectos institucionales" title="Del debate a la acción" action={{ href: "/proyectos", label: "Todos los proyectos" }} />
          <div className="grid gap-6 md:grid-cols-2">
            {projects.map((p) => (
              <Link key={p.slug} href={`/proyectos/${p.slug}`} className="group block border border-stone-200 bg-white transition hover:border-blue-500/50 hover:shadow-[0_20px_50px_-30px_rgba(11,26,61,0.5)]">
                <Placeholder label="Fotografía del proyecto" hint="Pendiente de recibir" className="aspect-[16/8] border-0 border-b" />
                <div className="p-7">
                  <div className="flex items-center gap-3">
                    <VerificationBadge level={p.verification} />
                    {p.startDate && <span className="text-xs text-stone-400">{fmtDate(p.startDate)}</span>}
                  </div>
                  <h3 className="mt-3 font-serif text-2xl group-hover:text-blue-600">{p.name}</h3>
                  <p className="mt-2 leading-relaxed text-graphite">{p.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* ───────── Internacional ───────── */}
      <section className="border-t border-stone-200 bg-white py-20 md:py-28">
        <Container>
          <SectionHeader n={5} label="Relaciones internacionales" title="Proyección internacional" intro="Participaciones proyectadas, confirmadas y realizadas, con su estado actualizado." action={{ href: "/internacional", label: "Ver relaciones internacionales" }} />
          <div className="grid gap-6 md:grid-cols-2">
            {engagements.map((e) => (
              <Link key={e.slug} href={`/internacional/${e.slug}`} className="group flex flex-col justify-between border border-stone-200 p-7 transition hover:border-blue-500/50">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="eyebrow text-blue-600">{e.country}</span>
                    <EngagementStatus status={e.status} />
                  </div>
                  <h3 className="mt-4 font-serif text-2xl group-hover:text-blue-600">{e.name}</h3>
                  <p className="mt-2 text-sm text-graphite">{fmtRange(e.startDate, e.endDate)}</p>
                </div>
                {e.statusNote && <p className="mt-6 border-t border-stone-200 pt-4 text-sm text-graphite">{e.statusNote}</p>}
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* ───────── Actualidad + Convocatorias ───────── */}
      <section className="py-20 md:py-28">
        <Container className="grid gap-14 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <SectionHeader n={6} label={editorialName} title="Últimas publicaciones" action={{ href: "/actualidad", label: "Ir al medio" }} />
            {articles.length === 0 ? (
              <EmptyState title="Aún no hay artículos publicados">
                Las publicaciones aparecerán aquí después de la revisión editorial.{" "}
                <Link href="/participa/autor" className="text-blue-600">
                  ¿Quieres escribir?
                </Link>
              </EmptyState>
            ) : (
              <ul className="divide-y divide-stone-200 border-y border-stone-200">
                {articles.map((a) => (
                  <li key={a.slug}>
                    <Link href={`/actualidad/${a.slug}`} className="group block py-6">
                      <span className="eyebrow text-blue-600">{a.category}</span>
                      <h3 className="mt-2 font-serif text-xl group-hover:text-blue-600">{a.title}</h3>
                      <p className="mt-1 text-sm text-stone-400">{fmtDate(a.publishedAt)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <SectionHeader label="Convocatorias y eventos" />
            {events.length === 0 ? (
              <EmptyState title="No hay convocatorias abiertas">
                Puedes dejar tus datos para recibir la próxima.{" "}
                <Link href="/participa/participante" className="text-blue-600">
                  Inscribirme
                </Link>
              </EmptyState>
            ) : (
              <ul className="space-y-4">
                {events.map((ev) => (
                  <li key={ev.slug}>
                    <Link href={`/eventos/${ev.slug}`} className="group flex gap-4 border border-stone-200 bg-white p-4 transition hover:border-blue-500/50">
                      {ev.images?.[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={ev.images[0]} alt="" loading="lazy" className="h-24 w-20 shrink-0 object-cover" />
                      )}
                      <div>
                        <p className="eyebrow text-blue-600">{fmtDate(ev.startsAt)}</p>
                        <p className="mt-2 font-serif text-lg leading-snug group-hover:text-blue-600">{ev.title}</p>
                        {ev.summary && <p className="text-sm text-graphite">{ev.summary}</p>}
                        {ev.location && <p className="mt-1 text-xs text-stone-400">{ev.location}</p>}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Container>
      </section>

      {/* ───────── Llamado final ───────── */}
      <section className="relative overflow-hidden bg-navy-900 py-20 text-white">
        <Hemicycle lit={6} seed={3} className="pointer-events-none absolute -bottom-24 left-1/2 w-[900px] max-w-none -translate-x-1/2 opacity-25" />
        <Container className="relative text-center">
          <p className="eyebrow text-blue-300">Estructura nacional</p>
          <h2 className="mx-auto mt-5 max-w-2xl font-serif text-3xl md:text-5xl">Autoridades, órganos y presencia en los 22 departamentos.</h2>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/estructura" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink hover:bg-glow">
              Ver organigrama
            </Link>
            <Link href="/territorio" className="rounded-full border border-white/25 px-6 py-3 text-sm font-medium hover:border-white/60">
              Mapa territorial
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
