"use client";
import Link from "next/link";
import { useState } from "react";

export type MapDept = { slug: string; name: string; x: number; y: number; regionSlug: string | null; regionName: string | null; description: string | null };

const REGION_TINT: Record<string, string> = {
  metropolitana: "#3b6ae0",
  centro: "#5b84ea",
  norte: "#2a56c9",
  oriente: "#7d9cf0",
  occidente: "#1f4ab0",
  "costa-sur": "#9db8ff",
};

const S = 92; // tamaño del mosaico
const G = 8; // separación

/** Etiqueta en una o dos líneas, con el tamaño máximo que cabe en el mosaico. */
function TileLabel({ name }: { name: string }) {
  const words = name.split(" ");
  let lines = words.length > 1 ? [words.slice(0, -1).join(" "), words.at(-1)!] : [name];
  if (lines.length === 1 && name.length > 9) {
    // Corte silábico en sufijos frecuentes de topónimos (-tenango, -tepéquez) o a la mitad.
    const m = name.match(/^(.+?)(tenango|tepéquez|capán|mula)$/);
    const cut = m ? m[1].length : Math.ceil(name.length / 2);
    lines = [name.slice(0, cut) + "-", name.slice(cut)];
  }
  const longest = Math.max(...lines.map((l) => l.length));
  const size = Math.min(17, Math.floor((S - 10) / (longest * 0.58)));
  return (
    <text x={S / 2} y={S / 2} textAnchor="middle" fill="white" fontSize={size} fontWeight={500} style={{ fontFamily: "var(--font-sans)", pointerEvents: "none" }}>
      {lines.map((l, i) => (
        <tspan key={i} x={S / 2} dy={i === 0 ? (lines.length === 1 ? size * 0.35 : -size * 0.2) : size * 1.15}>
          {l}
        </tspan>
      ))}
    </text>
  );
}

/** Cartograma de mosaicos: cada departamento ocupa el mismo espacio, legible en móvil y accesible por teclado. */
export function TileMap({ departments }: { departments: MapDept[] }) {
  const [sel, setSel] = useState<MapDept | null>(null);
  const w = 7 * (S + G);
  const h = 6 * (S + G);
  return (
    <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="group" aria-label="Mapa de departamentos de Guatemala">
        {departments.map((d) => {
          const active = sel?.slug === d.slug;
          const fill = d.regionSlug ? REGION_TINT[d.regionSlug] ?? "#3b6ae0" : "#183473";
          return (
            <g
              key={d.slug}
              transform={`translate(${d.x * (S + G)} ${d.y * (S + G)})`}
              tabIndex={0}
              role="button"
              aria-pressed={active}
              aria-label={`${d.name}${d.regionName ? `, ${d.regionName}` : ""}`}
              onClick={() => setSel(d)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setSel(d))}
              className="cursor-pointer outline-none [&:focus-visible>rect]:stroke-[var(--color-glow-strong)]"
            >
              <rect width={S} height={S} rx="6" fill={fill} opacity={active ? 1 : 0.78} stroke={active ? "var(--color-glow-strong)" : "rgba(157,184,255,0.25)"} strokeWidth={active ? 3 : 1} className="transition-all duration-200 hover:opacity-100" />
              {active && <rect width={S} height={S} rx="6" fill="var(--color-glow)" opacity="0.18" />}
              <TileLabel name={d.name} />
            </g>
          );
        })}
      </svg>

      <div className="border border-blue-300/20 bg-navy-950/60 p-7 text-white" aria-live="polite">
        <label className="mb-6 block lg:hidden">
          <span className="sr-only">Elegir departamento</span>
          <select
            value={sel?.slug ?? ""}
            onChange={(e) => setSel(departments.find((d) => d.slug === e.target.value) ?? null)}
            className="w-full border border-white/15 bg-ink px-3.5 py-3 text-white"
          >
            <option value="">Elige un departamento…</option>
            {[...departments].sort((a, b) => a.name.localeCompare(b.name, "es")).map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        {sel ? (
          <>
            <p className="eyebrow text-blue-300">{sel.regionName ?? "Región por asignar"}</p>
            <h3 className="mt-3 font-serif text-3xl">{sel.name}</h3>
            <p className="mt-4 text-sm leading-relaxed text-blue-100/70">
              {sel.description ?? "La información institucional de este departamento (coordinación, representantes y actividades) se publicará cuando esté confirmada."}
            </p>
            <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-5 text-sm">
              <div>
                <dt className="text-blue-100/50">Coordinación</dt>
                <dd className="mt-1">Por confirmar</dd>
              </div>
              <div>
                <dt className="text-blue-100/50">Representantes</dt>
                <dd className="mt-1">Por confirmar</dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              {sel.regionSlug && (
                <Link href={`/territorio/${sel.regionSlug}`} className="text-blue-300 hover:text-white">
                  Ver región →
                </Link>
              )}
              <Link href={`/participa/delegado`} className="text-blue-300 hover:text-white">
                Postularme como delegado →
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="eyebrow text-blue-300">22 departamentos</p>
            <p className="mt-3 font-serif text-2xl">Selecciona un departamento</p>
            <p className="mt-3 text-sm text-blue-100/60">Usa el ratón, el dedo o el teclado (Tab y Enter) para ver su información institucional.</p>
          </>
        )}
      </div>
    </div>
  );
}
