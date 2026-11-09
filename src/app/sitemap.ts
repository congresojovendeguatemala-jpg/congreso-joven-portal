import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";

export const dynamic = "force-dynamic";
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fixed = ["", "/conocenos", "/estructura", "/territorio", "/participa", "/proyectos", "/internacional", "/congreso", "/actualidad", "/elecciones", "/archivo", "/archivo/galeria", "/archivo/videos", "/archivo/documentos", "/eventos", "/contacto"];
  const [articles, projects, engagements, people, regions, albums] = await Promise.all([
    db.select({ slug: s.articles.slug, updatedAt: s.articles.updatedAt }).from(s.articles).where(eq(s.articles.status, "publicado")),
    db.select({ slug: s.projects.slug }).from(s.projects).where(eq(s.projects.active, true)),
    db.select({ slug: s.engagements.slug }).from(s.engagements),
    db.select({ slug: s.people.slug }).from(s.people).where(eq(s.people.public, true)),
    db.select({ slug: s.regions.slug }).from(s.regions).where(eq(s.regions.active, true)),
    db.select({ slug: s.galleries.slug }).from(s.galleries).where(eq(s.galleries.public, true)),
  ]);
  return [
    ...fixed.map((p) => ({ url: `${SITE}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...articles.map((a) => ({ url: `${SITE}/actualidad/${a.slug}`, lastModified: a.updatedAt, priority: 0.8 })),
    ...projects.map((p) => ({ url: `${SITE}/proyectos/${p.slug}`, priority: 0.6 })),
    ...engagements.map((e) => ({ url: `${SITE}/internacional/${e.slug}`, priority: 0.5 })),
    ...people.map((p) => ({ url: `${SITE}/estructura/${p.slug}`, priority: 0.5 })),
    ...regions.map((r) => ({ url: `${SITE}/territorio/${r.slug}`, priority: 0.4 })),
    ...albums.map((a) => ({ url: `${SITE}/archivo/galeria/${a.slug}`, priority: 0.4 })),
  ];
}
