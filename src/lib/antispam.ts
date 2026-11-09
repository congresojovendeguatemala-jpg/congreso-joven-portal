import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";

/**
 * Protección contra spam sin servicios externos:
 * 1) campo trampa (honeypot) invisible para personas,
 * 2) tiempo mínimo de llenado,
 * 3) límite de envíos por IP (en memoria; en producción multi-instancia usar Redis/Upstash),
 * 4) Cloudflare Turnstile opcional si existe TURNSTILE_SECRET.
 */
const hits = new Map<string, number[]>();
const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 5;

export async function ipHash() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "local";
  return createHash("sha256").update(ip + (process.env.IP_SALT ?? "cj")).digest("hex").slice(0, 32);
}

export async function checkSpam(form: FormData): Promise<string | null> {
  if (String(form.get("website") ?? "") !== "") return "No se pudo enviar el formulario.";
  const started = Number(form.get("_t") ?? 0);
  if (!started || Date.now() - started < 3000) return "Envío demasiado rápido. Revisa el formulario e intenta de nuevo.";

  const key = await ipHash();
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) return "Has enviado varias solicitudes seguidas. Intenta de nuevo en unos minutos.";
  recent.push(now);
  hits.set(key, recent);

  const secret = process.env.TURNSTILE_SECRET;
  if (secret) {
    const token = String(form.get("cf-turnstile-response") ?? "");
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret, response: token }),
    }).then((x) => x.json() as Promise<{ success: boolean }>);
    if (!r.success) return "No se pudo verificar que eres una persona.";
  }
  return null;
}
