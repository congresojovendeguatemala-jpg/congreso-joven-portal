import * as schema from "./schema";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

/**
 * Conexión a la base de datos.
 * - DATABASE_URL=postgres://…  → PostgreSQL (producción: Supabase, Neon, RDS…)
 * - sin DATABASE_URL           → PGlite embebido en ./.data/pglite (desarrollo local)
 * Ambos hablan el mismo dialecto de Postgres, así que las consultas no cambian.
 */
export type DB = PgDatabase<PgQueryResultHKT, typeof schema>;

const g = globalThis as unknown as { __cjdb?: DB; __cjdbClose?: () => Promise<void> };

function create(): { db: DB; close: () => Promise<void> } {
  const url = process.env.DATABASE_URL;
  if (url && url.startsWith("postgres")) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pool } = require("pg") as typeof import("pg");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { drizzle } = require("drizzle-orm/node-postgres") as typeof import("drizzle-orm/node-postgres");
    const pool = new Pool({ connectionString: url, max: 10 });
    return { db: drizzle(pool, { schema }) as unknown as DB, close: () => pool.end() };
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PGlite } = require("@electric-sql/pglite") as typeof import("@electric-sql/pglite");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle } = require("drizzle-orm/pglite") as typeof import("drizzle-orm/pglite");
  const dir = process.env.PGLITE_DIR ?? "./.data/pglite";
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  (require("node:fs") as typeof import("node:fs")).mkdirSync(dir, { recursive: true });
  const client = new PGlite(dir);
  return { db: drizzle(client, { schema }) as unknown as DB, close: () => client.close() };
}

function instance(): DB {
  if (!g.__cjdb) {
    const c = create();
    g.__cjdb = c.db;
    g.__cjdbClose = c.close;
  }
  return g.__cjdb;
}

/**
 * Conexión diferida: se abre en la primera consulta, no al importar el módulo.
 * Evita que los procesos de `next build` abran PGlite en paralelo.
 */
export const db = new Proxy({} as DB, {
  get(_t, prop) {
    const real = instance() as unknown as Record<string | symbol, unknown>;
    const v = real[prop];
    return typeof v === "function" ? (v as (...a: unknown[]) => unknown).bind(real) : v;
  },
});
export const closeDb = () => g.__cjdbClose?.() ?? Promise.resolve();
export { schema };
