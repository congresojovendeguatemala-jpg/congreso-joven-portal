"use server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { checkSpam, ipHash } from "./antispam";
import { getModality, type Field } from "./modalities";

export type FormState = { ok: boolean; message?: string; errors?: Record<string, string> };

function fieldSchema(f: Field) {
  if (f.type === "checkboxes") {
    const base = z.array(z.string().max(80)).max(20);
    return f.required ? base.min(1, "Selecciona al menos una opción.") : base;
  }
  let str = z.string().trim().max(f.max ?? 500, `Máximo ${f.max ?? 500} caracteres.`);
  if (f.type === "email") str = str.email("Correo electrónico no válido.");
  if (f.type === "url") return f.required ? z.string().trim().url("Enlace no válido.") : z.union([z.literal(""), z.string().trim().url("Enlace no válido.")]);
  if (f.type === "date") str = str.regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida.");
  if (f.options && f.type === "select") str = str.refine((v) => v === "" || f.options!.includes(v), "Opción no válida.");
  if (f.required) return str.min(1, "Este campo es obligatorio.");
  return z.union([z.literal(""), str]);
}

export async function submitApplication(slug: string, _prev: FormState, form: FormData): Promise<FormState> {
  const m = getModality(slug);
  if (!m) return { ok: false, message: "Modalidad no válida." };

  const spam = await checkSpam(form);
  if (spam) return { ok: false, message: spam };

  if (form.get("privacy") !== "on") return { ok: false, errors: { privacy: "Debes aceptar la política de privacidad." } };

  const raw: Record<string, unknown> = {};
  for (const f of m.fields) raw[f.name] = f.type === "checkboxes" ? form.getAll(f.name).map(String) : String(form.get(f.name) ?? "");

  const shape = Object.fromEntries(m.fields.map((f) => [f.name, fieldSchema(f)]));
  const parsed = z.object(shape).safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
    return { ok: false, errors, message: "Revisa los campos marcados." };
  }
  const data = parsed.data as Record<string, unknown>;

  // Edad orientativa (20–32 años según el registro institucional): se informa al revisor, no se rechaza automáticamente.
  if (typeof data.birthDate === "string" && data.birthDate) {
    const age = Math.floor((Date.now() - new Date(data.birthDate).getTime()) / (365.25 * 86400_000));
    if (age < 13 || age > 99) return { ok: false, errors: { birthDate: "Revisa la fecha de nacimiento." } };
    data.ageAtSubmission = age;
  }

  let departmentId: number | null = null;
  if (typeof data.department === "string" && data.department) {
    const [d] = await db.select({ id: s.departments.id }).from(s.departments).where(eq(s.departments.slug, data.department));
    if (!d) return { ok: false, errors: { department: "Departamento no válido." } };
    departmentId = d.id;
  }

  const { fullName, email, phone, department: _d, ...rest } = data;
  void _d;
  await db.insert(s.applications).values({
    type: m.type,
    fullName: String(fullName),
    email: String(email).toLowerCase(),
    phone: phone ? String(phone) : null,
    departmentId,
    data: rest,
    privacyAccepted: true,
    photoConsent: form.get("photoConsent") === "on",
    history: [{ at: new Date().toISOString(), by: null, status: "recibida" }],
    ipHash: await ipHash(),
  });

  // Notificación administrativa: se activa cuando exista RESEND_API_KEY + NOTIFY_EMAIL (ver docs).
  return {
    ok: true,
    message:
      m.type === "contacto"
        ? "Mensaje recibido. Te responderemos al correo indicado."
        : "Solicitud recibida. El equipo de Congreso Joven la revisará y te contactará por correo. Ninguna postulación se aprueba automáticamente.",
  };
}
