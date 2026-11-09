import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { Container, EmptyState, PageHero } from "@/components/ui";
import { ArchivoNav } from "@/components/site/ArchivoNav";
import { VideoCard } from "@/components/site/VideoCard";
import { VIDEO_TYPES } from "@/lib/media";
import { youtubeId } from "@/lib/editorial";

export const metadata: Metadata = { title: "Videoteca", description: "Documentales, discursos, entrevistas, eventos y conferencias de Congreso Joven Guatemala." };

export default async function Videos({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const { tipo } = await searchParams;
  const rows = await db.select().from(s.media).where(and(eq(s.media.kind, "video"), eq(s.media.public, true))).orderBy(desc(s.media.date), desc(s.media.createdAt));
  const videos = rows
    .map((v) => ({ ...v, yt: youtubeId(v.url), type: (v.metadata as { videoType?: string } | null)?.videoType }))
    .filter((v) => v.yt && (!tipo || v.type === tipo));
  return (
    <>
      <PageHero n={9} label="Archivo histórico" title="Videoteca" intro="Documentales, discursos, entrevistas, eventos, conferencias y material institucional." />
      <ArchivoNav active="/archivo/videos" />
      <section className="py-14">
        <Container>
          <div className="mb-8 flex flex-wrap gap-2">
            <Link href="/archivo/videos" className={`rounded-full border px-4 py-1.5 text-sm ${!tipo ? "border-navy-900 bg-navy-900 text-white" : "border-stone-200 bg-white"}`}>Todos</Link>
            {Object.entries(VIDEO_TYPES).map(([k, v]) => (
              <Link key={k} href={`/archivo/videos?tipo=${k}`} className={`rounded-full border px-4 py-1.5 text-sm ${tipo === k ? "border-navy-900 bg-navy-900 text-white" : "border-stone-200 bg-white hover:border-blue-500"}`}>{v}</Link>
            ))}
          </div>
          {videos.length === 0 ? (
            <EmptyState title="Aún no hay videos publicados en esta sección" />
          ) : (
            <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {videos.map((v) => (
                <VideoCard key={v.id} id={v.yt!} title={v.title ?? "Video"} caption={v.caption} meta={[v.type ? VIDEO_TYPES[v.type] : null, v.eventName, v.year].filter(Boolean).join(" · ")} />
              ))}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
