import type { FieldDef } from "@/lib/admin/resources";

export const inputCls = "w-full border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15";

function toLocalDT(v: unknown) {
  if (!v) return "";
  const d = new Date(v as string);
  // Hora de Guatemala (UTC−6)
  return new Date(d.getTime() - 6 * 3600_000).toISOString().slice(0, 16);
}

export function FieldInput({ f, value, refOptions }: { f: FieldDef; value: unknown; refOptions?: { id: number | string; label: string }[] }) {
  const id = `fld-${f.name}`;
  const label = (
    <label htmlFor={id} className="mb-1 block text-xs font-medium uppercase tracking-wider text-graphite">
      {f.label} {f.required && <span className="text-blue-600">*</span>}
    </label>
  );
  const hint = f.hint && <p className="mt-1 text-xs text-stone-400">{f.hint}</p>;
  const wide = f.wide || ["textarea", "lines", "rows"].includes(f.type);

  let control: React.ReactNode;
  switch (f.type) {
    case "bool":
      return (
        <label className="flex items-center gap-2.5 text-sm md:col-span-2">
          <input type="checkbox" name={f.name} defaultChecked={Boolean(value)} className="h-4 w-4 accent-blue-600" /> {f.label}
        </label>
      );
    case "textarea":
      control = <textarea id={id} name={f.name} rows={f.wide ? 10 : 4} defaultValue={(value as string) ?? ""} className={inputCls} />;
      break;
    case "lines":
      control = <textarea id={id} name={f.name} rows={4} defaultValue={Array.isArray(value) ? value.join("\n") : ""} className={inputCls} />;
      break;
    case "rows":
      control = (
        <textarea
          id={id}
          name={f.name}
          rows={4}
          defaultValue={Array.isArray(value) ? (value as Record<string, string>[]).map((r) => f.columns!.map((c) => r[c] ?? "").join(" | ")).join("\n") : ""}
          className={`${inputCls} font-mono text-xs`}
        />
      );
      break;
    case "number":
      control = <input id={id} name={f.name} type="number" defaultValue={(value as number) ?? ""} className={inputCls} />;
      break;
    case "date":
      control = <input id={id} name={f.name} type="date" defaultValue={(value as string) ?? ""} className={inputCls} />;
      break;
    case "datetime":
      control = <input id={id} name={f.name} type="datetime-local" defaultValue={toLocalDT(value)} className={inputCls} />;
      break;
    case "select":
      control = (
        <select id={id} name={f.name} defaultValue={(value as string) ?? ""} className={inputCls}>
          {!f.required && <option value="">—</option>}
          {f.options!.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      );
      break;
    case "ref":
      control = (
        <select id={id} name={f.name} defaultValue={value == null ? "" : String(value)} className={inputCls}>
          <option value="">— Ninguno —</option>
          {(refOptions ?? []).map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
      );
      break;
    case "image":
      control = (
        <div className="flex items-start gap-4">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value as string} alt="" className="h-24 w-20 border border-stone-200 object-cover object-top" />
          ) : (
            <div className="placeholder-hatch flex h-24 w-20 items-center justify-center border border-dashed border-stone-400/60 text-[0.6rem] text-graphite">Sin imagen</div>
          )}
          <div className="space-y-2 text-sm">
            <input id={id} name={`${f.name}__file`} type="file" accept="image/jpeg,image/png,image/webp" className="block text-xs" />
            {Boolean(value) && (
              <label className="flex items-center gap-2 text-xs text-rose-700">
                <input type="checkbox" name={`${f.name}__remove`} /> Quitar imagen
              </label>
            )}
            <p className="text-xs text-stone-400">JPG, PNG o WEBP · máx. 8 MB</p>
          </div>
        </div>
      );
      break;
    default:
      control = <input id={id} name={f.name} type="text" defaultValue={(value as string) ?? ""} className={inputCls} />;
  }
  return (
    <div className={wide ? "md:col-span-2" : ""}>
      {label}
      {control}
      {hint}
    </div>
  );
}
