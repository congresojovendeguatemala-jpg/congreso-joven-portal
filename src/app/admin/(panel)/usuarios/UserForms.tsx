"use client";
import { useActionState } from "react";
import { createUser, resetPassword } from "../../settings-actions";

const inputCls = "w-full border border-stone-200 bg-white px-3 py-2 text-sm";

function OneTimePassword({ email, password }: { email: string; password: string }) {
  return (
    <div className="mt-3 border-l-2 border-amber-600 bg-amber-50 p-3 text-sm" role="status">
      Contraseña temporal para <strong>{email}</strong>: <code className="select-all rounded bg-white px-1.5 py-0.5">{password}</code>
      <p className="mt-1 text-xs text-graphite">Se muestra una sola vez. Entrégala por un canal privado; la persona debe cambiarla en «Mi cuenta y contraseña».</p>
    </div>
  );
}

export function CreateUserForm({ roles }: { roles: Record<string, string> }) {
  const [state, action, pending] = useActionState(createUser, {});
  return (
    <div className="mt-6 border border-stone-200 bg-white p-5">
      <p className="font-medium">Nuevo usuario</p>
      <form action={action} className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
        <input name="name" required placeholder="Nombre" className={inputCls} />
        <input name="email" type="email" required placeholder="Correo" className={inputCls} />
        <select name="role" defaultValue="autor" className={inputCls} aria-label="Rol">
          {Object.entries(roles).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button disabled={pending} className="rounded bg-navy-900 px-4 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-60">Crear</button>
      </form>
      {state.error && <p className="mt-3 text-sm text-rose-700">{state.error}</p>}
      {state.password && state.email && <OneTimePassword email={state.email} password={state.password} />}
    </div>
  );
}

export function ResetPasswordButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(resetPassword, {});
  return (
    <div className="text-sm">
      <form action={action}>
        <input type="hidden" name="id" value={id} />
        <button disabled={pending} className="text-blue-600 hover:underline">Restablecer contraseña</button>
      </form>
      {state.password && state.email && <OneTimePassword email={state.email} password={state.password} />}
    </div>
  );
}
