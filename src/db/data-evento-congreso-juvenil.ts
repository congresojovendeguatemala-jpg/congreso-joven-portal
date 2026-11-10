import "./load-env";
import { eq } from "drizzle-orm";
import { db, closeDb, schema as s } from "./index";

/**
 * Carga del evento «Congreso Juvenil» (27 nov. 2026), con los datos de los afiches oficiales.
 * Idempotente: crea el evento o actualiza el existente con el mismo identificador.
 *   Local:      npm run data:evento-congreso-juvenil
 *   Producción: $env:USE_REMOTE_DB = '1'; vercel env run -e production -- npm run data:evento-congreso-juvenil
 */
const EVENT = {
  slug: "congreso-juvenil-2026",
  title: "Congreso Juvenil",
  summary: "La importancia del Organismo Legislativo",
  body: "El futuro legislativo también se construye con juventud.",
  startsAt: new Date("2026-11-27T09:00:00-06:00"),
  endsAt: null,
  location: "Salón de Jefes de Bloque, Congreso de la República de Guatemala",
  speakers: [
    {
      name: "Carlos Malo de Molina",
      role: "Presidente y fundador de Consultores Internacionales de Marketing Político, Sigma Dos Internacional y Green Valley Panamá.",
      group: "Conferencista",
    },
    { name: "Elmer Palencia", role: "Segundo vicepresidente de la Junta Directiva.", group: "Diputados" },
    { name: "Ronald Portillo", role: "", group: "Diputados" },
    { name: "Mynor de la Rosa", role: "", group: "Diputados" },
  ],
  images: ["/images/eventos/congreso-juvenil-2026-afiche.webp", "/images/eventos/congreso-juvenil-2026-participantes.webp"],
  registrationOpen: false,
  published: true,
};

async function main() {
  const [existing] = await db.select({ id: s.events.id }).from(s.events).where(eq(s.events.slug, EVENT.slug));
  if (existing) {
    await db.update(s.events).set(EVENT).where(eq(s.events.id, existing.id));
    console.log(`✓ Evento actualizado (#${existing.id}): ${EVENT.title}`);
  } else {
    const [row] = await db.insert(s.events).values(EVENT).returning({ id: s.events.id });
    console.log(`✓ Evento creado (#${row.id}): ${EVENT.title}`);
  }
  await closeDb();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
