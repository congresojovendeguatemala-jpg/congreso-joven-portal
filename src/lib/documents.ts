import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db, schema as s } from "@/db";

/** Documentos públicos de ciertos tipos (para Transparencia, Elecciones…). */
export async function publicDocs(types: string[]) {
  return db
    .select({ id: s.media.id, url: s.media.url, title: s.media.title, caption: s.media.caption, docType: s.media.docType, date: s.media.date, year: s.media.year, bytes: s.media.bytes })
    .from(s.media)
    .where(and(eq(s.media.kind, "document"), eq(s.media.public, true), inArray(s.media.docType, types)))
    .orderBy(desc(s.media.date), desc(s.media.createdAt));
}
