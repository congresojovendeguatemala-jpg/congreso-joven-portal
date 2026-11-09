/**
 * ¿A qué base de datos se conecta este proceso?
 * - Si existe PGLITE_DIR (solo se define en la computadora de desarrollo), SIEMPRE se usa PGlite local,
 *   aunque `vercel env pull` o una integración hayan escrito DATABASE_URL en .env.local. Así el entorno
 *   local nunca escribe por accidente en la base de producción.
 * - Si no, se usa DATABASE_URL o POSTGRES_URL (Vercel + Neon).
 * - Para operar a propósito sobre la base remota desde la computadora (p. ej. crear el primer
 *   administrador), se ejecuta con USE_REMOTE_DB=1.
 */
export function remoteDatabaseUrl(): string | null {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url || !url.startsWith("postgres")) return null;
  if (process.env.PGLITE_DIR && process.env.USE_REMOTE_DB !== "1") return null;
  return url;
}
