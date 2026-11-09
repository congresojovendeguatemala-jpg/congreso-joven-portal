/**
 * Hemiciclo de 160 curules (el número de diputados del Congreso de la República),
 * motivo visual de la identidad. Las curules "encendidas" representan participación.
 */
type Props = {
  lit?: number;
  className?: string;
  /** Semilla para elegir qué curules se encienden de forma determinista. */
  seed?: number;
  title?: string;
};

const ROWS = 7;
const TOTAL = 160;
const CX = 350;
const CY = 345;

function seats() {
  const radii = Array.from({ length: ROWS }, (_, i) => 118 + i * 33);
  const sum = radii.reduce((a, b) => a + b, 0);
  const counts = radii.map((r) => Math.round((TOTAL * r) / sum));
  counts[ROWS - 1] += TOTAL - counts.reduce((a, b) => a + b, 0);
  const out: { x: number; y: number; rot: number; row: number }[] = [];
  radii.forEach((r, row) => {
    const n = counts[row];
    const start = Math.PI * 1.04;
    const end = -Math.PI * 0.04;
    for (let k = 0; k < n; k++) {
      const a = start + ((end - start) * (k + 0.5)) / n;
      out.push({ x: CX + r * Math.cos(a), y: CY - r * Math.sin(a), rot: (-a * 180) / Math.PI + 90, row });
    }
  });
  return out;
}

const SEATS = seats();

function litSet(count: number, seed: number) {
  const set = new Set<number>();
  let s = seed || 1;
  while (set.size < Math.min(count, TOTAL)) {
    s = (s * 16807) % 2147483647;
    set.add(s % TOTAL);
  }
  return set;
}

export function Hemicycle({ lit = 0, className, seed = 7, title }: Props) {
  const on = litSet(lit, seed);
  return (
    <svg viewBox="0 0 700 360" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <defs>
        <radialGradient id="hc-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-glow-strong)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--color-glow-strong)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hc-seat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a5fb8" />
          <stop offset="100%" stopColor="#1a3270" />
        </linearGradient>
      </defs>
      {SEATS.map((p, i) =>
        on.has(i) ? (
          <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${p.rot})`}>
            <circle r="16" fill="url(#hc-glow)" />
            <rect x="-8" y="-6" width="16" height="12" rx="2.5" fill="var(--color-glow)" className="seat-lit" style={{ animationDelay: `${(i % 9) * 0.4}s` }} />
          </g>
        ) : (
          <rect
            key={i}
            x={p.x - 8}
            y={p.y - 6}
            width="16"
            height="12"
            rx="2.5"
            transform={`rotate(${p.rot} ${p.x} ${p.y})`}
            fill="url(#hc-seat)"
            opacity={0.55 + p.row * 0.06}
          />
        ),
      )}
      {/* Tribuna */}
      <rect x={CX - 62} y={CY - 58} width="124" height="34" rx="3" fill="#2a4a9a" opacity="0.9" />
      <rect x={CX - 26} y={CY - 70} width="52" height="14" rx="2" fill="#4a6fc8" opacity="0.9" />
    </svg>
  );
}
