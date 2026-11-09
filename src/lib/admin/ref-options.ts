import "server-only";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { getResource, type Resource } from "./resources";

/** Opciones para los campos de referencia (selects que apuntan a otro recurso). */
export async function refOptions(res: Resource) {
  const out: Record<string, { id: number | string; label: string }[]> = {};
  for (const f of res.fields.filter((x) => x.type === "ref")) {
    const target = getResource(f.ref!);
    if (!target) continue;
    const rows = await db.select().from(target.table).orderBy(asc(target.table[target.orderCol]));
    out[f.name] = (rows as Record<string, unknown>[]).map((r) => ({
      id: r.id as number | string,
      label: String(r[target.titleCol]) + (typeof r.email === "string" ? ` (${r.email})` : ""),
    }));
  }
  return out;
}
