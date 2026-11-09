import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import path from "node:path";

/**
 * Almacenamiento de archivos. El controlador se elige solo:
 * - Producción en Vercel (existe BLOB_READ_WRITE_TOKEN): Vercel Blob. La URL guardada es la del CDN de Blob
 *   (https://…blob.vercel-storage.com/…), con sufijo aleatorio para que no sea adivinable.
 * - Desarrollo: disco local en UPLOAD_DIR (./uploads), servido por /archivos/[...ruta].
 * Vercel no conserva archivos escritos en su disco entre publicaciones, por eso en producción se usa Blob.
 */
const useBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const isBlobUrl = (u: string) => /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(u);
export const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};
const MAX_BYTES = 8 * 1024 * 1024;

export const uploadRoot = () => path.resolve(process.env.UPLOAD_DIR ?? "./uploads");

/** Comprueba la firma real del archivo, no solo la extensión declarada. */
function sniff(buf: Buffer): string | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return "image/webp";
  if (buf.subarray(0, 5).toString() === "%PDF-") return "application/pdf";
  return null;
}

export type Saved = { url: string; mime: string; bytes: number };

export async function saveUpload(file: File, folder = "general"): Promise<Saved> {
  if (!file || file.size === 0) throw new Error("No se recibió ningún archivo.");
  if (file.size > MAX_BYTES) throw new Error("El archivo supera 8 MB.");
  const buf = Buffer.from(await file.arrayBuffer());
  const mime = sniff(buf);
  if (!mime || !ALLOWED[mime]) throw new Error("Formato no permitido. Usa JPG, PNG, WEBP o PDF.");

  const safeFolder = folder.replace(/[^a-z0-9-]/gi, "").toLowerCase() || "general";
  const now = new Date();
  const rel = path.posix.join(safeFolder, `${now.getFullYear()}`, `${randomUUID()}.${ALLOWED[mime]}`);

  if (useBlob()) {
    const { put } = await import("@vercel/blob");
    const blob = await put(rel, buf, { access: "public", contentType: mime, addRandomSuffix: true });
    return { url: blob.url, mime, bytes: buf.length };
  }
  const abs = path.join(uploadRoot(), rel);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, buf);
  return { url: `/archivos/${rel}`, mime, bytes: buf.length };
}

/** Borra el archivo de una URL subida por el sitio (Blob o /archivos/…). Ignora URLs externas o ya borradas. */
export async function removeUpload(url: string | null | undefined) {
  if (!url) return;
  if (isBlobUrl(url)) {
    if (!useBlob()) return;
    const { del } = await import("@vercel/blob");
    await del(url).catch(() => undefined);
    return;
  }
  if (!url.startsWith("/archivos/")) return;
  const root = uploadRoot();
  const abs = path.resolve(root, url.slice("/archivos/".length));
  if (!abs.startsWith(root + path.sep)) return;
  await unlink(abs).catch(() => undefined);
}

export async function readUpload(rel: string): Promise<{ data: Buffer; mime: string } | null> {
  const root = uploadRoot();
  const abs = path.resolve(root, rel);
  if (!abs.startsWith(root + path.sep)) return null; // evita salir de la carpeta (path traversal)
  const ext = path.extname(abs).slice(1).toLowerCase();
  const mime = Object.entries(ALLOWED).find(([, e]) => e === ext)?.[0];
  if (!mime) return null;
  try {
    return { data: await readFile(abs), mime };
  } catch {
    return null;
  }
}
