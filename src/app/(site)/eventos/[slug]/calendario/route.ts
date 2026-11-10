import { and, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";

/** Archivo .ics para agregar el evento a Google Calendar, Outlook o Apple Calendar. */
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
// RFC 5545: escapar comas, punto y coma, barras y saltos de línea
const esc = (t: string) => t.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [e] = await db.select().from(s.events).where(and(eq(s.events.slug, slug), eq(s.events.published, true)));
  if (!e) return new Response("No encontrado", { status: 404 });
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const end = e.endsAt ?? new Date(e.startsAt.getTime() + 2 * 3600_000);
  const desc = [e.summary, (e.speakers ?? []).map((x) => `${x.group ? x.group + ": " : ""}${x.name}`).join("\n"), `${site}/eventos/${e.slug}`].filter(Boolean).join("\n\n");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Congreso Joven Guatemala//Portal//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:evento-${e.id}@congreso-joven-portal`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(e.startsAt)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(e.title)}`,
    e.location ? `LOCATION:${esc(e.location)}` : "",
    `DESCRIPTION:${esc(desc)}`,
    `URL:${site}/eventos/${e.slug}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${e.slug}.ics"`,
    },
  });
}
