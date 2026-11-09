import Link from "next/link";
import type { ReactNode } from "react";

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

export function SectionHeader({
  n,
  label,
  title,
  intro,
  dark = false,
  action,
}: {
  n?: number;
  label: string;
  title?: ReactNode;
  intro?: ReactNode;
  dark?: boolean;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <p className={`eyebrow rule-under inline-block ${dark ? "text-blue-300" : "text-blue-600"}`}>
          {n ? <span className="mr-3 opacity-70">{ROMAN[n]}</span> : null}
          {label}
        </p>
        {title && <h2 className={`mt-5 font-serif text-3xl leading-tight md:text-4xl ${dark ? "text-white" : "text-ink"}`}>{title}</h2>}
        {intro && <p className={`mt-4 text-base leading-relaxed ${dark ? "text-blue-100/75" : "text-graphite"}`}>{intro}</p>}
      </div>
      {action && (
        <Link href={action.href} className={`group shrink-0 text-sm font-medium ${dark ? "text-blue-300" : "text-blue-600"}`}>
          {action.label} <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
        </Link>
      )}
    </div>
  );
}

/** Marca de material pendiente: visible, sobria y explícita. */
export function Placeholder({
  label,
  hint,
  className = "",
  dark = false,
  icon = "photo",
}: {
  label: string;
  hint?: string;
  className?: string;
  dark?: boolean;
  icon?: "photo" | "doc" | "person";
}) {
  return (
    <div
      className={`placeholder-hatch flex flex-col items-center justify-center gap-2 border border-dashed p-6 text-center ${
        dark ? "border-blue-300/30 text-blue-100/70" : "border-stone-400/60 text-graphite/80"
      } ${className}`}
      role="note"
      aria-label={`Contenido pendiente: ${label}`}
    >
      <PhIcon kind={icon} />
      <span className="eyebrow">{label}</span>
      {hint && <span className="max-w-[24ch] text-xs opacity-80">{hint}</span>}
    </div>
  );
}

function PhIcon({ kind }: { kind: "photo" | "doc" | "person" }) {
  const common = { width: 22, height: 22, fill: "none", stroke: "currentColor", strokeWidth: 1.3, "aria-hidden": true } as const;
  if (kind === "doc")
    return (
      <svg viewBox="0 0 24 24" {...common}>
        <path d="M6 3h8l4 4v14H6z" />
        <path d="M14 3v4h4M9 12h6M9 16h6" />
      </svg>
    );
  if (kind === "person")
    return (
      <svg viewBox="0 0 24 24" {...common}>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c1.2-3.6 4-5 7-5s5.8 1.4 7 5" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" {...common}>
      <rect x="3" y="6" width="18" height="13" rx="1.5" />
      <circle cx="12" cy="12.5" r="3.2" />
      <path d="M8.5 6l1.2-2h4.6l1.2 2" />
    </svg>
  );
}

const VERIF: Record<string, { label: string; cls: string; title: string }> = {
  verified: { label: "Fuente oficial", cls: "bg-emerald-50 text-emerald-800 ring-emerald-700/20", title: "Verificado en una fuente pública oficial" },
  internal: { label: "Registro institucional", cls: "bg-blue-100 text-navy-800 ring-blue-600/20", title: "Información proporcionada por Congreso Joven" },
  pending: { label: "Por confirmar", cls: "bg-amber-50 text-amber-800 ring-amber-700/20", title: "Dato pendiente de confirmación" },
};

export function VerificationBadge({ level }: { level: string }) {
  const v = VERIF[level] ?? VERIF.pending;
  return (
    <span title={v.title} className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.68rem] font-medium ring-1 ring-inset ${v.cls}`}>
      {v.label}
    </span>
  );
}

const ENG: Record<string, { label: string; cls: string }> = {
  proyectado: { label: "Participación proyectada", cls: "bg-blue-100 text-navy-800" },
  confirmado: { label: "Confirmado", cls: "bg-emerald-50 text-emerald-800" },
  pospuesto: { label: "Pospuesto", cls: "bg-amber-50 text-amber-800" },
  realizado: { label: "Realizado", cls: "bg-stone-200 text-graphite" },
  cancelado: { label: "Cancelado", cls: "bg-rose-50 text-rose-800" },
};

export function EngagementStatus({ status }: { status: string }) {
  const s = ENG[status] ?? ENG.proyectado;
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>;
}

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-5 md:px-8 ${className}`}>{children}</div>;
}

export function PageHero({ n, label, title, intro }: { n?: number; label: string; title: ReactNode; intro?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-ink pb-16 pt-32 text-white md:pb-20 md:pt-40">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_0%,rgba(59,106,224,0.28),transparent_60%)]" />
      <Container className="relative">
        <p className="eyebrow rule-under inline-block text-blue-300">
          {n ? <span className="mr-3 opacity-70">{ROMAN[n]}</span> : null}
          {label}
        </p>
        <h1 className="mt-6 max-w-3xl font-serif text-4xl leading-[1.1] md:text-6xl">{title}</h1>
        {intro && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-blue-100/75">{intro}</p>}
      </Container>
    </section>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="border border-stone-200 bg-white p-8 text-center">
      <p className="font-serif text-lg">{title}</p>
      {children && <div className="mt-2 text-sm text-graphite">{children}</div>}
    </div>
  );
}
