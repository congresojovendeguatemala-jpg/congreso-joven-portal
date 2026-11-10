import { asc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { slugify } from "@/db/seed-data";

const LABEL: Record<string, string> = { confirmado: "Confirmado", asistio: "Asistió", cancelado: "Cancelado" };

/** Celda CSV segura: comillas escapadas y sin fórmulas (evita inyección en Excel). */
function cell(v: unknown) {
  let t = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(t)) t = "'" + t;
  return `"${t.replace(/"/g, '""')}"`;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user || !can(user.role, "events.manage")) return new Response("No autorizado", { status: 401 });
  const { id } = await params;
  if (!/^\d+$/.test(id)) return new Response("No encontrado", { status: 404 });
  const [ev] = await db.select().from(s.events).where(eq(s.events.id, Number(id)));
  if (!ev) return new Response("No encontrado", { status: 404 });
  const rows = await db.select().from(s.eventRegistrations).where(eq(s.eventRegistrations.eventId, ev.id)).orderBy(asc(s.eventRegistrations.createdAt));

  const fmt = new Intl.DateTimeFormat("es-GT", { timeZone: "America/Guatemala", dateStyle: "short", timeStyle: "short" });
  const header = ["#", "Nombres", "Apellidos", "DPI", "Universidad o institución", "Edad", "Correo electrónico", "Teléfono", "Estado", "Autoriza fotografías", "Fecha de registro"];
  const lines = rows.map((r, i) =>
    [
      i + 1,
      r.firstNames,
      r.lastNames,
      // Como fórmula de texto para que Excel no lo convierta en número científico
      `="${r.dpi}"`,
      r.institution,
      r.age,
      r.email,
      r.phone,
      LABEL[r.status],
      r.photoConsent ? "Sí" : "No",
      fmt.format(r.createdAt),
    ]
      .map((v, k) => (k === 3 ? `"${String(v).replace(/"/g, '""')}"` : cell(v)))
      .join(","),
  );
  await audit(user.id, "registrations.export", "events", ev.id, { filas: rows.length });
  // BOM para que Excel abra bien los acentos
  const csv = "﻿" + [header.map(cell).join(","), ...lines].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="asistencia-${slugify(ev.title)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
