"use server";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, count, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db, schema as s } from "@/db";
import { requireCapability } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { ROLE_LABELS, type Role } from "@/lib/permissions";

const rowsOf = (raw: string, cols: string[]) =>
  raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const p = l.split("|").map((x) => x.trim());
      return Object.fromEntries(cols.map((c, i) => [c, p[i] ?? ""]));
    });

export async function saveSettings(form: FormData) {
  const user = await requireCapability("settings.edit");
  const email = String(form.get("contact.email") ?? "").trim();
  if (email && !z.string().email().safeParse(email).success) redirect("/admin/configuracion?error=Correo%20no%20v%C3%A1lido");
  const values: Record<string, unknown> = {
    "site.name": String(form.get("site.name") ?? "").trim() || "Congreso Joven Guatemala",
    "site.tagline": String(form.get("site.tagline") ?? "").trim(),
    "editorial.name": String(form.get("editorial.name") ?? "").trim() || "Actualidad Congreso Joven",
    "contact.email": email,
    "social.links": rowsOf(String(form.get("social.links") ?? ""), ["label", "url"]).filter((r) => /^https:\/\//.test(r.url)),
    "home.stats": rowsOf(String(form.get("home.stats") ?? ""), ["value", "label", "note", "verification"]),
  };
  for (const [key, value] of Object.entries(values)) {
    await db.insert(s.settings).values({ key, value }).onConflictDoUpdate({ target: s.settings.key, set: { value, updatedAt: new Date() } });
  }
  await audit(user.id, "update", "settings", undefined, { claves: Object.keys(values) });
  redirect("/admin/configuracion?ok=1");
}

/* ───────── Usuarios ───────── */

const ROLES = Object.keys(ROLE_LABELS) as [Role, ...Role[]];

type OneTime = { password?: string; error?: string; email?: string };

export async function createUser(_prev: OneTime, form: FormData): Promise<OneTime> {
  const actor = await requireCapability("users.manage");
  const parsed = z
    .object({ email: z.string().trim().toLowerCase().email(), name: z.string().trim().min(2).max(120), role: z.enum(ROLES) })
    .safeParse({ email: form.get("email"), name: form.get("name"), role: form.get("role") });
  if (!parsed.success) return { error: "Revisa el correo, el nombre y el rol." };
  const [exists] = await db.select({ id: s.users.id }).from(s.users).where(eq(s.users.email, parsed.data.email));
  if (exists) return { error: "Ya existe un usuario con ese correo." };
  const password = randomBytes(12).toString("base64url");
  const [u] = await db
    .insert(s.users)
    .values({ ...parsed.data, passwordHash: await bcrypt.hash(password, 12) })
    .returning({ id: s.users.id });
  await audit(actor.id, "create", "users", u.id, { email: parsed.data.email, role: parsed.data.role });
  return { password, email: parsed.data.email };
}

async function activeSuperadmins(excluding: string) {
  const [r] = await db
    .select({ c: count() })
    .from(s.users)
    .where(and(eq(s.users.role, "superadmin"), eq(s.users.active, true), ne(s.users.id, excluding)));
  return r?.c ?? 0;
}

export async function updateUser(form: FormData) {
  const actor = await requireCapability("users.manage");
  const id = String(form.get("id") ?? "");
  const role = z.enum(ROLES).safeParse(form.get("role"));
  const active = form.get("active") === "on";
  if (!role.success || !/^[0-9a-f-]{36}$/.test(id)) redirect("/admin/usuarios?error=Datos%20no%20v%C3%A1lidos");
  const [target] = await db.select().from(s.users).where(eq(s.users.id, id));
  if (!target) redirect("/admin/usuarios");
  // Siempre debe quedar al menos un superadministrador activo.
  if (target.role === "superadmin" && (role.data !== "superadmin" || !active) && (await activeSuperadmins(id)) === 0) {
    redirect("/admin/usuarios?error=Debe%20quedar%20al%20menos%20un%20superadministrador%20activo");
  }
  await db.update(s.users).set({ role: role.data, active }).where(eq(s.users.id, id));
  if (!active) await db.delete(s.sessions).where(eq(s.sessions.userId, id));
  await audit(actor.id, "update", "users", id, { role: role.data, active });
  redirect("/admin/usuarios?ok=1");
}

export async function resetPassword(_prev: OneTime, form: FormData): Promise<OneTime> {
  const actor = await requireCapability("users.manage");
  const id = String(form.get("id") ?? "");
  const [target] = await db.select().from(s.users).where(eq(s.users.id, id));
  if (!target) return {};
  const password = randomBytes(12).toString("base64url");
  await db.update(s.users).set({ passwordHash: await bcrypt.hash(password, 12) }).where(eq(s.users.id, id));
  await db.delete(s.sessions).where(eq(s.sessions.userId, id));
  await audit(actor.id, "password.reset", "users", id);
  return { password, email: target.email };
}
