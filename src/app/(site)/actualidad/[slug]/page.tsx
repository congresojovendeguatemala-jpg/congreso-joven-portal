import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, ne } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { Container } from "@/components/ui";
import { Portrait } from "@/components/ui/Portrait";
import { ArticleBody } from "@/components/site/ArticleBody";
import { promoteScheduled } from "@/lib/articles";
import { getSiteMeta } from "@/lib/settings";
import { fmtDate } from "@/lib/format";
import type { Doc } from "@/lib/editorial";

type P = { params: Promise<{ slug: string }> };
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

async function load(slug: string) {
  await promoteScheduled();
  const [r] = await db
    .select({ a: s.articles, category: s.categories, author: s.authors })
    .from(s.articles)
    .leftJoin(s.categories, eq(s.articles.categoryId, s.categories.id))
    .leftJoin(s.authors, eq(s.articles.authorId, s.authors.id))
    .where(and(eq(s.articles.slug, slug), eq(s.articles.status, "publicado")));
  return r;
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const r = await load((await params).slug);
  if (!r) return { title: "Artículo" };
  const description = r.a.seoDescription ?? r.a.subtitle ?? r.a.contentText?.slice(0, 160) ?? undefined;
  return {
    title: r.a.seoTitle ?? r.a.title,
    description,
    alternates: { canonical: `/actualidad/${r.a.slug}` },
    openGraph: {
      type: "article",
      title: r.a.title,
      description,
      publishedTime: r.a.publishedAt?.toISOString(),
      authors: r.author ? [r.author.name] : undefined,
      images: r.a.coverUrl ? [r.a.coverUrl] : undefined,
    },
  };
}

export default async function Articulo({ params }: P) {
  const r = await load((await params).slug);
  if (!r) notFound();
  const { a, author, category } = r;
  const { editorialName } = await getSiteMeta();
  const related = category
    ? await db
        .select({ slug: s.articles.slug, title: s.articles.title, publishedAt: s.articles.publishedAt })
        .from(s.articles)
        .where(and(eq(s.articles.status, "publicado"), eq(s.articles.categoryId, category.id), ne(s.articles.id, a.id)))
        .orderBy(desc(s.articles.publishedAt))
        .limit(3)
    : [];
  const url = `${SITE}/actualidad/${a.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.subtitle ?? undefined,
    datePublished: a.publishedAt?.toISOString(),
    dateModified: a.updatedAt.toISOString(),
    author: author ? { "@type": "Person", name: author.name, url: `${SITE}/autores/${author.slug}` } : undefined,
    image: a.coverUrl ? [`${SITE}${a.coverUrl}`] : undefined,
    publisher: { "@type": "Organization", name: editorialName },
    mainEntityOfPage: url,
  };
  // Citas: cada línea de fuentes se muestra como elemento; los enlaces https se vuelven clicables.
  const sources = (a.sources ?? "").split(/\r?\n/).map((x) => x.trim()).filter(Boolean);

  return (
    <article className="pb-24 pt-32">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Container className="max-w-3xl">
        <Link href={category ? `/actualidad?categoria=${category.slug}` : "/actualidad"} className="eyebrow text-blue-600">
          {category?.name ?? editorialName}
        </Link>
        <h1 className="mt-4 font-serif text-4xl leading-tight md:text-5xl">{a.title}</h1>
        {a.subtitle && <p className="mt-4 text-xl leading-relaxed text-graphite">{a.subtitle}</p>}
        <div className="mt-8 flex items-center gap-4 border-b border-stone-200 pb-6">
          {author && <Portrait src={author.photoUrl} alt={author.name} className="h-12 w-12 shrink-0 rounded-full" small />}
          <p className="text-sm text-graphite">
            {author && (
              <Link href={`/autores/${author.slug}`} className="font-medium text-ink hover:text-blue-600">
                {author.name}
              </Link>
            )}
            <span className="block text-stone-400">
              {fmtDate(a.publishedAt)}
              {a.readingMinutes ? ` · ${a.readingMinutes} min de lectura` : ""}
            </span>
          </p>
        </div>
      </Container>
      {a.coverUrl && (
        <Container className="mt-10 max-w-4xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={a.coverUrl} alt="" className="aspect-[16/9] w-full object-cover" />
        </Container>
      )}
      <Container className="mt-10 max-w-3xl text-lg text-ink/90">
        <ArticleBody doc={a.content as Doc | null} />

        {sources.length > 0 && (
          <section className="mt-14 border-t border-stone-200 pt-6 text-sm text-graphite">
            <h2 className="eyebrow mb-3 text-blue-600">Fuentes y referencias</h2>
            <ol className="list-decimal space-y-1 pl-5">
              {sources.map((src, i) => (
                <li key={i}>
                  {/^https:\/\//.test(src) ? (
                    <a href={src} target="_blank" rel="noopener noreferrer nofollow" className="break-all text-blue-600 underline underline-offset-2">{src}</a>
                  ) : (
                    src
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-4 text-sm">
          <span className="text-stone-400">Compartir:</span>
          <a href={`https://wa.me/?text=${encodeURIComponent(`${a.title} ${url}`)}`} target="_blank" rel="noopener noreferrer" className="text-blue-600">WhatsApp</a>
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" className="text-blue-600">Facebook</a>
          <a href={`https://x.com/intent/post?url=${encodeURIComponent(url)}&text=${encodeURIComponent(a.title)}`} target="_blank" rel="noopener noreferrer" className="text-blue-600">X</a>
          <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" className="text-blue-600">LinkedIn</a>
        </div>

        {author?.bio && (
          <aside className="mt-12 flex gap-5 border border-stone-200 bg-white p-6">
            <Portrait src={author.photoUrl} alt={author.name} className="h-16 w-16 shrink-0 rounded-full" small />
            <div>
              <p className="eyebrow text-[0.6rem] text-blue-600">Sobre el autor</p>
              <Link href={`/autores/${author.slug}`} className="mt-1 block font-serif text-lg hover:text-blue-600">{author.name}</Link>
              <p className="mt-1 text-sm text-graphite">{author.bio}</p>
            </div>
          </aside>
        )}
      </Container>

      {related.length > 0 && (
        <Container className="mt-16 max-w-5xl">
          <h2 className="eyebrow rule-under inline-block text-blue-600">Artículos relacionados</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {related.map((x) => (
              <Link key={x.slug} href={`/actualidad/${x.slug}`} className="group border-t border-stone-200 pt-4">
                <p className="font-serif text-lg leading-snug group-hover:text-blue-600">{x.title}</p>
                <p className="mt-1 text-xs text-stone-400">{fmtDate(x.publishedAt)}</p>
              </Link>
            ))}
          </div>
        </Container>
      )}
    </article>
  );
}
