import type { Metadata, Viewport } from "next";
import { Public_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const sans = Public_Sans({ subsets: ["latin"], variable: "--font-public-sans", display: "swap" });
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-source-serif", display: "swap" });

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "Congreso Joven Guatemala", template: "%s · Congreso Joven Guatemala" },
  description:
    "Comunidad activa de 2,000 jóvenes en toda la República: plataforma juvenil apartidista para la participación democrática, la formación política y el liderazgo de las nuevas generaciones de Guatemala.",
  openGraph: { type: "website", locale: "es_GT", siteName: "Congreso Joven Guatemala" },
};

export const viewport: Viewport = { themeColor: "#060f24" };

// Las páginas leen la base de datos en cada solicitud (contenido administrable).
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-GT" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-white focus:px-4 focus:py-2">
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  );
}
