import type { ReactNode } from "react";
import { safeHref, safeImg, youtubeId, type Doc } from "@/lib/editorial";

/**
 * Renderizador propio del JSON de TipTap: solo admite nodos conocidos, nunca inserta HTML
 * y filtra enlaces e imágenes. Así un artículo no puede inyectar código en el sitio.
 */
export function ArticleBody({ doc }: { doc: Doc | null }) {
  if (!doc?.content?.length) return null;
  return <div className="prose-cj">{doc.content.map((n, i) => render(n, i))}</div>;
}

function marks(text: ReactNode, ms: Doc["marks"] = []): ReactNode {
  return ms.reduce<ReactNode>((acc, m, i) => {
    switch (m.type) {
      case "bold":
        return <strong key={i}>{acc}</strong>;
      case "italic":
        return <em key={i}>{acc}</em>;
      case "underline":
        return <u key={i}>{acc}</u>;
      case "strike":
        return <s key={i}>{acc}</s>;
      case "code":
        return <code key={i} className="rounded bg-stone-100 px-1 text-[0.9em]">{acc}</code>;
      case "link": {
        const href = safeHref(m.attrs?.href);
        if (!href) return acc;
        const ext = /^https?:/i.test(href);
        return (
          <a key={i} href={href} {...(ext ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}>
            {acc}
          </a>
        );
      }
      default:
        return acc;
    }
  }, text);
}

const kids = (n: Doc) => (n.content ?? []).map((c, i) => render(c, i));

function render(n: Doc, key: number): ReactNode {
  switch (n.type) {
    case "text":
      return <span key={key}>{marks(n.text ?? "", n.marks)}</span>;
    case "paragraph":
      return <p key={key}>{kids(n)}</p>;
    case "heading":
      return n.attrs?.level === 3 ? <h3 key={key}>{kids(n)}</h3> : <h2 key={key}>{kids(n)}</h2>;
    case "blockquote":
      return <blockquote key={key}>{kids(n)}</blockquote>;
    case "bulletList":
      return <ul key={key}>{kids(n)}</ul>;
    case "orderedList":
      return <ol key={key} className="mb-[1.1em] list-decimal pl-6">{kids(n)}</ol>;
    case "listItem":
      return <li key={key}>{kids(n)}</li>;
    case "hardBreak":
      return <br key={key} />;
    case "horizontalRule":
      return <hr key={key} className="my-10 border-stone-200" />;
    case "image": {
      const src = safeImg(n.attrs?.src);
      if (!src) return null;
      const alt = typeof n.attrs?.alt === "string" ? n.attrs.alt : "";
      return (
        <figure key={key} className="my-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} loading="lazy" className="w-full" />
          {alt && <figcaption className="mt-2 text-sm text-stone-400">{alt}</figcaption>}
        </figure>
      );
    }
    case "youtube": {
      const id = youtubeId(n.attrs?.src);
      if (!id) return null;
      return (
        <div key={key} className="my-8 aspect-video">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}`}
            title="Video"
            className="h-full w-full"
            loading="lazy"
            allow="accelerometer; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
    default:
      return null;
  }
}
