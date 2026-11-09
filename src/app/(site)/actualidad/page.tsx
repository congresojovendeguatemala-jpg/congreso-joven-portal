import type { Metadata } from "next";
import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { Container, EmptyState, PageHero } from "@/components/ui";
import { getSiteMeta } from "@/lib/settings";
import { promoteScheduled } from "@/lib/articles";
import { fmtDate } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const { editorialName } = await getSiteMeta();
  return { title: editorialName };
}

export default async function Actualidad({ searchParams }: { searchParams: Promise<{ categoria?: string }> }) {
  const { categoria } = await searchParams;
  await promoteScheduled();
  const { editorialName } = await getSiteMeta();
  const [cats, rows] = await Promise.all([
    db.select().from(s.categories).orderBy(asc(s.categories.sortOrder)),
    db
      .select({ slug: s.articles.slug, title: s.articles.title, subtitle: s.articles.subtitle, publishedAt: s.articles.publishedAt, readingMinutes: s.articles.readingMinutes, category: s.categories.name, categorySlug: s.categories.slug, author: s.authors.name })
      .from(s.articles)
      .leftJoin(s.categories, eq(s.articles.categoryId, s.categories.id))
      .leftJoin(s.authors, eq(s.articles.authorId, s.authors.id))
      .where(eq(s.articles.status, "publicado"))
      .orderBy(desc(s.articles.publishedAt)),
  ]);
  const articles = categoria ? rows.filter((a) => a.categorySlug === categoria) : rows;

  return (
    <>
      <PageHero label="Medio institucional" title={editorialName} intro="Análisis, opinión, noticias institucionales e historias de liderazgo escritas por jóvenes. Cada texto pasa por revisión editorial." />
      <section className="py-16">
        <Container>
          <nav aria-label="Categorías" className="-mx-5 mb-12 flex gap-2 overflow-x-auto px-5 pb-2">
            <Link href="/actualidad" className={`shrink-0 rounded-full border px-4 py-1.5 text-sm ${!categoria ? "border-navy-900 bg-navy-900 text-white" : "border-stone-200 bg-white"}`}>Todo</Link>
            {cats.map((c) => (
              <Link key={c.slug} href={`/actualidad?categoria=${c.slug}`} className={`shrink-0 rounded-full border px-4 py-1.5 text-sm ${categoria === c.slug ? "border-navy-900 bg-navy-900 text-white" : "border-stone-200 bg-white hover:border-blue-500"}`}>
                {c.name}
              </Link>
            ))}
          </nav>
          {articles.length === 0 ? (
            <EmptyState title="Aún no hay artículos publicados en esta sección">
              <Link href="/participa/autor" className="text-blue-600">Solicita acceso como autor</Link> para proponer un texto.
            </EmptyState>
          ) : (
            <div className="grid gap-x-8 gap-y-12 md:grid-cols-3">
              {articles.map((a) => (
                <Link key={a.slug} href={`/actualidad/${a.slug}`} className="group">
                  <span className="eyebrow text-blue-600">{a.category}</span>
                  <h2 className="mt-2 font-serif text-2xl leading-snug group-hover:text-blue-600">{a.title}</h2>
                  {a.subtitle && <p className="mt-2 text-graphite">{a.subtitle}</p>}
                  <p className="mt-3 text-xs text-stone-400">{a.author} · {fmtDate(a.publishedAt)}{a.readingMinutes ? ` · ${a.readingMinutes} min` : ""}</p>
                </Link>
              ))}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
