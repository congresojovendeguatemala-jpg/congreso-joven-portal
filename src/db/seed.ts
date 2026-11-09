import "./load-env";
import { eq } from "drizzle-orm";
import { db, closeDb, schema as s } from "./index";
import * as D from "./seed-data";

/** Idempotente: puede ejecutarse varias veces sin duplicar datos. */
async function main() {
  await db.insert(s.regions).values(D.REGIONS).onConflictDoNothing();

  await db
    .insert(s.departments)
    .values(D.DEPARTMENTS.map((d) => ({ slug: d.slug, name: d.name, tileX: d.x, tileY: d.y })))
    .onConflictDoNothing();

  await db
    .insert(s.categories)
    .values(D.CATEGORIES.map((name, i) => ({ name, slug: D.slugify(name), sortOrder: i })))
    .onConflictDoNothing();

  // Órganos (dos pasadas para resolver parentId)
  for (const [i, o] of D.ORGANS.entries()) {
    await db
      .insert(s.organs)
      .values({
        slug: o.slug,
        name: o.name,
        kind: o.kind,
        sortOrder: i,
        active: true,
        confirmed: true,
        description: o.group ? "Agrupación del organigrama" : null,
      })
      .onConflictDoNothing();
  }
  const organRows = await db.select().from(s.organs);
  const organId = new Map(organRows.map((r) => [r.slug, r.id]));
  for (const o of D.ORGANS) {
    if (o.parent) await db.update(s.organs).set({ parentId: organId.get(o.parent)! }).where(eq(s.organs.slug, o.slug));
  }

  // Personas con cargo documentado
  for (const [i, p] of D.PEOPLE.entries()) {
    const [row] = await db
      .insert(s.people)
      .values({
        slug: p.slug,
        fullName: p.fullName,
        knownAs: p.knownAs,
        photoUrl: p.photoUrl,
        verification: p.verification,
        sourceUrl: p.sourceUrl,
        public: p.public ?? true,
        archived: p.archived ?? false,
      })
      .onConflictDoNothing()
      .returning();
    if (row) {
      await db.insert(s.positions).values(
        p.positions.map((pos, k) => ({
          personId: row.id,
          organId: pos.organ ? organId.get(pos.organ) ?? null : null,
          title: pos.title,
          periodLabel: pos.periodLabel,
          current: pos.current ?? false,
          elect: pos.elect ?? false,
          verification: pos.verification,
          sourceUrl: pos.sourceUrl,
          sortOrder: i * 10 + k,
        })),
      );
    }
  }

  const tlCount = (await db.select({ id: s.timelineEvents.id }).from(s.timelineEvents)).length;
  if (tlCount === 0) {
    await db.insert(s.timelineEvents).values(
      D.TIMELINE.map((t) => ({
        date: t.date,
        dateLabel: t.dateLabel,
        title: t.title,
        summary: t.summary,
        category: t.category,
        // la fecha ordena; dateLabel es lo que se muestra
        organizer: t.organizer,
        people: t.people,
        sourceUrl: t.sourceUrl,
        sourceLabel: t.sourceLabel,
        verification: t.verification,
        showInCongress: t.showInCongress ?? false,
        public: t.public ?? true,
      })),
    );
  }

  for (const [i, p] of D.PROJECTS.entries()) {
    await db
      .insert(s.projects)
      .values({ ...p, sortOrder: i, verification: "internal" })
      .onConflictDoNothing();
  }

  await db
    .insert(s.engagements)
    .values(D.ENGAGEMENTS.map((e) => ({ ...e, verification: "internal" as const })))
    .onConflictDoNothing();

  const settings: Record<string, unknown> = {
    "site.name": "Congreso Joven Guatemala",
    "site.tagline": "De jóvenes, para jóvenes.",
    "editorial.name": "Actualidad Congreso Joven",
    "home.stats": D.STATS,
    "social.links": [],
    "contact.email": "congresojovendeguatemala@gmail.com",
  };
  for (const [key, value] of Object.entries(settings)) {
    await db.insert(s.settings).values({ key, value }).onConflictDoNothing();
  }

  await db.insert(s.contentRequests).values(D.CONTENT_REQUESTS).onConflictDoNothing();

  console.log("✓ Datos iniciales cargados (sin datos personales de postulantes)");
  await closeDb();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
