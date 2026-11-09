import "./load-env";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { db, closeDb, schema as s } from "./index";

/**
 * Crea el superadministrador inicial.
 *   npm run admin:create -- correo@dominio.org "Nombre Apellido"
 * La contraseña se genera aleatoriamente y se muestra una sola vez en esta consola.
 */
async function main() {
  const [email, name] = process.argv.slice(2);
  if (!email || !name) {
    console.error('Uso: npm run admin:create -- correo@dominio.org "Nombre Apellido"');
    process.exit(1);
  }
  const password = randomBytes(12).toString("base64url");
  const passwordHash = await bcrypt.hash(password, 12);
  await db
    .insert(s.users)
    .values({ email: email.toLowerCase(), name, passwordHash, role: "superadmin" })
    .onConflictDoUpdate({ target: s.users.email, set: { passwordHash, role: "superadmin", active: true } });
  console.log(`\n✓ Superadministrador listo: ${email}\n  Contraseña temporal: ${password}\n  Cámbiala al ingresar, en Panel → «Mi cuenta y contraseña».\n`);
  await closeDb();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
