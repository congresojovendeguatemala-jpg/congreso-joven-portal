"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema as s } from "@/db";
import { createSession, destroySession, requireCapability, verifyCredentials } from "@/lib/auth";
import { audit } from "@/lib/audit";

const failed = new Map<string, { n: number; until: number }>();

export async function login(_prev: { error?: string }, form: FormData): Promise<{ error?: string }> {
  const email = String(form.get("email") ?? "").toLowerCase().trim();
  const password = String(form.get("password") ?? "");
  const f = failed.get(email);
  if (f && f.until > Date.now()) return { error: "Demasiados intentos. Espera unos minutos." };
  const user = await verifyCredentials(email, password);
  if (!user) {
    const n = (f?.n ?? 0) + 1;
    failed.set(email, { n, until: n >= 5 ? Date.now() + 10 * 60_000 : 0 });
    return { error: "Correo o contraseña incorrectos." };
  }
  failed.delete(email);
  await createSession(user.id);
  await audit(user.id, "login", "session");
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/ingresar");
}

const STATUSES = ["recibida", "en_revision", "info_solicitada", "aprobada", "rechazada", "archivada"] as const;

export async function updateApplication(form: FormData) {
  const user = await requireCapability("applications.review");
  const parsed = z
    .object({ id: z.string().uuid(), status: z.enum(STATUSES), note: z.string().max(2000).optional() })
    .safeParse({ id: form.get("id"), status: form.get("status"), note: form.get("note") || undefined });
  if (!parsed.success) return;
  const { id, status, note } = parsed.data;
  const [before] = await db.select({ status: s.applications.status }).from(s.applications).where(eq(s.applications.id, id));
  if (!before) return;
  const entry = { at: new Date().toISOString(), by: user.name, status, note };
  await db
    .update(s.applications)
    .set({
      status,
      reviewerNotes: note ?? undefined,
      updatedAt: new Date(),
      history: sql`${s.applications.history} || ${JSON.stringify([entry])}::jsonb`,
    })
    .where(eq(s.applications.id, id));
  await audit(user.id, "application.status", "applications", id, { from: before.status, to: status });
  revalidatePath(`/admin/postulaciones/${id}`);
  revalidatePath("/admin/postulaciones");
}

export async function setContentRequestStatus(form: FormData) {
  const user = await requireCapability("content_requests.view");
  const id = Number(form.get("id"));
  const status = z.enum(["pendiente", "recibido", "completado"]).safeParse(form.get("status"));
  if (!id || !status.success) return;
  await db.update(s.contentRequests).set({ status: status.data }).where(eq(s.contentRequests.id, id));
  await audit(user.id, "content_request.status", "content_requests", id, { status: status.data });
  revalidatePath("/admin/pendientes");
}
