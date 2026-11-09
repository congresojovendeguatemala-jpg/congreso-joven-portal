import { asc } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { requireCapability } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/permissions";
import { fmtDate } from "@/lib/format";
import { inputCls } from "@/components/admin/FieldInput";
import { updateUser } from "../../settings-actions";
import { CreateUserForm, ResetPasswordButton } from "./UserForms";

export default async function Usuarios({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const me = await requireCapability("users.manage");
  const { ok, error } = await searchParams;
  const users = await db.select().from(s.users).orderBy(asc(s.users.name));
  return (
    <div className="max-w-5xl">
      <h1 className="font-serif text-3xl">Usuarios y permisos</h1>
      {ok && <p className="mt-4 border-l-2 border-emerald-600 bg-emerald-50 px-4 py-2 text-sm">Usuario actualizado.</p>}
      {error && <p className="mt-4 border-l-2 border-rose-600 bg-rose-50 px-4 py-2 text-sm">{error}</p>}
      <CreateUserForm roles={ROLE_LABELS} />
      <div className="mt-8 divide-y divide-stone-200 border border-stone-200 bg-white">
        {users.map((u) => (
          <div key={u.id} className="grid gap-3 p-4 md:grid-cols-[1.4fr_1fr_auto] md:items-center">
            <div>
              <p className="font-medium">{u.name} {u.id === me.id && <span className="text-xs text-stone-400">(tú)</span>}</p>
              <p className="text-xs text-graphite">{u.email} · último ingreso: {u.lastLoginAt ? fmtDate(u.lastLoginAt, { dateStyle: "medium", timeStyle: "short" }) : "nunca"}</p>
            </div>
            <form action={updateUser} className="flex flex-wrap items-center gap-3 text-sm">
              <input type="hidden" name="id" value={u.id} />
              <select name="role" defaultValue={u.role} className={`${inputCls} w-auto`} aria-label={`Rol de ${u.name}`}>
                {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <label className="flex items-center gap-1.5"><input type="checkbox" name="active" defaultChecked={u.active} /> Activo</label>
              <button className="rounded bg-navy-900 px-3 py-1.5 text-white hover:bg-blue-600">Guardar</button>
            </form>
            <ResetPasswordButton id={u.id} />
          </div>
        ))}
      </div>
    </div>
  );
}
