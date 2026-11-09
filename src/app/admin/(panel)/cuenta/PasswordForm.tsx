"use client";
import { useActionState } from "react";
import { changeOwnPassword, type PwState } from "../../account-actions";

const input = "w-full border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500";

export function PasswordForm() {
  const [state, action, pending] = useActionState<PwState, FormData>(changeOwnPassword, {});
  if (state.ok) {
    return (
      <p className="border-l-2 border-emerald-600 bg-emerald-50 px-4 py-3 text-sm" role="status">
        Contraseña actualizada. Se cerraron tus sesiones abiertas en otros navegadores o equipos.
      </p>
    );
  }
  return (
    <form action={action} className="space-y-4 border border-stone-200 bg-white p-6">
      {state.error && <p className="border-l-2 border-rose-600 bg-rose-50 px-4 py-2 text-sm text-rose-800" role="alert">{state.error}</p>}
      <label className="block text-sm">
        <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-graphite">Contraseña actual</span>
        <input name="current" type="password" required autoComplete="current-password" className={input} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-graphite">Nueva contraseña</span>
        <input name="next" type="password" required minLength={12} autoComplete="new-password" className={input} />
        <span className="mt-1 block text-xs text-stone-400">Al menos 12 caracteres. Una frase de varias palabras es fácil de recordar y difícil de adivinar.</span>
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-graphite">Confirmar nueva contraseña</span>
        <input name="confirm" type="password" required minLength={12} autoComplete="new-password" className={input} />
      </label>
      <button disabled={pending} className="rounded bg-navy-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-60">
        {pending ? "Guardando…" : "Cambiar contraseña"}
      </button>
    </form>
  );
}
