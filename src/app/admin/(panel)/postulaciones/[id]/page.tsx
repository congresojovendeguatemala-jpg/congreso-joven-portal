import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema as s } from "@/db";
import { requireCapability } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { MODALITIES } from "@/lib/modalities";
import { fmtDate } from "@/lib/format";
import { updateApplication } from "../../../actions";
import { STATUS_LABEL } from "@/lib/labels";

export default async function Postulacion({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireCapability("applications.view");
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const [row] = await db
    .select({ a: s.applications, dept: s.departments.name })
    .from(s.applications)
    .leftJoin(s.departments, eq(s.applications.departmentId, s.departments.id))
    .where(eq(s.applications.id, id));
  if (!row) notFound();
  await audit(user.id, "application.view", "applications", id);
  const { a } = row;
  const m = MODALITIES.find((x) => x.type === a.type);
  const label = (k: string) => (k === "ageAtSubmission" ? "Edad al postular" : m?.fields.find((f) => f.name === k)?.label ?? k);

  return (
    <div className="max-w-4xl">
      <Link href="/admin/postulaciones" className="text-sm text-blue-600">← Postulaciones</Link>
      <h1 className="mt-4 font-serif text-3xl">{a.fullName}</h1>
      <p className="mt-1 text-sm text-graphite">{m?.title} · recibida el {fmtDate(a.createdAt)} · estado: <strong>{STATUS_LABEL[a.status]}</strong></p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <dl className="divide-y divide-stone-200 border border-stone-200 bg-white">
          {[["Correo", a.email], ["Teléfono", a.phone ?? "—"], ["Departamento", row.dept ?? "—"], ...Object.entries(a.data).map(([k, v]) => [label(k), Array.isArray(v) ? v.join(", ") : String(v ?? "—")])].map(([k, v]) => (
            <div key={k} className="grid gap-1 p-4 sm:grid-cols-[180px_1fr]">
              <dt className="text-xs uppercase tracking-wider text-graphite">{k}</dt>
              <dd className="whitespace-pre-line text-sm">{v || "—"}</dd>
            </div>
          ))}
          <div className="grid gap-1 p-4 sm:grid-cols-[180px_1fr]">
            <dt className="text-xs uppercase tracking-wider text-graphite">Consentimientos</dt>
            <dd className="text-sm">Privacidad: sí · Fotografías: {a.photoConsent ? "sí" : "no"}</dd>
          </div>
        </dl>

        <div className="space-y-6">
          {can(user.role, "applications.review") && (
            <form key={a.status + a.updatedAt.toISOString()} action={updateApplication} className="space-y-3 border border-stone-200 bg-white p-5">
              <input type="hidden" name="id" value={a.id} />
              <p className="font-medium">Cambiar estado</p>
              <select name="status" defaultValue={a.status} className="w-full border border-stone-200 px-3 py-2 text-sm">
                {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <textarea name="note" rows={3} placeholder="Nota interna (opcional)" className="w-full border border-stone-200 px-3 py-2 text-sm" />
              <button className="rounded bg-navy-900 px-4 py-2 text-sm text-white">Guardar</button>
            </form>
          )}
          <div className="border border-stone-200 bg-white p-5">
            <p className="font-medium">Historial</p>
            <ol className="mt-3 space-y-3 text-sm">
              {[...a.history].reverse().map((h, i) => (
                <li key={i} className="border-l-2 border-blue-600 pl-3">
                  <p>{STATUS_LABEL[h.status] ?? h.status}</p>
                  <p className="text-xs text-graphite">{fmtDate(h.at, { dateStyle: "medium", timeStyle: "short" })} · {h.by ?? "Formulario público"}</p>
                  {h.note && <p className="mt-1 text-xs">{h.note}</p>}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
