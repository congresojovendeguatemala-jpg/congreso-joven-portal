import { requireCapability } from "@/lib/auth";
import { getSettings, type Stat } from "@/lib/settings";
import { inputCls } from "@/components/admin/FieldInput";
import { saveSettings } from "../../settings-actions";

export default async function Configuracion({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireCapability("settings.edit");
  const { ok, error } = await searchParams;
  const v = await getSettings<Record<string, unknown>>(["site.name", "site.tagline", "editorial.name", "contact.email", "social.links", "home.stats"]);
  const stats = (v["home.stats"] as Stat[] | undefined) ?? [];
  const links = (v["social.links"] as { label: string; url: string }[] | undefined) ?? [];
  const L = ({ children }: { children: React.ReactNode }) => <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-graphite">{children}</span>;
  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-3xl">Configuración del sitio</h1>
      {ok && <p className="mt-4 border-l-2 border-emerald-600 bg-emerald-50 px-4 py-2 text-sm">Configuración guardada.</p>}
      {error && <p className="mt-4 border-l-2 border-rose-600 bg-rose-50 px-4 py-2 text-sm">{error}</p>}
      <form action={saveSettings} className="mt-6 grid gap-5 border border-stone-200 bg-white p-6">
        <label><L>Nombre de la organización</L><input name="site.name" defaultValue={(v["site.name"] as string) ?? ""} className={inputCls} /></label>
        <label><L>Lema</L><input name="site.tagline" defaultValue={(v["site.tagline"] as string) ?? ""} className={inputCls} /></label>
        <label><L>Nombre del medio editorial</L><input name="editorial.name" defaultValue={(v["editorial.name"] as string) ?? ""} className={inputCls} /></label>
        <label><L>Correo institucional</L><input name="contact.email" type="email" defaultValue={(v["contact.email"] as string) ?? ""} className={inputCls} /></label>
        <label>
          <L>Redes sociales oficiales</L>
          <textarea name="social.links" rows={4} defaultValue={links.map((l) => `${l.label} | ${l.url}`).join("\n")} className={`${inputCls} font-mono text-xs`} />
          <span className="mt-1 block text-xs text-stone-400">Una por línea: Red | https://enlace (solo se aceptan enlaces https).</span>
        </label>
        <label>
          <L>Cifras de la portada</L>
          <textarea name="home.stats" rows={5} defaultValue={stats.map((s) => [s.value, s.label, s.note, s.verification].join(" | ")).join("\n")} className={`${inputCls} font-mono text-xs`} />
          <span className="mt-1 block text-xs text-stone-400">Una por línea: Valor | Etiqueta | Fuente y fecha | verified/internal/pending. Toda cifra debe indicar su fuente.</span>
        </label>
        <div><button className="rounded bg-navy-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-600">Guardar</button></div>
      </form>
    </div>
  );
}
