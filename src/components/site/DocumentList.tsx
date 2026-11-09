import { DOC_TYPES, fmtBytes } from "@/lib/media";
import { fmtDate } from "@/lib/format";

export type DocItem = { id: number; url: string; title: string | null; caption: string | null; docType: string | null; date: string | null; year: number | null; bytes: number | null };

export function DocumentList({ docs, dark = false }: { docs: DocItem[]; dark?: boolean }) {
  return (
    <ul className={`divide-y border-y ${dark ? "divide-white/10 border-white/10" : "divide-stone-200 border-stone-200"}`}>
      {docs.map((d) => (
        <li key={d.id} className="grid gap-3 py-4 sm:grid-cols-[48px_1fr_auto] sm:items-center">
          <span className={`flex h-12 w-10 items-center justify-center border text-[0.6rem] font-semibold ${dark ? "border-white/20 text-blue-300" : "border-stone-300 text-graphite"}`} aria-hidden>PDF</span>
          <div>
            <p className={`font-serif text-lg ${dark ? "text-white" : ""}`}>{d.title ?? "Documento"}</p>
            <p className={`text-xs ${dark ? "text-blue-100/50" : "text-stone-400"}`}>
              {[DOC_TYPES[d.docType ?? "otro"], d.date ? fmtDate(d.date) : d.year, fmtBytes(d.bytes)].filter(Boolean).join(" · ")}
            </p>
            {d.caption && <p className={`mt-1 text-sm ${dark ? "text-blue-100/70" : "text-graphite"}`}>{d.caption}</p>}
          </div>
          <a href={d.url} target="_blank" rel="noopener" className={`text-sm font-medium ${dark ? "text-blue-300 hover:text-white" : "text-blue-600"}`}>
            Ver / descargar ↗
          </a>
        </li>
      ))}
    </ul>
  );
}
