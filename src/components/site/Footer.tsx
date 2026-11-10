import Link from "next/link";
import { Logo } from "./Header";

const COLS = [
  {
    title: "Institución",
    links: [
      ["/conocenos", "Conócenos"],
      ["/estructura", "Estructura nacional"],
      ["/territorio", "Organización territorial"],
      ["/elecciones", "Elecciones y democracia interna"],
      ["/conocenos#transparencia", "Transparencia"],
    ],
  },
  {
    title: "Trabajo",
    links: [
      ["/proyectos", "Proyectos"],
      ["/congreso", "Relación con el Congreso"],
      ["/internacional", "Relaciones internacionales"],
      ["/eventos", "Eventos y convocatorias"],
      ["/archivo", "Archivo histórico"],
    ],
  },
  {
    title: "Participa",
    links: [
      ["/participa/integrante", "Ser integrante"],
      ["/participa/voluntario", "Voluntariado"],
      ["/participa/autor", "Escribir en Actualidad"],
      ["/participa/cooperacion", "Cooperación institucional"],
      ["/contacto", "Contacto"],
    ],
  },
];

export function Footer({ editorialName, email, social = [] }: { editorialName: string; email?: string; social?: { label: string; url: string }[] }) {
  return (
    <footer className="bg-ink text-blue-100/70">
      <div className="mx-auto max-w-6xl px-5 py-16 md:px-8">
        <div className="grid gap-12 md:grid-cols-[1.3fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-5 max-w-xs text-sm leading-relaxed">
              Comunidad activa de 2,000 jóvenes en toda la República. Plataforma juvenil apartidista para la participación democrática, la formación política y el liderazgo.
            </p>
            <p className="mt-4 text-xs">
              Medio institucional: <Link href="/actualidad" className="text-blue-300 hover:text-white">{editorialName}</Link>
            </p>
            {email && (
              <p className="mt-2 text-xs">
                <a href={`mailto:${email}`} className="text-blue-300 hover:text-white">{email}</a>
              </p>
            )}
            {social.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                {social.map((l) => (
                  <li key={l.url}>
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-white">{l.label} ↗</a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {COLS.map((c) => (
            <div key={c.title}>
              <p className="eyebrow text-blue-300">{c.title}</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {c.links.map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="hover:text-white">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs md:flex-row md:justify-between">
          <p>© {new Date().getFullYear()} Congreso Joven Guatemala. Organización apartidista.</p>
          <p className="flex gap-5">
            <Link href="/privacidad" className="hover:text-white">Privacidad</Link>
            <Link href="/terminos" className="hover:text-white">Términos de uso</Link>
            <Link href="/admin" className="hover:text-white">Acceso institucional</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
