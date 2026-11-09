/**
 * Modalidades de participación. Cada una tiene su flujo y su formulario propio,
 * definidos de forma declarativa: el mismo esquema genera el formulario y la validación.
 */
export type Field = {
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "date" | "textarea" | "select" | "checkboxes" | "department" | "url";
  required?: boolean;
  options?: string[];
  hint?: string;
  max?: number;
};

export type Modality = {
  slug: string;
  type: "integrante" | "voluntario" | "autor" | "participante" | "delegado" | "cooperacion" | "contacto" | "propuesta";
  letter: string;
  title: string;
  short: string;
  description: string;
  steps: string[];
  fields: Field[];
  /** Si el nombre/correo los representa una institución en lugar de una persona. */
  institutional?: boolean;
  listed?: boolean;
};

const EDU = ["Diversificado en curso", "Diversificado completo", "Universitario en curso", "Universitario completo", "Posgrado", "Otro"];
const INTERESTS = ["Formación política", "Proceso legislativo", "Educación", "Cultura y pueblos indígenas", "Obras sociales", "Relaciones internacionales", "Comunicación", "Tecnología", "Otro"];

const personBase: Field[] = [
  { name: "fullName", label: "Nombre completo", type: "text", required: true, max: 120 },
  { name: "email", label: "Correo electrónico", type: "email", required: true, max: 160 },
  { name: "phone", label: "Teléfono", type: "tel", required: true, max: 30 },
];

