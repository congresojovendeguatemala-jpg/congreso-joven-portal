import type { Metadata } from "next";
import Link from "next/link";
import { asc, count, desc, eq, and } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { Container, EmptyState, PageHero, SectionHeader } from "@/components/ui";
import { ArchivoNav } from "@/components/site/ArchivoNav";
import { CATEGORY_LABEL, Timeline } from "@/components/site/Timeline";
import { DocumentList } from "@/components/site/DocumentList";
import { DOC_TYPES, MEDIA_CATEGORIES } from "@/lib/media";
import { youtubeId } from "@/lib/editorial";

export const metadata: Metadata = { title: "Archivo histórico", description: "Galería, videoteca, documentos y archivo histórico de Congreso Joven Guatemala." };

const norm = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

type SP = { q?: string; anio?: string; categoria?: string; departamento?: string };

export default async function Archivo({ searchParams }: { searchParams: Promise<SP> }) {
  const { q = "", anio = "", categoria = "", departamento = "" } = await searchParams;
  const [timeline, media, depts, counts] = await Promise.all([
    db.select().from(s.timelineEvents).where(eq(s.timelineEvents.public, true)).orderBy(asc(s.timelineEvents.date)),
    db.select().from(s.media).where(eq(s.media.public, true)).orderBy(desc(s.media.createdAt)),
    db.select({ id: s.departments.id, slug: s.departments.slug, name: s.departments.name }).from(s.departments).orderBy(asc(s.departments.name)),
    db.select({ kind: s.media.kind, c: count() }).from(s.media).where(and(eq(s.media.public, true))).groupBy(s.media.kind),
  ]);
  const deptId = depts.find((d) => d.slug === departamento)?.id;
  const years = [...new Set([...timeline.map((t) => t.date?.slice(0, 4)), ...media.map((m) => (m.year ? String(m.year) : m.date?.slice(0, 4)))].filter(Boolean))].sort().reverse() as string[];
  const nq = norm(q.trim());
  const searching = Boolean(nq || anio || categoria || departamento);

  const tl = timeline.filter(
    (t) =>
      (!anio || t.date?.startsWith(anio)) &&
      (!categoria || t.category === categoria) &&
      !departamento && // la cronología no tiene departamento asignado
      (!nq || norm([t.title, t.summary, t.dateLabel, ...(t.people ?? [])].join(" ")).includes(nq)),
  );
  const md = searching
    ? media.filter(
        (m) =>
          (!anio || String(m.year ?? m.date?.slice(0, 4)) === anio) &&
          (!categoria || m.category === categoria) &&
          (!deptId || m.departmentId === deptId) &&
          (!nq || norm([m.title, m.caption, m.eventName, m.credit, ...(m.people ?? []), ...(m.tags ?? [])].join(" ")).includes(nq)),
      )
    : [];
  const photos = md.filter((m) => m.kind === "image");
  const videos = md.filter((m) => m.kind === "video");
  const docs = md.filter((m) => m.kind === "document");
  const field = "border border-stone-200 bg-white px-3.5 py-2.5 text-sm";
  const n = (k: string) => counts.find((c) => c.kind === k)?.c ?? 0;
  const total = tl.length + md.length;

  return (
    <>
      <PageHero n={9} label="Archivo histórico" title="Memoria institucional" intro="Cronología, galería fotográfica, videoteca y documentos. Búsqueda por año, persona, cargo, departamento, evento y categoría." />
      <ArchivoNav active="/archivo" />
      <section className="py-14">
        <Container>
          <form role="search" className="grid gap-3 border border-stone-200 bg-paper p-5 md:grid-cols-[2fr_1fr_1fr_1fr_auto]">
            <label className="sr-only" htmlFor="q">Buscar</label>
            <input id="q" name="q" defaultValue={q} placeholder="Persona, cargo, evento, etiqueta…" className={field} />
            <select name="anio" defaultValue={anio} className={field} aria-label="Año">
              <option value="">Todos los años</option>
              {years.map((y) => <option key={y}>{y}</option>)}
            </select>
            <select name="categoria" defaultValue={categoria} className={field} aria-label="Categoría">
              <option value="">Todas las categorías</option>
              <optgroup label="Cronología">
                {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </optgroup>
              <optgroup label="Multimedia">
                {Object.entries(MEDIA_CATEGORIES).map(([k, v]) => <option key={`m-${k}`} value={k}>{v}</option>)}
              </optgroup>
            </select>
            <select name="departamento" defaultValue={departamento} className={field} aria-label="Departamento">
              <option value="">Todo el país</option>
              {depts.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
            </select>
            <button className="rounded-full bg-navy-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-600">Buscar</button>
          </form>
          <p className="mt-4 text-sm text-graphite">
            {searching ? `${total} ${total === 1 ? "resultado" : "resultados"}` : `${timeline.length} acontecimientos en la cronología`}
            {searching && <Link href="/archivo" className="ml-3 text-blue-600">Limpiar búsqueda</Link>}
          </p>

          {searching && (photos.length > 0 || videos.length > 0 || docs.length > 0) && (
            <div className="mt-10 space-y-10">
              {photos.length > 0 && (
                <div>
                  <h2 className="eyebrow mb-4 text-blue-600">Fotografías ({photos.length})</h2>
                  <ul className="grid grid-cols-3 gap-2 md:grid-cols-6">
                    {photos.slice(0, 18).map((p) => (
                      <li key={p.id}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.url} alt={p.title ?? ""} title={p.title ?? ""} loading="lazy" className="aspect-square w-full object-cover" />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {videos.length > 0 && (
                <div>
                  <h2 className="eyebrow mb-4 text-blue-600">Videos ({videos.length})</h2>
                  <ul className="space-y-2">
                    {videos.map((v) => (
                      <li key={v.id}>
                        <a href={`https://www.youtube.com/watch?v=${youtubeId(v.url)}`} target="_blank" rel="noopener noreferrer" className="font-serif text-lg text-blue-600 hover:underline">▶ {v.title}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {docs.length > 0 && (
                <div>
                  <h2 className="eyebrow mb-2 text-blue-600">Documentos ({docs.length})</h2>
                  <DocumentList docs={docs} />
                </div>
              )}
            </div>
          )}

          <div className="mt-12 max-w-4xl">
            {searching && <h2 className="eyebrow mb-6 text-blue-600">Cronología ({tl.length})</h2>}
            {tl.length ? <Timeline items={tl} /> : !md.length && <EmptyState title="Sin resultados" />}
          </div>
        </Container>
      </section>

      {!searching && (
        <section className="border-t border-stone-200 bg-white py-20">
          <Container>
            <SectionHeader label="Colecciones" title="Galería, videoteca y documentos" />
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { href: "/archivo/galeria", t: "Galería fotográfica", d: "Eventos, autoridades, generaciones", c: n("image"), u: "fotografías" },
                { href: "/archivo/videos", t: "Videoteca", d: "Discursos, entrevistas, conferencias", c: n("video"), u: "videos" },
                { href: "/archivo/documentos", t: "Documentos", d: Object.values(DOC_TYPES).slice(0, 4).join(", "), c: n("document"), u: "documentos" },
              ].map((x) => (
                <Link key={x.href} href={x.href} className="group border border-stone-200 p-7 transition hover:border-blue-500/50">
                  <p className="font-serif text-4xl font-light text-navy-900">{x.c}</p>
                  <p className="eyebrow mt-1 text-[0.6rem] text-stone-400">{x.u}</p>
                  <h3 className="mt-4 font-serif text-xl group-hover:text-blue-600">{x.t}</h3>
                  <p className="mt-1 text-sm text-graphite">{x.d}</p>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
