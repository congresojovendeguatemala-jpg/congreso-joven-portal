import "./load-env";
import { rmSync } from "node:fs";

/** Solo desarrollo: borra la base PGlite local. Nunca toca PostgreSQL. */
if (process.env.DATABASE_URL?.startsWith("postgres")) {
  console.error("✗ db:reset solo funciona con PGlite local. DATABASE_URL apunta a PostgreSQL: operación cancelada.");
  process.exit(1);
}
const dir = process.env.PGLITE_DIR ?? "./.data/pglite";
rmSync(dir, { recursive: true, force: true });
console.log(`✓ Base local eliminada (${dir})`);
