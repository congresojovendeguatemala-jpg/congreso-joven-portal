import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { Container, PageHero } from "@/components/ui";
import { ApplicationForm } from "@/components/site/ApplicationForm";
import { getModality } from "@/lib/modalities";
import { getSiteMeta } from "@/lib/settings";

export const metadata: Metadata = { title: "Contacto" };

export default async function Contacto() {
  const m = getModality("contacto")!;
  const departments = await db.select({ slug: s.departments.slug, name: s.departments.name }).from(s.departments).orderBy(asc(s.departments.name));
  const { email } = await getSiteMeta();
  return (
    <>
      <PageHero label="Contacto" title="Escribe a Congreso Joven" intro="Consultas generales, solicitudes de información institucional y medios de comunicación." />
      <section className="py-20">
        <Container className="max-w-3xl">
          {email && (
            <p className="mb-8 text-graphite">
              Correo institucional:{" "}
              <a href={`mailto:${email}`} className="font-medium text-blue-600 underline underline-offset-2">{email}</a>
            </p>
          )}
          <div className="border border-stone-200 bg-white p-6 md:p-10">
            <ApplicationForm slug="contacto" fields={m.fields} departments={departments} submitLabel="Enviar mensaje" />
          </div>
        </Container>
      </section>
    </>
  );
}
