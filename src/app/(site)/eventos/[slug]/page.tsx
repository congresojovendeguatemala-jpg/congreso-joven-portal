import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { Container } from "@/components/ui";
import { Lightbox } from "@/components/site/Lightbox";
import { fmtDate } from "@/lib/format";

type P = { params: Promise<{ slug: string }> };
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const load = async (slug: string) => (await db.select().from(s.events).where(and(eq(s.events.slug, slug), eq(s.events.published, true))))[0];
const time = (d: Date) => new Intl.DateTimeFormat("es-GT", { timeZone: "America/Guatemala", hour: "numeric", minute: "2-digit" }).format(d);

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const e = await load((await params).slug);
  if (!e) return { title: "Evento" };
  const description = [e.summary, `${fmtDate(e.startsAt)} · ${e.location ?? ""}`].filter(Boolean).join(" — ");
  return { title: e.title, description, openGraph: { title: e.title, description, images: e.images?.[0] ? [e.images[0]] : undefined } };
}

export default async function Evento({ params }: P) {
  const e = await load((await params).slug);
  if (!e) notFound();
  const ended = (e.endsAt ?? new Date(e.startsAt.getTime() + 4 * 3600_000)).getTime() < Date.now();
  const groups = [...new Set((e.speakers ?? []).map((x) => x.group || "Participantes"))];
  const paragraphs = (e.body ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.title,
    description: e.summary ?? undefined,
    startDate: e.startsAt.toISOString(),
    endDate: e.endsAt?.toISOString(),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: e.location ? { "@type": "Place", name: e.location, address: { "@type": "PostalAddress", addressCountry: "GT" } } : undefined,
    image: (e.images ?? []).map((u) => (u.startsWith("http") ? u : `${SITE}${u}`)),
    performer: (e.speakers ?? []).map((x) => ({ "@type": "Person", name: x.name })),
    organizer: { "@type": "Organization", name: "Congreso Joven Guatemala", url: SITE },
  };

  return (
    <article className="pb-24 pt-28 md:pt-36">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Container>
        <Link href="/eventos" className="text-sm text-blue-600">← Eventos y convocatorias</Link>
        <div className="mt-8 grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="eyebrow text-blue-600">{ended ? "Evento realizado" : "Próximo evento"}</p>
            <h1 className="mt-4 font-serif text-4xl leading-tight md:text-5xl">{e.title}</h1>
            {e.summary && <p className="mt-4 text-xl text-graphite">{e.summary}</p>}

            <dl className="mt-8 grid gap-px bg-stone-200 sm:grid-cols-2">
              <div className="bg-white p-5">
                <dt className="eyebrow text-[0.62rem] text-stone-400">Fecha</dt>
                <dd className="mt-1 font-serif text-xl">{fmtDate(e.startsAt, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</dd>
              </div>
              <div className="bg-white p-5">
                <dt className="eyebrow text-[0.62rem] text-stone-400">Hora</dt>
                <dd className="mt-1 font-serif text-xl">{time(e.startsAt)}{e.endsAt ? ` – ${time(e.endsAt)}` : ""}</dd>
              </div>
              {e.location && (
                <div className="bg-white p-5 sm:col-span-2">
                  <dt className="eyebrow text-[0.62rem] text-stone-400">Lugar</dt>
                  <dd className="mt-1 font-serif text-xl">{e.location}</dd>
                </div>
              )}
            </dl>

            {!ended && (
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={`/eventos/${e.slug}/calendario`} className="rounded-full bg-navy-900 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-600">
                  Agregar a mi calendario
                </a>
                {e.registrationOpen && (
                  <Link href="/participa/participante" className="rounded-full border border-navy-900 px-6 py-3 text-sm font-semibold text-navy-900 hover:bg-navy-900 hover:text-white">
                    Inscribirme
                  </Link>
                )}
              </div>
            )}

            {paragraphs.length > 0 && (
              <div className="prose-cj mt-10 text-lg text-graphite">
                {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
              </div>
            )}

            {groups.map((g) => (
              <section key={g} className="mt-10">
                <h2 className="eyebrow rule-under inline-block text-blue-600">{g}</h2>
                <ul className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
                  {(e.speakers ?? []).filter((x) => (x.group || "Participantes") === g).map((x) => (
                    <li key={x.name} className="border-l-2 border-blue-600 pl-4">
                      <p className="font-serif text-xl">{x.name}</p>
                      {x.role && <p className="mt-1 text-sm text-graphite">{x.role}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          {e.images && e.images.length > 0 && (
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <p className="eyebrow mb-3 text-stone-400">Afiches · toca para ampliar</p>
              <Lightbox fit="poster" photos={e.images.map((url, i) => ({ id: i, url, title: `${e.title} — afiche ${i + 1}`, caption: null, credit: null }))} />
            </aside>
          )}
        </div>
      </Container>
    </article>
  );
}
