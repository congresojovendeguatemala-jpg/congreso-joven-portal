import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { can, type Capability, type Role } from "./permissions";

export const SESSION_COOKIE = "cj_session";
const SESSION_DAYS = 7;

let dummyHash: string | undefined;
const hashToken =(t: string) => createHash("sha256").update(t).digest("hex");

export type SessionUser = { id: string; email: string; name: string; role: Role; regionId: number | null };

export async function verifyCredentials(email: string, password: string) {
  const [u] = await db.select().from(s.users).where(eq(s.users.email, email.toLowerCase().trim()));
  // Comparar siempre para no filtrar por tiempo de respuesta si el usuario existe.
  dummyHash ??= await bcrypt.hash("cj-dummy", 12);
  const ok = await bcrypt.compare(password, u?.passwordHash ?? dummyHash);
  if (!u || !ok || !u.active) return null;
  return u;
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await db.insert(s.sessions).values({ id: hashToken(token), userId, expiresAt });
  await db.update(s.users).set({ lastLoginAt: new Date() }).where(eq(s.users.id, userId));
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(s.sessions).where(eq(s.sessions.id, hashToken(token)));
  jar.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [row] = await db
    .select({ id: s.users.id, email: s.users.email, name: s.users.name, role: s.users.role, regionId: s.users.regionId, active: s.users.active })
    .from(s.sessions)
    .innerJoin(s.users, eq(s.sessions.userId, s.users.id))
    .where(and(eq(s.sessions.id, hashToken(token)), gt(s.sessions.expiresAt, new Date())));
  if (!row || !row.active) return null;
  return { id: row.id, email: row.email, name: row.name, role: row.role, regionId: row.regionId };
}

/** Para páginas y Server Actions del panel. */
export async function requireCapability(cap: Capability): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) redirect("/admin/ingresar");
  if (!can(u.role, cap)) redirect("/admin?denegado=1");
  return u;
}
