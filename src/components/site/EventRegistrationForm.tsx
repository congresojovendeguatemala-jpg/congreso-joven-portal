"use client";
import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { registerForEvent, type RegState } from "@/lib/event-registration";

const input =
  "w-full border border-stone-200 bg-white px-3.5 py-2.5 text-[0.95rem] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 aria-[invalid=true]:border-rose-500";

const FIELDS: { name: string; label: string; type?: string; autoComplete?: string; inputMode?: "numeric" | "tel" | "email"; hint?: string; half?: boolean }[] = [
  { name: "firstNames", label: "Nombres", autoComplete: "given-name", half: true },
  { name: "lastNames", label: "Apellidos", autoComplete: "family-name", half: true },
  { name: "dpi", label: "Número de DPI", inputMode: "numeric", hint: "13 dígitos, sin espacios. Se usa solo para el control de ingreso.", half: true },
  { name: "age", label: "Edad", type: "number", inputMode: "numeric", half: true },
  { name: "institution", label: "Universidad o institución que representas", autoComplete: "organization" },
  { name: "email", label: "Correo electrónico", type: "email", autoComplete: "email", inputMode: "email", half: true },
  { name: "phone", label: "Número de teléfono", type: "tel", autoComplete: "tel", inputMode: "tel", half: true },
];

export function EventRegistrationForm({ eventId, eventTitle }: { eventId: number; eventTitle: string }) {
  const [state, action, pending] = useActionState<RegState, FormData>(registerForEvent.bind(null, eventId), {});
  const [started] = useState(() => Date.now());

  if (state.ok) {
    return (
      <div className="border border-emerald-700/20 bg-emerald-50 p-7" role="status">
        <p className="eyebrow text-emerald-800">Asistencia confirmada</p>
        <p className="mt-3 font-serif text-2xl text-ink">¡Te esperamos, {state.name}!</p>
        <p className="mt-2 text-graphite">
          Tu asistencia a «{eventTitle}» quedó registrada. Lleva tu DPI el día del evento para el ingreso.
        </p>
      </div>
    );
  }

  const err = state.errors ?? {};
  return (
    <form
      // onSubmit + transición: conserva lo escrito si hay un error de validación (React 19 vacía el formulario con action={}).
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
      className="space-y-5"
      noValidate
    >
      <input type="hidden" name="_t" value={started} />
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Sitio web <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {state.message && (
        <p className="border-l-2 border-rose-600 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
          {state.message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => {
          const id = `reg-${f.name}`;
          return (
            <div key={f.name} className={f.half ? "" : "sm:col-span-2"}>
              <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
                {f.label} <span className="text-blue-600">*</span>
              </label>
              <input
                id={id}
                name={f.name}
                type={f.type ?? "text"}
                required
                autoComplete={f.autoComplete}
                inputMode={f.inputMode}
                min={f.name === "age" ? 14 : undefined}
                max={f.name === "age" ? 99 : undefined}
                maxLength={f.name === "dpi" ? 15 : 160}
                aria-invalid={!!err[f.name]}
                aria-describedby={[f.hint ? `${id}-hint` : "", err[f.name] ? `${id}-err` : ""].filter(Boolean).join(" ") || undefined}
                className={input}
              />
              {f.hint && <p id={`${id}-hint`} className="mt-1 text-xs text-graphite/80">{f.hint}</p>}
              {err[f.name] && <p id={`${id}-err`} className="mt-1 text-xs text-rose-700">{err[f.name]}</p>}
            </div>
          );
        })}
      </div>

      <div className="space-y-3 border-t border-stone-200 pt-5 text-sm">
        <label className="flex items-start gap-3">
          <input type="checkbox" name="privacy" className="mt-1 accent-blue-600" required aria-invalid={!!err.privacy} />
          <span>
            Autorizo a Congreso Joven a usar estos datos solo para gestionar mi asistencia a este evento, según la{" "}
            <Link href="/privacidad" className="text-blue-600 underline underline-offset-2">política de privacidad</Link>. No se publican. <span className="text-blue-600">*</span>
          </span>
        </label>
        {err.privacy && <p className="text-xs text-rose-700">{err.privacy}</p>}
        <label className="flex items-start gap-3">
          <input type="checkbox" name="photoConsent" className="mt-1 accent-blue-600" />
          <span>Autorizo el uso de fotografías del evento en las que aparezca (opcional).</span>
        </label>
      </div>

      <button type="submit" disabled={pending} className="rounded-full bg-navy-900 px-7 py-3 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60">
        {pending ? "Enviando…" : "Confirmar asistencia"}
      </button>
    </form>
  );
}
