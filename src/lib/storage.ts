import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import path from "node:path";

/**
 * Almacenamiento de archivos.
 * - STORAGE_DRIVER=local (por defecto): disco en UPLOAD_DIR (./uploads), servido por /archivos/[...ruta].
 * - STORAGE_DRIVER=s3: cualquier servicio compatible con S3 (R2, S3, Supabase Storage). Requiere instalar
 *   @aws-sdk/client-s3 y definir S3_*; ver docs/DESPLIEGUE.md.
 */
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

  if ((process.env.STORAGE_DRIVER ?? "local") !== "local") {
    throw new Error("El almacenamiento S3 aún no está configurado (ver docs/DESPLIEGUE.md).");
  }
  const safeFolder = folder.replace(/[^a-z0-9-]/gi, "").toLowerCase() || "general";
  const now = new Date();
  const rel = path.posix.join(safeFolder, `${now.getFullYear()}`, `${randomUUID()}.${ALLOWED[mime]}`);
  const abs = path.join(uploadRoot(), rel);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, buf);
  return { url: `/archivos/${rel}`, mime, bytes: buf.length };
}

/** Borra el archivo físico de una URL /archivos/… (ignora URLs externas o ya borradas). */
export async function removeUpload(url: string | null | undefined) {
  if (!url?.startsWith("/archivos/")) return;
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
