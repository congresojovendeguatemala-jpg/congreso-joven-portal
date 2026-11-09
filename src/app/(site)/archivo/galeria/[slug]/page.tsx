import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { Container, EmptyState, PageHero } from "@/components/ui";
import { ArchivoNav } from "@/components/site/ArchivoNav";
import { Lightbox } from "@/components/site/Lightbox";
import { MEDIA_CATEGORIES } from "@/lib/media";
import { fmtDate } from "@/lib/format";

type P = { params: Promise<{ slug: string }> };
const load = async (slug: string) => (await db.select().from(s.galleries).where(and(eq(s.galleries.slug, slug), eq(s.galleries.public, true))))[0];

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const g = await load((await params).slug);
  return { title: g?.title ?? "Álbum", description: g?.description ?? undefined, openGraph: g?.coverUrl ? { images: [g.coverUrl] } : undefined };
}

export default async function Album({ params }: P) {
  const g = await load((await params).slug);
  if (!g) notFound();
  const photos = await db
    .select({ id: s.media.id, url: s.media.url, title: s.media.title, caption: s.media.caption, credit: s.media.credit })
    .from(s.media)
    .where(and(eq(s.media.galleryId, g.id), eq(s.media.kind, "image"), eq(s.media.public, true)))
    .orderBy(asc(s.media.sortOrder), asc(s.media.id));
  return (
    <>
      <PageHero label={`Galería${g.category ? ` · ${MEDIA_CATEGORIES[g.category]}` : ""}`} title={g.title} intro={[g.date ? fmtDate(g.date) : null, g.description].filter(Boolean).join(" — ") || undefined} />
      <ArchivoNav active="/archivo/galeria" />
      <section className="py-14">
        <Container>
          {photos.length ? <Lightbox photos={photos} /> : <EmptyState title="Este álbum aún no tiene fotografías públicas" />}
          <Link href="/archivo/galeria" className="mt-10 inline-block text-sm text-blue-600">← Todos los álbumes</Link>
        </Container>
      </section>
    </>
  );
}
