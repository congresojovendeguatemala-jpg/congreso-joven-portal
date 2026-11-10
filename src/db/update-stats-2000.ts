import "./load-env";
import { eq } from "drizzle-orm";
import { db, closeDb, schema as s } from "./index";

/**
 * Actualización de datos (nov. 2026): en las cifras de portada, «104 jóvenes electos en línea»
 * se reemplaza por «2,000 jóvenes en la comunidad activa». Idempotente.
 *   Local:      npm run data:stats-2000
 *   Producción: $env:USE_REMOTE_DB = '1'; vercel env run -e production -- npm run data:stats-2000
 */
type Stat = { value: string; label: string; note: string; verification: string };
const NEW: Stat = { value: "2,000", label: "Jóvenes en la comunidad activa", note: "Registro institucional · nov. 2026", verification: "internal" };

async function main() {
  const [row] = await db.select().from(s.settings).where(eq(s.settings.key, "home.stats"));
  const stats = (row?.value as Stat[] | undefined) ?? [];
  const has2000 = stats.some((x) => x.value.replace(/\D/g, "") === "2000");
  let changed = false;
  const next: Stat[] = [];
  for (const st of stats) {
    if (st.value.trim() === "104") {
      changed = true;
      if (!has2000) next.push(NEW); // reemplaza en el mismo lugar
      continue; // si ya existía la cifra de 2,000, solo se quita la de 104
    }
    next.push(st);
  }
  if (!changed && !has2000) next.unshift(NEW);
  if (changed || !has2000) {
    await db.update(s.settings).set({ value: next, updatedAt: new Date() }).where(eq(s.settings.key, "home.stats"));
  }
  console.log(changed || !has2000 ? "✓ Cifras actualizadas:" : "✓ Sin cambios (ya estaba actualizado):");
  for (const st of next) console.log(`  ${st.value} · ${st.label}`);

  // Hito de octubre de 2024 en la cronología: misma corrección de texto.
  const OLD_TL = "Según el registro institucional, 104 jóvenes fueron electos en línea con representación de 22 departamentos.";
  const tl = await db.select({ id: s.timelineEvents.id, summary: s.timelineEvents.summary }).from(s.timelineEvents).where(eq(s.timelineEvents.title, "Primeras bancadas registradas"));
  let tlChanged = 0;
  for (const t of tl) {
    if (t.summary?.includes(OLD_TL)) {
      const summary = t.summary
        .replace("«Generación que impacta». " + OLD_TL, "«Generación que impacta», en una elección en línea con representación de 22 departamentos.")
        .concat(" Hoy Congreso Joven es una comunidad activa de 2,000 jóvenes en toda la República.");
      await db.update(s.timelineEvents).set({ summary }).where(eq(s.timelineEvents.id, t.id));
      tlChanged++;
    }
  }
  console.log(tlChanged ? `✓ Cronología actualizada (${tlChanged} hito)` : "✓ Cronología sin cambios (ya estaba actualizada o fue editada a mano)");
  await closeDb();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
