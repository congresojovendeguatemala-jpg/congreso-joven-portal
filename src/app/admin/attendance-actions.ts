"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { requireCapability } from "@/lib/auth";
import { audit } from "@/lib/audit";

const STATUSES = ["confirmado", "asistio", "cancelado"] as const;

export async function setRegistrationStatus(registrationId: number, eventId: number, form: FormData) {
  const user = await requireCapability("events.manage");
  const status = String(form.get("status") ?? "");
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) return;
  await db
    .update(s.eventRegistrations)
    .set({ status: status as (typeof STATUSES)[number], updatedAt: new Date() })
    .where(eq(s.eventRegistrations.id, registrationId));
  await audit(user.id, "registration.status", "event_registrations", registrationId, { status });
  revalidatePath(`/admin/asistencia/${eventId}`);
}
