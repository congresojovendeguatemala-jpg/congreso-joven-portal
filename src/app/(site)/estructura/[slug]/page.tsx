import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, desc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { Container, Placeholder, VerificationBadge } from "@/components/ui";
import { Portrait } from "@/components/ui/Portrait";

type P = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const [person] = await db.select().from(s.people).where(and(eq(s.people.slug, slug), eq(s.people.public, true)));
  if (!person) return null;
  const positions = await db
    .select()
    .from(s.positions)
    .where(eq(s.positions.personId, person.id))
    .orderBy(desc(s.positions.current), desc(s.positions.elect), asc(s.positions.sortOrder));
  return { person, positions };
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const d = await load((await params).slug);
  return { title: d?.person.fullName ?? "Autoridad" };
}

export default async function Ficha({ params }: P) {
  const d = await load((await params).slug);
  if (!d) notFound();
  const { person, positions } = d;
  return (
    <section className="bg-paper pb-20 pt-32">
      <Container className="grid gap-12 md:grid-cols-[320px_1fr]">
        <Portrait src={person.photoUrl} alt={person.fullName} credit={person.photoCredit} className="aspect-[4/5] md:self-start" />
        <div>
          <Link href="/estructura" className="text-sm text-blue-600">← Estructura nacional</Link>
          <h1 className="mt-6 font-serif text-4xl md:text-5xl">{person.knownAs ?? person.fullName}</h1>
          {person.knownAs && <p className="mt-2 text-graphite">{person.fullName}</p>}
          <ul className="mt-6 space-y-4">
            {positions.map((p) => (
              <li key={p.id} className="border-l-2 border-blue-600 pl-4">
                <p className="eyebrow text-blue-600">
                  {p.title}
                  {p.current && <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[0.6rem] tracking-normal normal-case">Vigente</span>}
                  {p.elect && <span className="ml-2 rounded-full bg-glow px-2 py-0.5 text-[0.6rem] tracking-normal normal-case text-ink">Electo</span>}
                </p>
                {p.periodLabel && <p className="mt-1 text-sm text-graphite">{p.periodLabel}</p>}
                <div className="mt-2 flex items-center gap-3">
                  <VerificationBadge level={p.verification} />
                  {p.sourceUrl && (
                    <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-stone-400 underline underline-offset-2 hover:text-blue-600">
                      Fuente ↗
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {person.bio ? <p className="leading-relaxed text-graphite sm:col-span-2">{person.bio}</p> : <Placeholder icon="doc" label="Biografía" hint="Pendiente de recibir" className="min-h-32" />}
            {!person.trajectory && <Placeholder icon="doc" label="Trayectoria en Congreso Joven" hint="Pendiente" className="min-h-32" />}
          </div>
        </div>
      </Container>
    </section>
  );
}
