import "server-only";
import { and, eq, lte, sql } from "drizzle-orm";
import { db, schema as s } from "@/db";

/**
 * Publicación programada sin tareas en segundo plano: antes de leer artículos públicos,
 * los programados cuya hora ya llegó pasan a "publicado". Idempotente y barato.
 */
export async function promoteScheduled() {
  await db
    .update(s.articles)
    .set({ status: "publicado", publishedAt: sql`${s.articles.scheduledAt}` })
    .where(and(eq(s.articles.status, "programado"), lte(s.articles.scheduledAt, new Date())));
}
