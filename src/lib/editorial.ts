import { can, type Role } from "./permissions";

export type ArticleStatus =
  | "borrador"
  | "enviado"
  | "en_revision"
  | "requiere_correcciones"
  | "aprobado"
  | "programado"
  | "publicado"
  | "archivado";

export const STATUS_LABEL: Record<ArticleStatus, string> = {
  borrador: "Borrador",
  enviado: "Enviado a revisión",
  en_revision: "En revisión",
  requiere_correcciones: "Requiere correcciones",
  aprobado: "Aprobado",
  programado: "Programado",
  publicado: "Publicado",
  archivado: "Archivado",
};

export const STATUS_TONE: Record<ArticleStatus, string> = {
  borrador: "bg-stone-200 text-graphite",
  enviado: "bg-blue-100 text-navy-800",
  en_revision: "bg-blue-100 text-navy-800",
  requiere_correcciones: "bg-amber-50 text-amber-800",
  aprobado: "bg-emerald-50 text-emerald-800",
  programado: "bg-violet-50 text-violet-800",
  publicado: "bg-emerald-600 text-white",
  archivado: "bg-stone-200 text-stone-400",
};

export type Transition = {
  key: string;
  label: string;
  from: ArticleStatus[];
  to: ArticleStatus;
  /** Quién puede ejecutarla: el autor del artículo, o una capacidad. */
  owner?: boolean;
  cap?: "articles.review" | "articles.publish";
  needsComment?: boolean;
  tone?: "primary" | "danger" | "neutral";
};

/**
 * Flujo editorial. Los autores envían; los editores revisan y piden correcciones;
 * el editor jefe (o comunicación) aprueba, programa, publica y archiva.
 */
export const TRANSITIONS: Transition[] = [
  { key: "enviar", label: "Enviar a revisión", from: ["borrador", "requiere_correcciones"], to: "enviado", owner: true, cap: "articles.review", tone: "primary" },
  { key: "revisar", label: "Tomar en revisión", from: ["enviado"], to: "en_revision", cap: "articles.review" },
  { key: "corregir", label: "Solicitar correcciones", from: ["enviado", "en_revision", "aprobado"], to: "requiere_correcciones", cap: "articles.review", needsComment: true },
  { key: "aprobar", label: "Aprobar", from: ["enviado", "en_revision"], to: "aprobado", cap: "articles.publish", tone: "primary" },
  { key: "programar", label: "Programar publicación", from: ["aprobado"], to: "programado", cap: "articles.publish" },
  { key: "publicar", label: "Publicar ahora", from: ["aprobado", "programado"], to: "publicado", cap: "articles.publish", tone: "primary" },
  { key: "archivar", label: "Archivar", from: ["publicado", "aprobado", "programado"], to: "archivado", cap: "articles.publish", tone: "danger" },
  { key: "restaurar", label: "Devolver a borrador", from: ["archivado"], to: "borrador", cap: "articles.publish" },
];

export function allowedTransitions(role: Role, status: ArticleStatus, isOwner: boolean) {
  return TRANSITIONS.filter((t) => t.from.includes(status) && ((t.owner && isOwner) || (t.cap && can(role, t.cap))));
}

/** ¿Puede esta persona editar el contenido del artículo en su estado actual? */
export function canEditContent(role: Role, status: ArticleStatus, isOwner: boolean) {
  if (can(role, "articles.publish")) return status !== "archivado";
  if (can(role, "articles.review")) return ["borrador", "enviado", "en_revision", "requiere_correcciones"].includes(status);
  return isOwner && ["borrador", "requiere_correcciones"].includes(status);
}

/* ───────── Contenido TipTap ───────── */

export type Doc = { type?: string; text?: string; content?: Doc[]; attrs?: Record<string, unknown>; marks?: { type: string; attrs?: Record<string, unknown> }[] };

export function docText(node: Doc | null | undefined): string {
  if (!node) return "";
  if (node.type === "text") return node.text ?? "";
  const inner = (node.content ?? []).map(docText).join(node.type === "doc" ? "\n\n" : "");
  return ["paragraph", "heading", "blockquote", "listItem"].includes(node.type ?? "") ? inner + "\n" : inner;
}

export function readingMinutes(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

/** Enlaces y fuentes de imagen permitidos en el contenido publicado. */
export const safeHref = (h: unknown) => (typeof h === "string" && /^(https?:\/\/|mailto:|\/)/i.test(h) ? h : null);
export const safeImg = (s: unknown) => (typeof s === "string" && (/^\/(archivos|images)\//.test(s) || /^https:\/\//.test(s)) ? s : null);
export function youtubeId(src: unknown): string | null {
  if (typeof src !== "string") return null;
  const m = src.match(/(?:youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}
