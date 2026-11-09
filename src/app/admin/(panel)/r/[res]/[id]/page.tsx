import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { requireCapability } from "@/lib/auth";
import { getEditableResource as getResource } from "@/lib/admin/resources";
import { refOptions } from "@/lib/admin/ref-options";
import { youtubeId } from "@/lib/editorial";
import { FieldInput, inputCls } from "@/components/admin/FieldInput";
import { deletePosition, deleteResource, saveResource, savePosition } from "../../../../resource-actions";

export default async function ResourceEdit({ params, searchParams }: { params: Promise<{ res: string; id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { res: key, id } = await params;
  const { ok, error } = await searchParams;
  const res = getResource(key);
  if (!res) notFound();
  await requireCapability(res.cap);
  const isNew = id === "nuevo";
  if (isNew && res.createHref) redirect(res.createHref);
  let row: Record<string, unknown> = { active: true, public: true, verification: "pending", sortOrder: 0 };
  if (!isNew) {
    if (!/^\d+$/.test(id)) notFound();
    const [r] = await db.select().from(res.table).where(eq(res.table.id, Number(id)));
    if (!r) notFound();
    row = r as Record<string, unknown>;
  }
  const refs = await refOptions(res);
  const publicHref = !isNew ? res.publicHref?.(row) : null;

  return (
    <div className="max-w-4xl">
      <Link href={`/admin/r/${key}`} className="text-sm text-blue-600">← {res.label}</Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl">{isNew ? `Nuevo ${res.singular}` : String(row[res.titleCol] ?? "")}</h1>
        {publicHref && <Link href={publicHref} target="_blank" className="text-sm text-blue-600">Ver en el sitio ↗</Link>}
      </div>
      {ok && <p className="mt-4 border-l-2 border-emerald-600 bg-emerald-50 px-4 py-2 text-sm" role="status">Cambios guardados.</p>}
      {error && <p className="mt-4 border-l-2 border-rose-600 bg-rose-50 px-4 py-2 text-sm text-rose-800" role="alert">{error}</p>}

      {res.previewCol && typeof row[res.previewCol] === "string" && <FilePreview url={row[res.previewCol] as string} kind={String(row.kind ?? "")} />}

      <form action={saveResource.bind(null, key, id)} className="mt-6 grid gap-5 border border-stone-200 bg-white p-6 md:grid-cols-2">
        {res.fields.map((f) => (
          <FieldInput
            key={f.name}
            f={f}
            value={row[f.name]}
            // Un registro no puede depender de sí mismo (solo aplica a referencias al mismo recurso, p. ej. órganos)
            refOptions={f.ref === key ? refs[f.name]?.filter((o) => String(o.id) !== id) : refs[f.name]}
          />
        ))}
        <div className="md:col-span-2">
          <button className="rounded bg-navy-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-600">Guardar</button>
        </div>
      </form>

      {key === "personas" && !isNew && <PositionsEditor personId={Number(id)} />}

      {!isNew && (
        <form action={deleteResource.bind(null, key, id)} className="mt-10 flex flex-wrap items-center gap-4 border border-rose-200 bg-rose-50/50 p-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="confirm" /> Confirmo que quiero eliminar este registro de forma permanente
          </label>
          <button className="rounded border border-rose-300 px-3 py-1.5 text-rose-700 hover:bg-rose-100">Eliminar</button>
        </form>
      )}
    </div>
  );
}

function FilePreview({ url, kind }: { url: string; kind: string }) {
  const yt = youtubeId(url);
  return (
    <div className="mt-6 border border-stone-200 bg-white p-4">
      {kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="max-h-80 w-auto" />
      ) : kind === "video" && yt ? (
        <div className="aspect-video max-w-xl">
          <iframe src={`https://www.youtube-nocookie.com/embed/${yt}`} title="Video" className="h-full w-full" allowFullScreen />
        </div>
      ) : (
        <a href={url} target="_blank" className="text-sm text-blue-600 underline">Abrir archivo ↗</a>
      )}
      <p className="mt-2 break-all font-mono text-xs text-stone-400">{url}</p>
    </div>
  );
}

async function PositionsEditor({ personId }: { personId: number }) {
  const [positions, organs] = await Promise.all([
    db.select().from(s.positions).where(eq(s.positions.personId, personId)).orderBy(asc(s.positions.sortOrder)),
    db.select({ id: s.organs.id, name: s.organs.name }).from(s.organs).orderBy(asc(s.organs.sortOrder)),
  ]);
  const Row = ({ p }: { p?: (typeof positions)[number] }) => (
    <form action={savePosition.bind(null, personId, p ? String(p.id) : "nuevo")} className="grid gap-3 border-b border-stone-200 p-4 last:border-0 md:grid-cols-6">
      <input name="title" defaultValue={p?.title ?? ""} placeholder="Cargo (ej.: Coordinación Nacional)" className={`${inputCls} md:col-span-2`} required />
      <select name="organId" defaultValue={p?.organId ?? ""} className={`${inputCls} md:col-span-2`} aria-label="Órgano">
        <option value="">— Órgano —</option>
        {organs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
      <input name="periodLabel" defaultValue={p?.periodLabel ?? ""} placeholder="Período (ej.: 2026–2027)" className={`${inputCls} md:col-span-2`} />
      <select name="verification" defaultValue={p?.verification ?? "internal"} className={`${inputCls} md:col-span-2`} aria-label="Verificación">
        <option value="verified">Fuente oficial</option>
        <option value="internal">Registro institucional</option>
        <option value="pending">Por confirmar</option>
      </select>
      <input name="sourceUrl" defaultValue={p?.sourceUrl ?? ""} placeholder="Enlace a la fuente (opcional)" className={`${inputCls} md:col-span-2`} />
      <input name="sortOrder" type="number" defaultValue={p?.sortOrder ?? 0} className={inputCls} aria-label="Orden" />
      <div className="flex flex-wrap items-center gap-4 text-sm md:col-span-6">
        <label className="flex items-center gap-2"><input type="checkbox" name="current" defaultChecked={p?.current} /> En funciones</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="elect" defaultChecked={p?.elect} /> Electo (aún no asume)</label>
        <button className="rounded bg-navy-900 px-3 py-1.5 text-white hover:bg-blue-600">{p ? "Guardar cargo" : "+ Agregar cargo"}</button>
        {p && (
          <button formAction={deletePosition.bind(null, personId, p.id)} className="text-rose-700 hover:underline">
            Quitar cargo
          </button>
        )}
      </div>
    </form>
  );
  return (
    <section className="mt-10">
      <h2 className="font-serif text-2xl">Cargos</h2>
      <p className="mt-1 text-sm text-graphite">Un cargo «en funciones» aparece en el organigrama y en «Autoridades en funciones». Los demás quedan en el historial.</p>
      <div className="mt-4 border border-stone-200 bg-white">
        {positions.map((p) => <Row key={p.id} p={p} />)}
        <div className="bg-paper"><Row /></div>
      </div>
    </section>
  );
}
