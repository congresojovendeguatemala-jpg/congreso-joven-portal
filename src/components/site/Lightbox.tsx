"use client";
import { useCallback, useEffect, useState } from "react";

export type Photo = { id: number; url: string; title: string | null; caption: string | null; credit: string | null };

/** Cuadrícula de fotos con visor ampliado accesible (teclado: ← → Esc). */
export function Lightbox({ photos }: { photos: Photo[] }) {
  const [i, setI] = useState<number | null>(null);
  const close = useCallback(() => setI(null), []);
  const move = useCallback((d: number) => setI((v) => (v === null ? v : (v + d + photos.length) % photos.length)), [photos.length]);

  useEffect(() => {
    if (i === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") move(1);
      if (e.key === "ArrowLeft") move(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [i, close, move]);

  const p = i === null ? null : photos[i];
  return (
    <>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((ph, k) => (
          <li key={ph.id}>
            <button type="button" onClick={() => setI(k)} className="group block w-full overflow-hidden bg-stone-200" aria-label={`Ampliar: ${ph.title ?? "fotografía"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ph.url} alt={ph.title ?? ""} loading="lazy" className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
            </button>
          </li>
        ))}
      </ul>
      {p && (
        <div role="dialog" aria-modal="true" aria-label={p.title ?? "Fotografía"} className="fixed inset-0 z-[70] flex flex-col bg-ink text-white" onClick={close}>
          <div className="flex items-center justify-between px-5 py-3 text-sm">
            <span className="text-blue-100/60">{i! + 1} / {photos.length}</span>
            <button type="button" onClick={close} className="rounded px-3 py-1 hover:bg-white/10" aria-label="Cerrar">✕</button>
          </div>
          <div className="relative flex flex-1 items-center justify-center px-12" onClick={(e) => e.stopPropagation()}>
            {photos.length > 1 && <button type="button" onClick={() => move(-1)} className="absolute left-2 rounded-full p-3 text-2xl hover:bg-white/10" aria-label="Anterior">‹</button>}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={p.title ?? ""} className="max-h-[78vh] max-w-full object-contain" />
            {photos.length > 1 && <button type="button" onClick={() => move(1)} className="absolute right-2 rounded-full p-3 text-2xl hover:bg-white/10" aria-label="Siguiente">›</button>}
          </div>
          <div className="px-5 pb-6 pt-3 text-center" onClick={(e) => e.stopPropagation()}>
            {p.title && <p className="font-serif text-lg">{p.title}</p>}
            {p.caption && <p className="mx-auto mt-1 max-w-2xl text-sm text-blue-100/70">{p.caption}</p>}
            {p.credit && <p className="mt-1 text-xs text-blue-100/50">Fotografía: {p.credit}</p>}
          </div>
        </div>
      )}
    </>
  );
}
