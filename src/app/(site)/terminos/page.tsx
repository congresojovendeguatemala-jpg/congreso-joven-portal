import type { Metadata } from "next";
import { Container, PageHero } from "@/components/ui";

export const metadata: Metadata = { title: "Términos de uso" };

export default function Terminos() {
  return (
    <>
      <PageHero label="Documento legal" title="Términos de uso" intro="Borrador de trabajo pendiente de aprobación institucional." />
      <section className="py-16">
        <Container className="prose-cj max-w-3xl text-graphite">
          <h2>1. Naturaleza del portal</h2>
          <p>Este es el portal institucional de Congreso Joven Guatemala, organización juvenil apartidista. No representa al Congreso de la República ni a ningún partido político.</p>
          <h2>2. Contenido editorial</h2>
          <p>Los artículos de opinión expresan el criterio de sus autores. Todos los textos pasan por revisión editorial antes de publicarse.</p>
          <h2>3. Uso de formularios</h2>
          <p>Al enviar un formulario declaras que la información es veraz. Las solicitudes no se aprueban automáticamente.</p>
          <h2>4. Propiedad intelectual</h2>
          <p>Las fotografías y documentos se publican con su crédito. Su reproducción requiere citar la fuente.</p>
        </Container>
      </section>
    </>
  );
}
