import type { Metadata } from "next";
import { Container, PageHero } from "@/components/ui";

export const metadata: Metadata = { title: "Política de privacidad" };

export default function Privacidad() {
  return (
    <>
      <PageHero label="Documento legal" title="Política de privacidad" intro="Borrador de trabajo. Debe ser revisado y aprobado por Congreso Joven antes de la publicación oficial del portal." />
      <section className="py-16">
        <Container className="prose-cj max-w-3xl text-graphite">
          <h2>1. Datos que recopilamos</h2>
          <p>Recopilamos únicamente los datos que nos proporcionas en los formularios: nombre, correo electrónico, teléfono, departamento, municipio, fecha de nacimiento, nivel educativo y la información que decidas compartir sobre tu motivación y experiencia.</p>
          <h2>2. Finalidad</h2>
          <p>Usamos estos datos exclusivamente para revisar y responder tu solicitud, gestionar tu participación en actividades y comunicarnos contigo sobre ella.</p>
          <h2>3. Publicación</h2>
          <p>Los datos personales de postulantes nunca se publican. Solo el personal autorizado de Congreso Joven puede consultarlos, y cada acceso administrativo queda registrado.</p>
          <h2>4. Fotografías</h2>
          <p>Solo publicamos fotografías de actividades en las que aparezcas si nos diste tu consentimiento expreso. Puedes retirarlo en cualquier momento.</p>
          <h2>5. Seguridad y conservación</h2>
          <p>Aplicamos medidas técnicas para proteger tu información (conexiones cifradas, contraseñas cifradas y control de acceso por roles). Conservamos los datos mientras sean necesarios para la finalidad indicada.</p>
          <h2>6. Tus derechos</h2>
          <p>Puedes solicitar acceso, corrección o eliminación de tus datos mediante el formulario de contacto.</p>
        </Container>
      </section>
    </>
  );
}
