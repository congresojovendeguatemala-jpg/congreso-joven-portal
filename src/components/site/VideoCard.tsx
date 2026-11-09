"use client";
import { useState } from "react";

/** Miniatura que carga el reproductor solo al hacer clic (sin cookies de YouTube hasta entonces). */
export function VideoCard({ id, title, caption, meta }: { id: string; title: string; caption?: string | null; meta?: string }) {
  const [play, setPlay] = useState(false);
  return (
    <article>
      <div className="relative aspect-video overflow-hidden bg-ink">
        {play ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
            title={title}
            className="h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button type="button" onClick={() => setPlay(true)} className="group h-full w-full" aria-label={`Reproducir: ${title}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" className="h-full w-full object-cover opacity-80 transition group-hover:opacity-100" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-xl text-ink shadow-lg transition group-hover:scale-110">▶</span>
            </span>
          </button>
        )}
      </div>
      {meta && <p className="eyebrow mt-3 text-[0.6rem] text-blue-600">{meta}</p>}
      <h3 className="mt-1 font-serif text-lg leading-snug">{title}</h3>
      {caption && <p className="mt-1 text-sm text-graphite">{caption}</p>}
    </article>
  );
}
