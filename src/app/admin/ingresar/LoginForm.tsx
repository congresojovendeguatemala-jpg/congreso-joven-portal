"use client";
import { useActionState } from "react";
import { login } from "../actions";

const input = "mt-1.5 w-full border border-white/15 bg-white/5 px-3.5 py-2.5 text-white outline-none focus:border-blue-300";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, {});
  return (
    <form action={action} className="mt-8 space-y-5">
      {state.error && <p role="alert" className="border-l-2 border-rose-400 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{state.error}</p>}
      <label className="block text-sm text-blue-100/80">
        Correo
        <input name="email" type="email" required autoComplete="username" className={input} />
      </label>
      <label className="block text-sm text-blue-100/80">
        Contraseña
        <input name="password" type="password" required autoComplete="current-password" className={input} />
      </label>
      <button disabled={pending} className="w-full rounded-full bg-white py-3 text-sm font-semibold text-ink hover:bg-glow disabled:opacity-60">
        {pending ? "Verificando…" : "Ingresar"}
      </button>
    </form>
  );
}
