import "server-only";
import { inArray } from "drizzle-orm";
import { db, schema as s } from "@/db";

export type Stat = { value: string; label: string; note: string; verification: string };

export async function getSettings<T extends Record<string, unknown>>(keys: string[]): Promise<Partial<T>> {
  const rows = await db.select().from(s.settings).where(inArray(s.settings.key, keys));
  return Object.fromEntries(rows.map((r) => [r.key, r.value])) as Partial<T>;
}

export async function getSiteMeta() {
  const v = await getSettings<{ "site.name": string; "editorial.name": string; "site.tagline": string; "contact.email": string; "social.links": unknown }>([
    "site.name",
    "editorial.name",
    "site.tagline",
    "contact.email",
    "social.links",
  ]);
  return {
    social: ((v as Record<string, unknown>)["social.links"] as { label: string; url: string }[] | undefined) ?? [],
    email: (v["contact.email"] as string) || "",
    siteName: (v["site.name"] as string) ?? "Congreso Joven Guatemala",
    editorialName: (v["editorial.name"] as string) ?? "Actualidad Congreso Joven",
    tagline: (v["site.tagline"] as string) ?? "",
  };
}
