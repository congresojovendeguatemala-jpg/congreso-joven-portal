"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export const NAV = [
  { href: "/conocenos", label: "Conócenos" },
  { href: "/estructura", label: "Estructura" },
  { href: "/territorio", label: "Territorio" },
  { href: "/proyectos", label: "Proyectos" },
  { href: "/internacional", label: "Internacional" },
  { href: "/congreso", label: "Congreso" },
  { href: "/actualidad", label: "Actualidad" },
  { href: "/archivo", label: "Archivo" },
];

export function Logo({ light = true }: { light?: boolean }) {
  // Marca provisional hasta recibir el logotipo oficial (ver Contenido pendiente).
  return (
    <span className={`flex items-center gap-3 ${light ? "text-white" : "text-ink"}`}>
      <svg viewBox="0 0 40 24" width="40" height="24" aria-hidden>
        {[0, 1, 2].map((r) =>
          Array.from({ length: 5 + r * 2 }).map((_, k, arr) => {
            const a = Math.PI - (Math.PI * (k + 0.5)) / arr.length;
            const rad = 9 + r * 5;
            // Redondeo: evita diferencias de coma flotante entre servidor y navegador (error de hidratación).
            return <rect key={`${r}-${k}`} x={(20 + rad * Math.cos(a) - 1.4).toFixed(2)} y={(22 - rad * Math.sin(a) - 1.1).toFixed(2)} width="2.8" height="2.2" rx="0.6" fill={r === 2 && k === 4 ? "var(--color-glow-strong)" : "currentColor"} opacity={r === 2 && k === 4 ? 1 : 0.55 + r * 0.15} />;
          }),
        )}
      </svg>
      <span className="whitespace-nowrap leading-none">
        <span className="block font-serif text-[1.05rem] tracking-tight">Congreso Joven</span>
        <span className="eyebrow block text-[0.55rem] opacity-70">Guatemala</span>
      </span>
    </span>
  );
}

export function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => setOpen(false), [path]);
  // Páginas de detalle sin portada oscura: el encabezado debe ser sólido para leerse.
  const lightTop = /^\/(actualidad|autores|estructura|participa)\/[^/]+/.test(path);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled || open || lightTop ? "bg-ink/95 shadow-[0_1px_0_rgba(157,184,255,0.12)] backdrop-blur" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:h-20 md:px-8">
        <Link href="/" aria-label="Congreso Joven Guatemala, inicio">
          <Logo />
        </Link>
        <nav aria-label="Principal" className="hidden items-center gap-6 xl:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`text-[0.82rem] transition-colors hover:text-white ${path.startsWith(n.href) ? "text-white" : "text-blue-100/70"}`}
            >
              {n.label}
            </Link>
          ))}
          <Link href="/participa" className="ml-2 rounded-full bg-white px-4 py-2 text-[0.82rem] font-semibold text-ink transition hover:bg-glow">
            Participa
          </Link>
        </nav>
        <button
          type="button"
          className="text-white xl:hidden"
          aria-expanded={open}
          aria-controls="menu-movil"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{open ? "Cerrar menú" : "Abrir menú"}</span>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>
      {open && (
        <nav id="menu-movil" aria-label="Menú móvil" className="border-t border-white/10 bg-ink px-5 pb-8 pt-4 xl:hidden">
          <ul className="space-y-1">
            {[...NAV, { href: "/elecciones", label: "Elecciones" }, { href: "/eventos", label: "Eventos" }, { href: "/contacto", label: "Contacto" }].map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="block py-2.5 font-serif text-xl text-white/90">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/participa" className="mt-6 block rounded-full bg-white py-3 text-center font-semibold text-ink">
            Participa en Congreso Joven
          </Link>
        </nav>
      )}
    </header>
  );
}
