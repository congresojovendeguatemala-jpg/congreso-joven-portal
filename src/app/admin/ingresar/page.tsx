import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";
import { Logo } from "@/components/site/Header";

export const metadata: Metadata = { title: "Acceso institucional", robots: { index: false } };

export default function Ingresar() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-ink px-5">
      <div className="w-full max-w-sm">
        <Logo />
        <h1 className="mt-10 font-serif text-3xl text-white">Acceso institucional</h1>
        <p className="mt-2 text-sm text-blue-100/60">Panel privado de administración.</p>
        <LoginForm />
      </div>
    </main>
  );
}
