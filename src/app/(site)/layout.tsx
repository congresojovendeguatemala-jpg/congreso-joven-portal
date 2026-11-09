import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { getSiteMeta } from "@/lib/settings";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { editorialName, email, social } = await getSiteMeta();
  return (
    <>
      <Header />
      <main id="contenido">{children}</main>
      <Footer editorialName={editorialName} email={email} social={social} />
    </>
  );
}
