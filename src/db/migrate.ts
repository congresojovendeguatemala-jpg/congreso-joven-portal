import "./load-env";
import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import { migrate as migrateLite } from "drizzle-orm/pglite/migrator";
import { db, closeDb } from "./index";

async function main() {
  const migrationsFolder = "./drizzle";
  if (process.env.DATABASE_URL?.startsWith("postgres")) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await migratePg(db as any, { migrationsFolder });
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await migrateLite(db as any, { migrationsFolder });
  }
  console.log("✓ Migraciones aplicadas");
  await closeDb();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
