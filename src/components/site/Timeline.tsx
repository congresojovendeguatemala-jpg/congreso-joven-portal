import { VerificationBadge } from "@/components/ui";
import { fmtDate } from "@/lib/format";

export type TimelineItem = {
  id: number;
  date: string | null;
  dateLabel: string | null;
  title: string;
  summary: string | null;
  category: string;
  organizer: string | null;
  people: string[] | null;
  sourceUrl: string | null;
  sourceLabel: string | null;
  verification: string;
};

export const ORGANIZER_LABEL: Record<string, string> = {
  congreso_joven: "Organizado por Congreso Joven",
  congreso_republica: "Organizado por el Congreso de la República",
  coorganizado: "Coorganizado",
  otro: "Convocado por un despacho legislativo",
};

export const CATEGORY_LABEL: Record<string, string> = {
  fundacion: "Fundación",
  generacion: "Generaciones",
  autoridades: "Autoridades",
  territorio: "Territorio",
  elecciones: "Elecciones",
  parlamento: "Parlamentos juveniles",
  legislativo: "Encuentros legislativos",
  social: "Proyectos sociales",
  internacional: "Cooperación internacional",
};

export function Timeline({ items, dark = false }: { items: TimelineItem[]; dark?: boolean }) {
  return (
    <ol className={`relative border-l ${dark ? "border-blue-300/20" : "border-stone-200"} ml-2`}>
      {items.map((t) => (
        <li key={t.id} className="relative pb-12 pl-8 last:pb-0">
          <span className={`absolute -left-[5px] top-1.5 h-[9px] w-[9px] rounded-full ring-4 ${dark ? "bg-glow ring-ink" : "bg-blue-600 ring-paper"}`} aria-hidden />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <time dateTime={t.date ?? undefined} className={`eyebrow ${dark ? "text-blue-300" : "text-blue-600"}`}>
              {t.dateLabel ?? fmtDate(t.date)}
            </time>
            <span className={`text-xs ${dark ? "text-blue-100/50" : "text-stone-400"}`}>{CATEGORY_LABEL[t.category] ?? t.category}</span>
            <VerificationBadge level={t.verification} />
          </div>
          <h3 className={`mt-2 font-serif text-xl leading-snug md:text-2xl ${dark ? "text-white" : "text-ink"}`}>{t.title}</h3>
          {t.summary && <p className={`mt-2 max-w-2xl leading-relaxed ${dark ? "text-blue-100/70" : "text-graphite"}`}>{t.summary}</p>}
          {t.people && t.people.length > 0 && (
            <p className={`mt-3 text-sm ${dark ? "text-blue-100/60" : "text-graphite/80"}`}>
              <span className="font-medium">Participantes identificados:</span> {t.people.join(" · ")}
            </p>
          )}
          <div className={`mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs ${dark ? "text-blue-100/50" : "text-stone-400"}`}>
            {t.organizer && <span>{ORGANIZER_LABEL[t.organizer]}</span>}
            {t.sourceUrl ? (
              <a href={t.sourceUrl} target="_blank" rel="noopener noreferrer" className={`underline underline-offset-2 ${dark ? "hover:text-white" : "hover:text-blue-600"}`}>
                Fuente: {t.sourceLabel ?? "enlace"} ↗
              </a>
            ) : (
              t.sourceLabel && <span>Fuente: {t.sourceLabel}</span>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
