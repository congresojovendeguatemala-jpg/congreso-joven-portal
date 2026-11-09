import "./load-env";
import { rmSync } from "node:fs";
import { remoteDatabaseUrl } from "./target";

/** Solo desarrollo: borra la base PGlite local. Nunca toca PostgreSQL. */
if (remoteDatabaseUrl()) {
  console.error("✗ db:reset solo funciona con PGlite local y este proceso apunta a PostgreSQL remoto: operación cancelada.");
  process.exit(1);
}
const dir = process.env.PGLITE_DIR ?? "./.data/pglite";
rmSync(dir, { recursive: true, force: true });
console.log(`✓ Base local eliminada (${dir})`);
