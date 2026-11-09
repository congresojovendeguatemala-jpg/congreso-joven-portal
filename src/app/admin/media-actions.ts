"use server";
import { redirect } from "next/navigation";
import { db, schema as s } from "@/db";
import { requireCapability } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { saveUpload } from "@/lib/storage";
import { youtubeId } from "@/lib/editorial";
import { DOC_TYPES, MEDIA_CATEGORIES } from "@/lib/media";

const lines = (v: FormDataEntryValue | null) => {
  const arr = String(v ?? "").split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  return arr.length ? arr : null;
};

/** Metadatos compartidos por todos los archivos de una misma subida. */
function shared(form: FormData) {
  const date = String(form.get("date") ?? "");
  const year = Number(form.get("year")) || (date ? Number(date.slice(0, 4)) : null);
  const category = String(form.get("category") ?? "");
  return {
    credit: String(form.get("credit") ?? "").trim() || null,
    date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null,
    year: year && year > 1990 && year < 2100 ? year : null,
    category: category in MEDIA_CATEGORIES ? category : null,
    eventName: String(form.get("eventName") ?? "").trim() || null,
    galleryId: Number(form.get("galleryId")) || null,
    departmentId: Number(form.get("departmentId")) || null,
    people: lines(form.get("people")),
    tags: lines(form.get("tags")),
    public: form.get("public") === "on",
  };
}

export async function uploadMedia(form: FormData) {
  const user = await requireCapability("media.upload");
  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) redirect("/admin/multimedia?error=Selecciona%20al%20menos%20un%20archivo.");
  if (files.length > 30) redirect("/admin/multimedia?error=M%C3%A1ximo%2030%20archivos%20por%20subida.");
  const meta = shared(form);
  const docType = String(form.get("docType") ?? "");
  const baseTitle = String(form.get("title") ?? "").trim();

  let ok = 0;
  const errors: string[] = [];
  for (const [i, file] of files.entries()) {
    try {
      const saved = await saveUpload(file, "multimedia");
      const isDoc = saved.mime === "application/pdf";
      const fallback = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
      await db.insert(s.media).values({
        ...meta,
        kind: isDoc ? "document" : "image",
        url: saved.url,
        mime: saved.mime,
        bytes: saved.bytes,
        title: baseTitle ? (files.length > 1 ? `${baseTitle} (${i + 1})` : baseTitle) : fallback,
        docType: isDoc ? (docType in DOC_TYPES ? docType : "otro") : null,
        sortOrder: i,
        uploadedBy: user.id,
      });
      ok++;
    } catch (e) {
      errors.push(`${file.name}: ${(e as Error).message}`);
    }
  }
  await audit(user.id, "upload", "media", undefined, { archivos: ok, errores: errors.length });
  const q = new URLSearchParams({ ok: `${ok} archivo(s) subido(s).` });
  if (errors.length) q.set("error", errors.slice(0, 3).join(" · "));
  redirect(`/admin/multimedia?${q}`);
}

export async function addVideo(form: FormData) {
  const user = await requireCapability("media.upload");
  const url = String(form.get("url") ?? "").trim();
  const id = youtubeId(url);
  if (!id) redirect("/admin/multimedia?error=Pega%20un%20enlace%20v%C3%A1lido%20de%20YouTube.");
  const title = String(form.get("title") ?? "").trim();
  if (!title) redirect("/admin/multimedia?error=El%20video%20necesita%20un%20t%C3%ADtulo.");
  const videoType = String(form.get("videoType") ?? "");
  await db.insert(s.media).values({
    ...shared(form),
    kind: "video",
    url: `https://www.youtube.com/watch?v=${id}`,
    title,
    caption: String(form.get("caption") ?? "").trim() || null,
    metadata: videoType ? { videoType } : null,
    uploadedBy: user.id,
  });
  await audit(user.id, "create", "media", undefined, { video: id });
  redirect("/admin/multimedia?ok=Video%20agregado.");
}
