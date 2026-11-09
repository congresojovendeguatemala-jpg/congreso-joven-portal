import Link from "next/link";
import { count, eq, gte, inArray } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { can, ROLE_LABELS } from "@/lib/permissions";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denegado?: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/ingresar");
  const { denegado } = await searchParams;
  // Sin redirección aquí: /admin es el destino de "permiso denegado" y redirigir crearía un bucle.
  if (!can(user.role, "dashboard.view")) {
    return (
      <div className="max-w-xl">
        <h1 className="font-serif text-3xl">Hola, {user.name}</h1>
        <p className="mt-3 text-graphite">Tu rol ({ROLE_LABELS[user.role]}) tiene acceso a las secciones del menú lateral.</p>
        {denegado && <p className="mt-4 border-l-2 border-amber-600 bg-amber-50 px-4 py-3 text-sm">Tu rol no tiene permiso para esa sección.</p>}
      </div>
    );
  }
  const n = async (q: Promise<{ c: number }[]>) => (await q)[0]?.c ?? 0;
  const [pending, members, submitted, published, events, projects, requests] = await Promise.all([
    n(db.select({ c: count() }).from(s.applications).where(inArray(s.applications.status, ["recibida", "en_revision", "info_solicitada"]))),
    n(db.select({ c: count() }).from(s.applications).where(eq(s.applications.status, "aprobada"))),
    n(db.select({ c: count() }).from(s.articles).where(inArray(s.articles.status, ["enviado", "en_revision"]))),
    n(db.select({ c: count() }).from(s.articles).where(eq(s.articles.status, "publicado"))),
    n(db.select({ c: count() }).from(s.events).where(gte(s.events.startsAt, new Date()))),
    n(db.select({ c: count() }).from(s.projects).where(eq(s.projects.active, true))),
    n(db.select({ c: count() }).from(s.contentRequests).where(eq(s.contentRequests.status, "pendiente"))),
  ]);
  const cards = [
    { label: "Solicitudes por revisar", value: pending, href: "/admin/postulaciones" },
    { label: "Postulaciones aprobadas", value: members, href: "/admin/postulaciones?estado=aprobada" },
    { label: "Artículos en revisión", value: submitted },
    { label: "Artículos publicados", value: published },
    { label: "Próximos eventos", value: events },
    { label: "Proyectos activos", value: projects },
    { label: "Materiales pendientes", value: requests, href: "/admin/pendientes" },
  ];
  return (
    <>
      {denegado && <p className="mb-6 border-l-2 border-amber-600 bg-amber-50 px-4 py-3 text-sm">Tu rol no tiene permiso para esa sección.</p>}
      <h1 className="font-serif text-3xl">Resumen</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => {
          const body = (
            <>
              <p className="font-serif text-4xl text-navy-900">{c.value}</p>
              <p className="mt-2 text-sm text-graphite">{c.label}</p>
            </>
          );
          return c.href ? (
            <Link key={c.label} href={c.href} className="border border-stone-200 bg-white p-6 hover:border-blue-500">{body}</Link>
          ) : (
            <div key={c.label} className="border border-stone-200 bg-white p-6">{body}</div>
          );
        })}
      </div>
      <p className="mt-8 text-xs text-stone-400">Estadísticas de visitas: se activan al conectar un servicio de analítica (por ejemplo Plausible o Umami).</p>
    </>
  );
}
