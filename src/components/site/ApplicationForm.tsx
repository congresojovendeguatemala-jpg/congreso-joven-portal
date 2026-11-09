"use client";
import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { submitApplication, type FormState } from "@/lib/applications";
import type { Field } from "@/lib/modalities";

type Dept = { slug: string; name: string };

const input =
  "w-full border border-stone-200 bg-white px-3.5 py-2.5 text-[0.95rem] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 aria-[invalid=true]:border-rose-500";

export function ApplicationForm({ slug, fields, departments, submitLabel = "Enviar solicitud" }: { slug: string; fields: Field[]; departments: Dept[]; submitLabel?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitApplication.bind(null, slug), { ok: false });
  const [started] = useState(() => Date.now());

  if (state.ok) {
    return (
      <div className="border border-emerald-700/20 bg-emerald-50 p-8" role="status">
        <p className="eyebrow text-emerald-800">Solicitud recibida</p>
        <p className="mt-3 font-serif text-xl text-ink">{state.message}</p>
        <Link href="/participa" className="mt-6 inline-block text-sm font-medium text-blue-600">
          ← Ver otras modalidades
        </Link>
      </div>
    );
  }

  const err = state.errors ?? {};
  return (
    <form
      // onSubmit + transición en lugar de action={}: React 19 vacía el formulario tras un envío con action,
      // y el postulante perdería lo escrito al corregir un error de validación.
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
      className="space-y-6"
      noValidate
    >
      <input type="hidden" name="_t" value={started} />
      {/* Campo trampa: invisible para personas */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Sitio web <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {state.message && !state.ok && (
        <p className="border-l-2 border-rose-600 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
          {state.message}
        </p>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {fields.map((f) => {
          const id = `f-${f.name}`;
          const wide = f.type === "textarea" || f.type === "checkboxes";
          const describedBy = [f.hint ? `${id}-hint` : "", err[f.name] ? `${id}-err` : ""].filter(Boolean).join(" ") || undefined;
          return (
            <div key={f.name} className={wide ? "md:col-span-2" : ""}>
              {f.type === "checkboxes" ? (
                <fieldset aria-describedby={describedBy}>
                  <legend className="mb-2 text-sm font-medium text-ink">
                    {f.label} {f.required && <span className="text-blue-600">*</span>}
                  </legend>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {f.options!.map((o) => (
                      <label key={o} className="flex cursor-pointer items-center gap-2.5 border border-stone-200 bg-white px-3 py-2 text-sm has-[:checked]:border-blue-500 has-[:checked]:bg-blue-100/50">
                        <input type="checkbox" name={f.name} value={o} className="accent-blue-600" /> {o}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : (
                <>
                  <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
                    {f.label} {f.required && <span className="text-blue-600">*</span>}
                  </label>
                  {f.type === "textarea" ? (
                    <textarea id={id} name={f.name} rows={5} maxLength={f.max} required={f.required} aria-invalid={!!err[f.name]} aria-describedby={describedBy} className={input} />
                  ) : f.type === "select" || f.type === "department" ? (
                    <select id={id} name={f.name} required={f.required} defaultValue="" aria-invalid={!!err[f.name]} aria-describedby={describedBy} className={input}>
                      <option value="">Selecciona…</option>
                      {f.type === "department"
                        ? departments.map((d) => (
                            <option key={d.slug} value={d.slug}>
                              {d.name}
                            </option>
                          ))
                        : f.options!.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      id={id}
                      name={f.name}
                      type={f.type}
                      maxLength={f.max}
                      required={f.required}
                      aria-invalid={!!err[f.name]}
                      aria-describedby={describedBy}
                      autoComplete={f.name === "fullName" ? "name" : f.type === "email" ? "email" : f.type === "tel" ? "tel" : undefined}
                      className={input}
                    />
                  )}
                </>
              )}
              {f.hint && (
                <p id={`${id}-hint`} className="mt-1.5 text-xs text-graphite/80">
                  {f.hint}
                </p>
              )}
              {err[f.name] && (
                <p id={`${id}-err`} className="mt-1.5 text-xs text-rose-700">
                  {err[f.name]}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-3 border-t border-stone-200 pt-6 text-sm">
        <label className="flex items-start gap-3">
          <input type="checkbox" name="privacy" className="mt-1 accent-blue-600" required aria-invalid={!!err.privacy} />
          <span>
            He leído y acepto la <Link href="/privacidad" className="text-blue-600 underline underline-offset-2">política de privacidad</Link>. Mis datos se usarán solo para gestionar esta solicitud y no se publicarán. <span className="text-blue-600">*</span>
          </span>
        </label>
        {err.privacy && <p className="text-xs text-rose-700">{err.privacy}</p>}
        <label className="flex items-start gap-3">
          <input type="checkbox" name="photoConsent" className="mt-1 accent-blue-600" />
          <span>Autorizo el uso de fotografías en las que aparezca durante actividades institucionales (opcional).</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full bg-navy-900 px-7 py-3 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60"
      >
        {pending ? "Enviando…" : submitLabel}
      </button>
    </form>
  );
}
