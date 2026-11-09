import Link from "next/link";
import { Hemicycle } from "@/components/ui/Hemicycle";

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-ink px-5 text-center text-white">
      <Hemicycle lit={1} seed={42} className="w-72 opacity-80" />
      <p className="eyebrow mt-8 text-blue-300">Error 404</p>
      <h1 className="mt-3 font-serif text-4xl">Esta curul está vacía</h1>
      <p className="mt-3 text-blue-100/70">La página que buscas no existe o fue trasladada.</p>
      <Link href="/" className="mt-8 rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink">Volver al inicio</Link>
    </main>
  );
}
