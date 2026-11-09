import type { Metadata } from "next";
import Link from "next/link";
import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { Container, EmptyState, PageHero } from "@/components/ui";
import { ArchivoNav } from "@/components/site/ArchivoNav";
import { Lightbox } from "@/components/site/Lightbox";
import { MEDIA_CATEGORIES } from "@/lib/media";
import { fmtDate } from "@/lib/format";

export const metadata: Metadata = { title: "Galería fotográfica", description: "Álbumes de eventos, autoridades, generaciones y actividades de Congreso Joven Guatemala." };

export default async function Galeria({ searchParams }: { searchParams: Promise<{ categoria?: string }> }) {
  const { categoria } = await searchParams;
  const albums = await db
    .select()
    .from(s.galleries)
    .where(and(eq(s.galleries.public, true), categoria && categoria in MEDIA_CATEGORIES ? eq(s.galleries.category, categoria) : undefined))
    .orderBy(asc(s.galleries.sortOrder), desc(s.galleries.date));
  // Portada: la elegida o la primera foto pública del álbum
  const firsts = albums.length
    ? await db
        .select({ galleryId: s.media.galleryId, url: s.media.url })
        .from(s.media)
        .where(and(eq(s.media.kind, "image"), eq(s.media.public, true), inArray(s.media.galleryId, albums.map((a) => a.id))))
        .orderBy(asc(s.media.sortOrder))
    : [];
  const loose = await db
    .select({ id: s.media.id, url: s.media.url, title: s.media.title, caption: s.media.caption, credit: s.media.credit })
    .from(s.media)
    .where(and(eq(s.media.kind, "image"), eq(s.media.public, true), isNull(s.media.galleryId)))
    .orderBy(desc(s.media.createdAt))
    .limit(24);

  return (
    <>
      <PageHero n={9} label="Archivo histórico" title="Galería fotográfica" intro="Eventos, autoridades, generaciones, actividades territoriales, Congreso de la República y relaciones internacionales." />
      <ArchivoNav active="/archivo/galeria" />
      <section className="py-14">
        <Container>
          <div className="mb-8 flex flex-wrap gap-2">
            <Link href="/archivo/galeria" className={`rounded-full border px-4 py-1.5 text-sm ${!categoria ? "border-navy-900 bg-navy-900 text-white" : "border-stone-200 bg-white"}`}>Todas</Link>
            {Object.entries(MEDIA_CATEGORIES).map(([k, v]) => (
              <Link key={k} href={`/archivo/galeria?categoria=${k}`} className={`rounded-full border px-4 py-1.5 text-sm ${categoria === k ? "border-navy-900 bg-navy-900 text-white" : "border-stone-200 bg-white hover:border-blue-500"}`}>{v}</Link>
            ))}
          </div>
          {albums.length === 0 && loose.length === 0 ? (
            <EmptyState title="La galería se está construyendo">Los álbumes se publicarán a medida que se incorporen las fotografías institucionales.</EmptyState>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {albums.map((a) => {
                const cover = a.coverUrl ?? firsts.find((f) => f.galleryId === a.id)?.url;
                const count = firsts.filter((f) => f.galleryId === a.id).length;
                return (
                  <Link key={a.id} href={`/archivo/galeria/${a.slug}`} className="group block">
                    <div className="aspect-[4/3] overflow-hidden bg-stone-200">
                      {cover && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cover} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                      )}
                    </div>
                    <p className="eyebrow mt-4 text-[0.6rem] text-blue-600">{a.category ? MEDIA_CATEGORIES[a.category] : "Álbum"}{a.date ? ` · ${fmtDate(a.date)}` : ""}</p>
                    <h2 className="mt-1 font-serif text-xl group-hover:text-blue-600">{a.title}</h2>
                    <p className="text-sm text-stone-400">{count} {count === 1 ? "fotografía" : "fotografías"}</p>
                  </Link>
                );
              })}
            </div>
          )}
          {loose.length > 0 && !categoria && (
            <div className="mt-16">
              <h2 className="eyebrow rule-under mb-6 inline-block text-blue-600">Fotografías recientes</h2>
              <Lightbox photos={loose} />
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
