"use server";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, ne } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { getSessionUser, SESSION_COOKIE } from "@/lib/auth";
import { audit } from "@/lib/audit";

export type PwState = { ok?: boolean; error?: string };

/** Cambio de la propia contraseña: exige la actual y cierra las demás sesiones abiertas. */
export async function changeOwnPassword(_prev: PwState, form: FormData): Promise<PwState> {
  const user = await getSessionUser();
  if (!user) return { error: "Tu sesión expiró. Vuelve a ingresar." };
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  const confirm = String(form.get("confirm") ?? "");

  if (next.length < 12) return { error: "La nueva contraseña debe tener al menos 12 caracteres." };
  if (next.length > 200) return { error: "La nueva contraseña es demasiado larga." };
  if (next !== confirm) return { error: "La confirmación no coincide con la nueva contraseña." };
  if (next === current) return { error: "La nueva contraseña debe ser distinta de la actual." };
  if (next.toLowerCase().includes(user.email.split("@")[0].toLowerCase())) return { error: "No uses tu correo dentro de la contraseña." };

  const [row] = await db.select({ hash: s.users.passwordHash }).from(s.users).where(eq(s.users.id, user.id));
  if (!row || !(await bcrypt.compare(current, row.hash))) return { error: "La contraseña actual no es correcta." };

  await db.update(s.users).set({ passwordHash: await bcrypt.hash(next, 12) }).where(eq(s.users.id, user.id));
  // Cierra todas las demás sesiones (otros navegadores o equipos); conserva la actual.
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? "";
  const currentId = createHash("sha256").update(token).digest("hex");
  await db.delete(s.sessions).where(and(eq(s.sessions.userId, user.id), ne(s.sessions.id, currentId)));
  await audit(user.id, "password.change", "users", user.id);
  return { ok: true };
}
