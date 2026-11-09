import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { Container } from "@/components/ui";
import { Portrait } from "@/components/ui/Portrait";
import { promoteScheduled } from "@/lib/articles";
import { fmtDate } from "@/lib/format";

type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const [a] = await db.select().from(s.authors).where(eq(s.authors.slug, (await params).slug));
  return { title: a?.name ?? "Autor", description: a?.bio ?? undefined };
}

export default async function Autor({ params }: P) {
  await promoteScheduled();
  const [author] = await db.select().from(s.authors).where(eq(s.authors.slug, (await params).slug));
  if (!author) notFound();
  const articles = await db
    .select({ id: s.articles.id, slug: s.articles.slug, title: s.articles.title, subtitle: s.articles.subtitle, publishedAt: s.articles.publishedAt, category: s.categories.name })
    .from(s.articles)
    .leftJoin(s.categories, eq(s.articles.categoryId, s.categories.id))
    .where(and(eq(s.articles.authorId, author.id), eq(s.articles.status, "publicado")))
    .orderBy(desc(s.articles.publishedAt));
  const socials = Array.isArray(author.socials) ? (author.socials as { label: string; url: string }[]).filter((x) => /^https:\/\//.test(x.url)) : [];
  return (
    <section className="pb-24 pt-32">
      <Container className="grid max-w-5xl gap-12 md:grid-cols-[220px_1fr]">
        <Portrait src={author.photoUrl} alt={author.name} className="aspect-square md:self-start" />
        <div>
          <p className="eyebrow text-blue-600">Autor</p>
          <h1 className="mt-3 font-serif text-4xl">{author.name}</h1>
          {author.bio && <p className="mt-4 max-w-2xl leading-relaxed text-graphite">{author.bio}</p>}
          {socials.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-4 text-sm">
              {socials.map((x) => (
                <li key={x.url}><a href={x.url} target="_blank" rel="noopener noreferrer" className="text-blue-600">{x.label} ↗</a></li>
              ))}
            </ul>
          )}
          <h2 className="eyebrow mt-12 text-graphite">{articles.length} {articles.length === 1 ? "artículo" : "artículos"}</h2>
          <ul className="mt-3 divide-y divide-stone-200 border-y border-stone-200">
            {articles.map((a) => (
              <li key={a.id}>
                <Link href={`/actualidad/${a.slug}`} className="group block py-5">
                  {a.category && <span className="eyebrow text-[0.6rem] text-blue-600">{a.category}</span>}
                  <span className="mt-1 block font-serif text-xl group-hover:text-blue-600">{a.title}</span>
                  {a.subtitle && <span className="mt-1 block text-sm text-graphite">{a.subtitle}</span>}
                  <span className="mt-1 block text-xs text-stone-400">{fmtDate(a.publishedAt)}</span>
                </Link>
              </li>
            ))}
            {articles.length === 0 && <li className="py-5 text-sm text-graphite">Sin artículos publicados todavía.</li>}
          </ul>
        </div>
      </Container>
    </section>
  );
}
