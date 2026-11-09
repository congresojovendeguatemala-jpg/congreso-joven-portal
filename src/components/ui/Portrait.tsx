import { Placeholder } from "./index";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => w.length > 2 || /^[A-ZÁÉÍÓÚÑ]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

/**
 * Retrato oficial con alternativa elegante si aún no hay fotografía.
 * `small`: avatar circular; sin foto muestra las iniciales.
 */
export function Portrait({ src, alt, className = "", credit, small = false }: { src?: string | null; alt: string; className?: string; credit?: string | null; small?: boolean }) {
  if (!src) {
    if (small)
      return (
        <span className={`flex items-center justify-center bg-navy-800 font-serif text-sm text-white ${className}`} aria-hidden>
          {initials(alt)}
        </span>
      );
    return <Placeholder icon="person" label="Fotografía oficial" hint="Pendiente" className={className} />;
  }
  return (
    <figure className={`relative overflow-hidden bg-stone-200 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover object-top" />
      {credit && <figcaption className="absolute bottom-0 right-0 bg-ink/60 px-1.5 py-0.5 text-[0.6rem] text-white/80">{credit}</figcaption>}
    </figure>
  );
}
