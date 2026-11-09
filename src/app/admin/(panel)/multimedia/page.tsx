import Link from "next/link";
import { and, asc, desc, eq, type SQL } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { requireCapability } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { DOC_TYPES, MEDIA_CATEGORIES, VIDEO_TYPES, fmtBytes } from "@/lib/media";
import { youtubeId } from "@/lib/editorial";
import { inputCls } from "@/components/admin/FieldInput";
import { addVideo, uploadMedia } from "../../media-actions";

const KIND: Record<string, string> = { image: "Fotografías", video: "Videos", document: "Documentos" };

export default async function Multimedia({ searchParams }: { searchParams: Promise<{ tipo?: string; album?: string; ok?: string; error?: string }> }) {
  const user = await requireCapability("media.upload");
  const { tipo, album, ok, error } = await searchParams;
  const [albums, depts] = await Promise.all([
    db.select({ id: s.galleries.id, title: s.galleries.title }).from(s.galleries).orderBy(asc(s.galleries.sortOrder), desc(s.galleries.date)),
    db.select({ id: s.departments.id, name: s.departments.name }).from(s.departments).orderBy(asc(s.departments.name)),
  ]);
  const where: SQL[] = [];
  if (tipo && tipo in KIND) where.push(eq(s.media.kind, tipo));
  if (album && /^\d+$/.test(album)) where.push(eq(s.media.galleryId, Number(album)));
  const items = await db.select().from(s.media).where(where.length ? and(...where) : undefined).orderBy(desc(s.media.createdAt)).limit(120);
  const manage = can(user.role, "media.manage");
  const L = ({ children }: { children: React.ReactNode }) => <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-graphite">{children}</span>;

  const SharedFields = () => (
    <>
      <label><L>Álbum</L>
        <select name="galleryId" defaultValue={album ?? ""} className={inputCls}>
          <option value="">— Sin álbum —</option>
          {albums.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
        </select>
      </label>
      <label><L>Categoría</L>
        <select name="category" className={inputCls}>
          <option value="">—</option>
          {Object.entries(MEDIA_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </label>
      <label><L>Evento</L><input name="eventName" className={inputCls} placeholder="Ej.: Parlamento Juvenil 2026" /></label>
      <label><L>Fecha</L><input name="date" type="date" className={inputCls} /></label>
      <label><L>Crédito</L><input name="credit" className={inputCls} placeholder="Autor de la fotografía o fuente" /></label>
      <label><L>Departamento</L>
        <select name="departmentId" className={inputCls}>
          <option value="">—</option>
          {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </label>
      <label className="md:col-span-2"><L>Personas que aparecen (una por línea)</L><textarea name="people" rows={2} className={inputCls} /></label>
      <label className="md:col-span-2"><L>Etiquetas (una por línea)</L><textarea name="tags" rows={2} className={inputCls} /></label>
      <label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" name="public" /> Publicar en el sitio de inmediato</label>
    </>
  );

  return (
    <div className="max-w-6xl">
      <h1 className="font-serif text-3xl">Multimedia y documentos</h1>
      <p className="mt-1 text-sm text-graphite">Fotografías (JPG, PNG, WEBP), documentos PDF y videos de YouTube. Hasta 30 archivos de 8 MB por subida.</p>
      {ok && <p className="mt-4 border-l-2 border-emerald-600 bg-emerald-50 px-4 py-2 text-sm" role="status">{ok}</p>}
      {error && <p className="mt-4 border-l-2 border-rose-600 bg-rose-50 px-4 py-2 text-sm text-rose-800" role="alert">{error}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <form action={uploadMedia} className="grid gap-4 border border-stone-200 bg-white p-5 md:grid-cols-2">
          <p className="font-medium md:col-span-2">Subir fotografías o documentos</p>
          <label className="md:col-span-2"><L>Archivos *</L><input type="file" name="files" multiple required accept="image/jpeg,image/png,image/webp,application/pdf" className="block w-full text-sm" /></label>
          <label><L>Título</L><input name="title" className={inputCls} placeholder="Si se deja vacío, usa el nombre del archivo" /></label>
          <label><L>Tipo de documento (PDF)</L>
            <select name="docType" className={inputCls}>
              {Object.entries(DOC_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <SharedFields />
          <div className="md:col-span-2"><button className="rounded bg-navy-900 px-5 py-2.5 text-sm text-white hover:bg-blue-600">Subir</button></div>
        </form>

        <form action={addVideo} className="grid content-start gap-4 border border-stone-200 bg-white p-5 md:grid-cols-2">
          <p className="font-medium md:col-span-2">Agregar video de YouTube</p>
          <label className="md:col-span-2"><L>Enlace de YouTube *</L><input name="url" required className={inputCls} placeholder="https://www.youtube.com/watch?v=…" /></label>
          <label><L>Título *</L><input name="title" required className={inputCls} /></label>
          <label><L>Tipo</L>
            <select name="videoType" className={inputCls}>
              {Object.entries(VIDEO_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className="md:col-span-2"><L>Descripción</L><textarea name="caption" rows={2} className={inputCls} /></label>
          <SharedFields />
          <div className="md:col-span-2"><button className="rounded bg-navy-900 px-5 py-2.5 text-sm text-white hover:bg-blue-600">Agregar video</button></div>
        </form>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-2">
        <Link href="/admin/multimedia" className={`rounded-full px-3 py-1 text-xs ${!tipo ? "bg-navy-900 text-white" : "bg-white"}`}>Todo</Link>
        {Object.entries(KIND).map(([k, v]) => (
          <Link key={k} href={`/admin/multimedia?tipo=${k}`} className={`rounded-full px-3 py-1 text-xs ${tipo === k ? "bg-navy-900 text-white" : "bg-white"}`}>{v}</Link>
        ))}
        {manage && <Link href="/admin/r/albumes" className="ml-auto text-sm text-blue-600">Administrar álbumes →</Link>}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((m) => {
          const yt = m.kind === "video" ? youtubeId(m.url) : null;
          const thumb = m.kind === "image" ? m.url : yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : null;
          const body = (
            <>
              <div className="relative aspect-[4/3] overflow-hidden bg-stone-200">
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs uppercase tracking-wider text-graphite">PDF</div>
                )}
                {!m.public && <span className="absolute left-1.5 top-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[0.6rem] text-amber-800">No público</span>}
              </div>
              <p className="mt-2 truncate text-sm">{m.title}</p>
              <p className="text-xs text-stone-400">{m.kind === "document" ? `${DOC_TYPES[m.docType ?? "otro"]} · ${fmtBytes(m.bytes)}` : m.year ?? ""}</p>
            </>
          );
          return <li key={m.id}>{manage ? <Link href={`/admin/r/multimedia/${m.id}`} className="block hover:opacity-90">{body}</Link> : body}</li>;
        })}
        {items.length === 0 && <li className="col-span-full border border-dashed border-stone-300 p-8 text-center text-sm text-graphite">Aún no hay archivos en esta vista.</li>}
      </ul>
    </div>
  );
}
