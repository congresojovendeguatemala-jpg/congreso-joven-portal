import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/permissions";
import { PasswordForm } from "./PasswordForm";

export default async function Cuenta() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/ingresar");
  return (
    <div className="max-w-md">
      <h1 className="font-serif text-3xl">Mi cuenta</h1>
      <p className="mt-2 text-sm text-graphite">
        {user.name} · {user.email} · {ROLE_LABELS[user.role]}
      </p>
      <h2 className="mt-8 mb-3 font-medium">Cambiar contraseña</h2>
      <PasswordForm />
    </div>
  );
}
