import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { saveUpload } from "@/lib/storage";

/** Subida de imágenes desde el editor de artículos. Requiere sesión y capacidad de subir multimedia o enviar artículos. */
export async function POST(req: Request) {
  // Protección CSRF: solo solicitudes del mismo origen
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) return Response.json({ error: "Origen no permitido." }, { status: 403 });

  const user = await getSessionUser();
  if (!user || !(can(user.role, "media.upload") || can(user.role, "articles.submit"))) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No se recibió ningún archivo." }, { status: 400 });
  try {
    const saved = await saveUpload(file, "articulos");
    if (!saved.mime.startsWith("image/")) return Response.json({ error: "Solo se permiten imágenes en el contenido." }, { status: 400 });
    await audit(user.id, "upload", "media", saved.url, { bytes: saved.bytes });
    return Response.json({ url: saved.url });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
}