export const MODALITIES: Modality[] = [
  {
    slug: "integrante",
    type: "integrante",
    letter: "A",
    title: "Integrante de Congreso Joven",
    short: "Incorpórate a la organización y forma parte de una generación.",
    description:
      "Para jóvenes que quieren incorporarse a Congreso Joven, conocer el funcionamiento del Estado y desarrollar su liderazgo en espacios de deliberación y representación.",
    steps: ["Envías tu postulación", "El equipo institucional la revisa", "Te contactamos para los siguientes pasos"],
    fields: [
      ...personBase,
      { name: "birthDate", label: "Fecha de nacimiento", type: "date", required: true },
      { name: "department", label: "Departamento", type: "department", required: true },
      { name: "municipality", label: "Municipio", type: "text", required: true, max: 80 },
      { name: "education", label: "Nivel educativo", type: "select", required: true, options: EDU },
      { name: "interest", label: "Área de interés", type: "select", required: true, options: INTERESTS },
      { name: "motivation", label: "¿Por qué quieres participar?", type: "textarea", required: true, max: 2000 },
      { name: "leadership", label: "Experiencia de liderazgo", type: "textarea", max: 2000, hint: "Gobierno estudiantil, voluntariado, organizaciones, proyectos comunitarios… (opcional)" },
    ],
  },
  {
    slug: "voluntario",
    type: "voluntario",
    letter: "B",
    title: "Colaborador voluntario",
    short: "Aporta tu tiempo y tus capacidades a proyectos concretos.",
    description: "Para personas que quieren colaborar en áreas específicas sin integrarse necesariamente a la estructura representativa.",
    steps: ["Indicas tus áreas y disponibilidad", "Coordinamos según las necesidades de cada proyecto", "Te convocamos a una actividad"],
    fields: [
      ...personBase,
      { name: "department", label: "Departamento", type: "department", required: true },
      { name: "areas", label: "Áreas en las que te gustaría colaborar", type: "checkboxes", required: true, options: ["Educación", "Obras sociales", "Eventos", "Comunicación", "Tecnología", "Investigación", "Logística", "Formación"] },
      { name: "availability", label: "Disponibilidad", type: "select", required: true, options: ["Algunas horas al mes", "Fines de semana", "Entre semana", "Por evento"] },
      { name: "skills", label: "Habilidades o experiencia", type: "textarea", max: 1500 },
    ],
  },
  {
    slug: "autor",
    type: "autor",
    letter: "C",
    title: "Autor o colaborador editorial",
    short: "Escribe en el medio institucional de Congreso Joven.",
    description: "Solicita acceso como autor. Tras la aprobación podrás enviar artículos, que pasan por revisión editorial antes de publicarse.",
    steps: ["Solicitas acceso como autor", "El equipo editorial revisa tu perfil", "Recibes tu cuenta y envías artículos a revisión"],
    fields: [
      ...personBase.slice(0, 2),
      { name: "department", label: "Departamento", type: "department" },
      { name: "topics", label: "Temas sobre los que te interesa escribir", type: "checkboxes", required: true, options: ["Política Nacional", "Juventud", "Educación", "Democracia", "Congreso de la República", "Formación Política", "Cultura", "Participación Ciudadana", "Relaciones Internacionales", "Opinión", "Historias de Liderazgo"] },
      { name: "bio", label: "Biografía breve", type: "textarea", required: true, max: 800 },
      { name: "sample", label: "Enlace a un texto tuyo", type: "url", hint: "Opcional. Blog, artículo o documento público." },
      { name: "pitch", label: "Propuesta de primer artículo", type: "textarea", required: true, max: 1500 },
    ],
  },
  {
    slug: "participante",
    type: "participante",
    letter: "D",
    title: "Participante en actividades",
    short: "Inscríbete en encuentros, capacitaciones y actividades.",
    description: "Inscripción a eventos, encuentros, capacitaciones y actividades abiertas de Congreso Joven.",
    steps: ["Eliges la actividad", "Confirmamos tu cupo", "Recibes los detalles de participación"],
    fields: [
      ...personBase,
      { name: "department", label: "Departamento", type: "department", required: true },
      { name: "activity", label: "Actividad de interés", type: "text", required: true, max: 160, hint: "Si no hay convocatorias abiertas, indica el tipo de actividad que te interesa." },
      { name: "institution", label: "Centro educativo o institución", type: "text", max: 160 },
    ],
  },
  {
    slug: "delegado",
    type: "delegado",
    letter: "E",
    title: "Delegado territorial",
    short: "Representa y coordina actividades en tu departamento.",
    description: "Para jóvenes interesados en representar a Congreso Joven o coordinar actividades en su departamento o municipio.",
    steps: ["Presentas tu postulación y plan", "La coordinación territorial evalúa", "Entrevista y designación, si corresponde"],
    fields: [
      ...personBase,
      { name: "birthDate", label: "Fecha de nacimiento", type: "date", required: true },
      { name: "department", label: "Departamento", type: "department", required: true },
      { name: "municipality", label: "Municipio", type: "text", required: true, max: 80 },
      { name: "experience", label: "Experiencia organizativa en tu territorio", type: "textarea", required: true, max: 2000 },
      { name: "plan", label: "¿Qué actividades impulsarías?", type: "textarea", required: true, max: 2000 },
    ],
  },
  {
    slug: "cooperacion",
    type: "cooperacion",
    letter: "F",
    title: "Cooperación institucional",
    short: "Universidades, fundaciones y organizaciones aliadas.",
    description: "Para universidades, organizaciones juveniles, fundaciones e instituciones interesadas en colaborar con Congreso Joven.",
    steps: ["Presentas la propuesta institucional", "La dirección de relaciones institucionales la analiza", "Reunión y definición del tipo de cooperación"],
    institutional: true,
    fields: [
      { name: "organization", label: "Institución u organización", type: "text", required: true, max: 160 },
      { name: "orgType", label: "Tipo de institución", type: "select", required: true, options: ["Universidad", "Organización juvenil", "Parlamento juvenil", "Fundación", "Organismo internacional", "Institución pública", "Otra"] },
      { name: "country", label: "País", type: "text", required: true, max: 80 },
      { name: "fullName", label: "Nombre de la persona de contacto", type: "text", required: true, max: 120 },
      { name: "role", label: "Cargo", type: "text", required: true, max: 120 },
      { name: "email", label: "Correo institucional", type: "email", required: true, max: 160 },
      { name: "phone", label: "Teléfono", type: "tel", max: 30 },
      { name: "proposal", label: "Propuesta de cooperación", type: "textarea", required: true, max: 3000 },
    ],
  },
  {
    slug: "propuesta",
    type: "propuesta",
    letter: "G",
    title: "Propuesta de proyecto",
    short: "Presenta una idea de proyecto para Congreso Joven.",
    description: "Comparte una propuesta de proyecto social, educativo o de formación para que el equipo institucional la evalúe.",
    steps: ["Describes la propuesta", "El equipo de proyectos la evalúa", "Te contactamos si avanza"],
    listed: false,
    fields: [
      ...personBase.slice(0, 2),
      { name: "department", label: "Departamento", type: "department" },
      { name: "title", label: "Nombre del proyecto", type: "text", required: true, max: 160 },
      { name: "summary", label: "Descripción y objetivos", type: "textarea", required: true, max: 3000 },
    ],
  },
  {
    slug: "contacto",
    type: "contacto",
    letter: "·",
    title: "Contacto",
    short: "Escribe a Congreso Joven.",
    description: "Consultas generales, solicitudes de información y medios de comunicación.",
    steps: [],
    listed: false,
    fields: [
      ...personBase.slice(0, 2),
      { name: "subject", label: "Asunto", type: "select", required: true, options: ["Consulta general", "Solicitud de información", "Prensa y medios", "Otro"] },
      { name: "message", label: "Mensaje", type: "textarea", required: true, max: 3000 },
    ],
  },
];

export const LISTED_MODALITIES = MODALITIES.filter((m) => m.listed !== false);
export const getModality = (slug: string) => MODALITIES.find((m) => m.slug === slug);
