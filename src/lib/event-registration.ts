"use server";
import { z } from "zod";
import { and, count, eq, ne } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { checkSpam, ipHash } from "./antispam";

export type RegState = { ok?: boolean; message?: string; errors?: Record<string, string>; name?: string };

const NAME = /^[\p{L}][\p{L}'’\-. ]*$/u;

/** CUI del DPI: 13 dígitos; los dígitos 10–11 son el código de departamento (01–22) y 12–13 el de municipio. */
function validDpi(cui: string) {
  if (!/^\d{13}$/.test(cui)) return false;
  const dept = Number(cui.slice(9, 11));
  const muni = Number(cui.slice(11, 13));
  return dept >= 1 && dept <= 22 && muni >= 1;
}

const schema = z.object({
  firstNames: z.string().trim().min(2, "Escribe tus nombres.").max(80).regex(NAME, "Usa solo letras."),
  lastNames: z.string().trim().min(2, "Escribe tus apellidos.").max(80).regex(NAME, "Usa solo letras."),
  dpi: z
    .string()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .refine(validDpi, "Revisa el número de DPI (13 dígitos, tal como aparece en el documento)."),
  institution: z.string().trim().min(2, "Indica tu universidad o institución.").max(160),
  age: z.coerce.number({ message: "Indica tu edad." }).int("Indica tu edad en años.").min(14, "Edad no válida.").max(99, "Edad no válida."),
  email: z.string().trim().toLowerCase().email("Correo electrónico no válido.").max(160),
  phone: z
    .string()
    .transform((v) => v.replace(/[\s\-()]/g, ""))
    .refine((v) => /^\+?\d{8,15}$/.test(v), "Teléfono no válido (8 dígitos, o con código de país)."),
});

export async function registerForEvent(eventId: number, _prev: RegState, form: FormData): Promise<RegState> {
  const spam = await checkSpam(form);
  if (spam) return { message: spam };
  if (form.get("privacy") !== "on") return { errors: { privacy: "Debes aceptar el uso de tus datos para el registro." } };

  const parsed = schema.safeParse(Object.fromEntries(["firstNames", "lastNames", "dpi", "institution", "age", "email", "phone"].map((k) => [k, String(form.get(k) ?? "")])));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;
    return { errors, message: "Revisa los campos marcados." };
  }
  const d = parsed.data;

  const [ev] = await db.select().from(s.events).where(eq(s.events.id, eventId));
  if (!ev || !ev.published || !ev.registrationOpen) return { message: "Las inscripciones para este evento están cerradas." };
  if ((ev.endsAt ?? ev.startsAt).getTime() < Date.now()) return { message: "Este evento ya se realizó." };

  if (ev.capacity) {
    const [{ c }] = await db
      .select({ c: count() })
      .from(s.eventRegistrations)
      .where(and(eq(s.eventRegistrations.eventId, ev.id), ne(s.eventRegistrations.status, "cancelado")));
    if (c >= ev.capacity) return { message: "Lo sentimos: el cupo de este evento está completo." };
  }

  const [dup] = await db
    .select({ id: s.eventRegistrations.id })
    .from(s.eventRegistrations)
    .where(and(eq(s.eventRegistrations.eventId, ev.id), eq(s.eventRegistrations.dpi, d.dpi)));
  if (dup) return { message: "Este DPI ya tiene la asistencia confirmada para este evento.", errors: { dpi: "Ya registrado." } };

  try {
    await db.insert(s.eventRegistrations).values({
      eventId: ev.id,
      firstNames: d.firstNames,
      lastNames: d.lastNames,
      dpi: d.dpi,
      institution: d.institution,
      age: d.age,
      email: d.email,
      phone: d.phone,
      privacyAccepted: true,
      photoConsent: form.get("photoConsent") === "on",
      ipHash: await ipHash(),
    });
  } catch {
    // Dos envíos simultáneos con el mismo DPI: el índice único lo impide.
    return { message: "Este DPI ya tiene la asistencia confirmada para este evento." };
  }
  return { ok: true, name: d.firstNames.split(" ")[0] };
}
