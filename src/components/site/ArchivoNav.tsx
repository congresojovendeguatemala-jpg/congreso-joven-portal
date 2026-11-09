import Link from "next/link";

const TABS = [
  { href: "/archivo", label: "Cronología y búsqueda" },
  { href: "/archivo/galeria", label: "Galería" },
  { href: "/archivo/videos", label: "Videoteca" },
  { href: "/archivo/documentos", label: "Documentos" },
];

export function ArchivoNav({ active }: { active: string }) {
  return (
    <nav aria-label="Secciones del archivo" className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-5 md:px-8">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active === t.href ? "page" : undefined}
            className={`shrink-0 border-b-2 px-4 py-4 text-sm ${active === t.href ? "border-blue-600 font-medium text-ink" : "border-transparent text-graphite hover:text-ink"}`}
          >
            {t.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
