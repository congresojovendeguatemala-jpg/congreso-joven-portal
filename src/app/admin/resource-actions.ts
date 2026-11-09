"use server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { requireCapability } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getEditableResource as getResource, type FieldDef } from "@/lib/admin/resources";
import { removeUpload, saveUpload } from "@/lib/storage";
import { slugify } from "@/db/seed-data";

const back = (res: string, id: string | number, q: Record<string, string>) =>
  `/admin/r/${res}/${id}?${new URLSearchParams(q).toString()}`;

/** Convierte un valor de formulario al tipo de la columna. */
async function parseField(f: FieldDef, form: FormData, folder: string): Promise<{ value: unknown } | { error: string } | null> {
  const raw = form.get(f.name);
  const str = typeof raw === "string" ? raw.trim() : "";
  switch (f.type) {
    case "bool":
      return { value: raw === "on" };
    case "number":
      if (str === "") return f.required ? { error: `«${f.label}» es obligatorio.` } : { value: null };
      return Number.isFinite(Number(str)) ? { value: Math.trunc(Number(str)) } : { error: `«${f.label}» debe ser un número.` };
    case "date":
      if (str === "") return f.required ? { error: `«${f.label}» es obligatorio.` } : { value: null };
      return /^\d{4}-\d{2}-\d{2}$/.test(str) ? { value: str } : { error: `«${f.label}»: fecha no válida.` };
    case "datetime":
      if (str === "") return f.required ? { error: `«${f.label}» es obligatorio.` } : { value: null };
      // Guatemala no usa horario de verano: UTC−6 todo el año.
      return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(str) ? { value: new Date(`${str}:00-06:00`) } : { error: `«${f.label}»: fecha y hora no válidas.` };
    case "ref":
      // Identificadores numéricos o UUID (usuarios)
      if (str === "") return { value: null };
      if (/^\d+$/.test(str)) return { value: Number(str) };
      return /^[0-9a-f-]{36}$/i.test(str) ? { value: str } : { error: `«${f.label}»: valor no válido.` };
    case "lines": {
      const arr = str.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
      return { value: arr.length ? arr : null };
    }
    case "rows": {
      const rows = str
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => {
          const parts = l.split("|").map((p) => p.trim());
          return Object.fromEntries(f.columns!.map((c, i) => [c, parts[i] ?? (c === "verification" ? "internal" : "")]));
        });
      return { value: rows };
    }
    case "image": {
      const file = form.get(`${f.name}__file`);
      if (form.get(`${f.name}__remove`) === "on") return { value: null };
      if (file instanceof File && file.size > 0) {
        try {
          return { value: (await saveUpload(file, folder)).url };
        } catch (e) {
          return { error: (e as Error).message };
        }
      }
      return null; // sin cambios
    }
    default:
      if (str === "") return f.required ? { error: `«${f.label}» es obligatorio.` } : { value: null };
      if (str.length > 20000) return { error: `«${f.label}» es demasiado largo.` };
      return { value: str };
  }
}

export async function saveResource(resKey: string, id: string, form: FormData) {
  const res = getResource(resKey);
  if (!res) redirect("/admin");
  const user = await requireCapability(res.cap);
  const isNew = id === "nuevo";

  const values: Record<string, unknown> = {};
  for (const f of res.fields) {
    const r = await parseField(f, form, res.folder ?? res.key);
    if (r === null) continue;
    if ("error" in r) redirect(back(resKey, id, { error: r.error }));
    values[f.name] = r.value;
  }
  // Identificador URL automático y normalizado
  if (res.fields.some((f) => f.name === "slug")) {
    values.slug = slugify(String(values.slug ?? values[res.titleCol] ?? "")) || `item-${Date.now()}`;
  }
  // Columnas NOT NULL con valor por defecto
  for (const k of ["sortOrder"]) if (k in values && values[k] === null) values[k] = 0;
  if ("verification" in values && values.verification === null) values.verification = "pending";

  let newId: string | number = id;
  try {
    if (isNew) {
      const [row] = await db.insert(res.table).values(values).returning({ id: res.table.id });
      newId = row.id;
    } else {
      await db.update(res.table).set(values).where(eq(res.table.id, Number(id)));
    }
  } catch (e) {
    const msg = String((e as { cause?: { message?: string } }).cause?.message ?? (e as Error).message);
    const friendly = /unique|duplicate/i.test(msg) ? "Ya existe un registro con ese identificador URL." : "No se pudo guardar. Revisa los datos.";
    redirect(back(resKey, id, { error: friendly }));
  }
  await audit(user.id, isNew ? "create" : "update", res.key, newId, { campos: Object.keys(values) });
  redirect(back(resKey, newId, { ok: "1" }));
}

export async function deleteResource(resKey: string, id: string, form: FormData) {
  const res = getResource(resKey);
  if (!res) redirect("/admin");
  const user = await requireCapability(res.cap);
  if (form.get("confirm") !== "on") redirect(back(resKey, id, { error: "Marca la casilla de confirmación para eliminar." }));
  const [before] = await db.select().from(res.table).where(eq(res.table.id, Number(id)));
  try {
    await db.delete(res.table).where(eq(res.table.id, Number(id)));
  } catch {
    redirect(back(resKey, id, { error: "No se puede eliminar porque otros registros dependen de este. Desactívalo en su lugar." }));
  }
  // Los archivos subidos se borran del disco junto con su registro.
  // …salvo que otro registro use el mismo archivo.
  if (res.key === "multimedia") {
    const url = (before as { url?: string } | undefined)?.url;
    if (url) {
      const [other] = await db.select({ id: s.media.id }).from(s.media).where(eq(s.media.url, url)).limit(1);
      if (!other) await removeUpload(url);
    }
  }
  await audit(user.id, "delete", res.key, id, { antes: before });
  redirect(`/admin/r/${resKey}?eliminado=1`);
}

/* ───────── Cargos de una persona ───────── */

export async function savePosition(personId: number, positionId: string, form: FormData) {
  const user = await requireCapability("people.edit");
  const title = String(form.get("title") ?? "").trim();
  if (!title) redirect(back("personas", personId, { error: "El cargo necesita un título." }));
  const organ = String(form.get("organId") ?? "");
  const verification = String(form.get("verification") ?? "pending");
  const values = {
    personId,
    title,
    organId: organ ? Number(organ) : null,
    periodLabel: String(form.get("periodLabel") ?? "").trim() || null,
    current: form.get("current") === "on",
    elect: form.get("elect") === "on",
    verification: (["verified", "internal", "pending"].includes(verification) ? verification : "pending") as "verified" | "internal" | "pending",
    sourceUrl: String(form.get("sourceUrl") ?? "").trim() || null,
    sortOrder: Number(form.get("sortOrder") ?? 0) || 0,
  };
  if (positionId === "nuevo") {
    const [row] = await db.insert(s.positions).values(values).returning({ id: s.positions.id });
    await audit(user.id, "create", "positions", row.id, values);
  } else {
    await db.update(s.positions).set(values).where(eq(s.positions.id, Number(positionId)));
    await audit(user.id, "update", "positions", positionId, values);
  }
  redirect(back("personas", personId, { ok: "1" }));
}

export async function deletePosition(personId: number, positionId: number) {
  const user = await requireCapability("people.edit");
  await db.delete(s.positions).where(eq(s.positions.id, positionId));
  await audit(user.id, "delete", "positions", positionId);
  redirect(back("personas", personId, { ok: "1" }));
}
