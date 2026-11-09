import { readUpload } from "@/lib/storage";

export async function GET(_req: Request, { params }: { params: Promise<{ ruta: string[] }> }) {
  const { ruta } = await params;
  const file = await readUpload(ruta.join("/"));
  if (!file) return new Response("No encontrado", { status: 404 });
  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      ...(file.mime === "application/pdf" ? { "Content-Disposition": "inline" } : {}),
    },
  });
}
