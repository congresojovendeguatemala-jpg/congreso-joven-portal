import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { can, ROLE_LABELS, type Capability } from "@/lib/permissions";
import { getResource } from "@/lib/admin/resources";
import { logout } from "../actions";

export const metadata = { title: "Panel", robots: { index: false } };

type Item = { href: string; label: string; cap: Capability };
const r = (key: string): Item => {
  const res = getResource(key)!;
  return { href: `/admin/r/${key}`, label: res.label, cap: res.cap };
};

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: "General",
    items: [
      { href: "/admin", label: "Resumen", cap: "dashboard.view" },
      { href: "/admin/postulaciones", label: "Postulaciones", cap: "applications.view" },
      { href: "/admin/pendientes", label: "Contenido pendiente", cap: "content_requests.view" },
    ],
  },
  { title: "Institución", items: [r("personas"), r("organos"), r("historia")] },
  { title: "Territorio", items: [r("regiones"), r("departamentos")] },
  { title: "Trabajo", items: [r("proyectos"), r("eventos"), r("internacional"), r("alianzas")] },
  {
    title: "Archivo",
    items: [{ href: "/admin/multimedia", label: "Multimedia y documentos", cap: "media.upload" }, r("albumes")],
  },
  {
    title: "Editorial",
    items: [{ href: "/admin/articulos", label: "Artículos", cap: "articles.submit" }, r("autores"), r("categorias")],
  },
  {
    title: "Sistema",
    items: [
      { href: "/admin/configuracion", label: "Configuración", cap: "settings.edit" },
      { href: "/admin/usuarios", label: "Usuarios", cap: "users.manage" },
      { href: "/admin/auditoria", label: "Auditoría", cap: "audit.view" },
    ],
  },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/ingresar");
  return (
    <div className="min-h-svh bg-stone-100 md:grid md:grid-cols-[250px_1fr]">
      <aside className="bg-ink p-5 text-blue-100/80 md:min-h-svh">
        <Link href="/" className="font-serif text-lg text-white">Congreso Joven</Link>
        <p className="eyebrow mt-1 text-[0.58rem] text-blue-300">Panel institucional</p>
        <nav className="mt-6 flex gap-4 overflow-x-auto md:flex-col md:gap-5">
          {GROUPS.map((g) => {
            const items = g.items.filter((i) => can(user.role, i.cap));
            if (!items.length) return null;
            return (
              <div key={g.title} className="shrink-0">
                <p className="eyebrow mb-1.5 px-3 text-[0.55rem] text-blue-100/40">{g.title}</p>
                <div className="flex gap-1 md:flex-col">
                  {items.map((n) => (
                    <Link key={n.href} href={n.href} className="shrink-0 rounded px-3 py-1.5 text-sm hover:bg-white/5 hover:text-white">
                      {n.label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
        <div className="mt-8 border-t border-white/10 pt-5 text-xs">
          <p className="text-white">{user.name}</p>
          <p>{ROLE_LABELS[user.role]}</p>
          <Link href="/admin/cuenta" className="mt-3 block text-blue-300 hover:text-white">Mi cuenta y contraseña</Link>
          <form action={logout}>
            <button className="mt-3 text-blue-300 hover:text-white">Cerrar sesión</button>
          </form>
        </div>
      </aside>
      <div className="min-w-0 p-5 md:p-10">{children}</div>
    </div>
  );
}
