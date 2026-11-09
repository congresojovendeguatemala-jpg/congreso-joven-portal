import { asc } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { requireCapability } from "@/lib/auth";
import { setContentRequestStatus } from "../../actions";

const STATE = { pendiente: "Pendiente", recibido: "Recibido", completado: "Completado" } as const;
const STAGE = ["", "Identidad y portada", "Autoridades", "Territorio", "Proyectos", "Internacional", "Elecciones y archivo"];

export default async function Pendientes() {
  await requireCapability("content_requests.view");
  const rows = await db.select().from(s.contentRequests).orderBy(asc(s.contentRequests.stage), asc(s.contentRequests.id));
  const stages = [...new Set(rows.map((r) => r.stage))];
  const done = rows.filter((r) => r.status === "completado").length;
  return (
    <div className="max-w-5xl">
      <h1 className="font-serif text-3xl">Contenido pendiente</h1>
      <p className="mt-2 text-sm text-graphite">Materiales que faltan para completar el portal, solicitados por etapas. {done} de {rows.length} completados.</p>
      <div className="mt-3 h-1.5 w-full bg-stone-200"><div className="h-full bg-blue-600" style={{ width: `${rows.length ? (done / rows.length) * 100 : 0}%` }} /></div>
      {stages.map((st) => (
        <section key={st} className="mt-10">
          <h2 className="eyebrow text-blue-600">Etapa {st} · {STAGE[st] ?? ""}</h2>
          <ul className="mt-3 divide-y divide-stone-200 border border-stone-200 bg-white">
            {rows.filter((r) => r.stage === st).map((r) => (
              <li key={r.id} className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <p className={`font-medium ${r.status === "completado" ? "text-graphite line-through" : ""}`}>{r.item}</p>
                  <p className="mt-0.5 text-xs text-graphite">{r.section}{r.usedIn ? ` · Se usa en: ${r.usedIn}` : ""}</p>
                  {r.detail && <p className="mt-1 text-xs text-stone-400">{r.detail}</p>}
                </div>
                <form action={setContentRequestStatus} className="flex gap-1">
                  <input type="hidden" name="id" value={r.id} />
                  {(Object.keys(STATE) as (keyof typeof STATE)[]).map((k) => (
                    <button key={k} name="status" value={k} className={`rounded px-2.5 py-1 text-xs ${r.status === k ? "bg-navy-900 text-white" : "bg-stone-100 text-graphite hover:bg-stone-200"}`}>
                      {STATE[k]}
                    </button>
                  ))}
                </form>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
