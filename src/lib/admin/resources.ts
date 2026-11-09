import { schema as s } from "@/db";
import type { Capability } from "@/lib/permissions";
import { DOC_TYPES, MEDIA_CATEGORIES } from "@/lib/media";

/**
 * Recursos editables desde el panel. Cada recurso se describe de forma declarativa:
 * el mismo esquema genera la tabla, el formulario, la validación y la auditoría.
 * Agregar un recurso nuevo = agregar una entrada aquí.
 */
export type FieldType = "text" | "textarea" | "slug" | "number" | "bool" | "date" | "datetime" | "select" | "ref" | "lines" | "rows" | "image";

export type FieldDef = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  hint?: string;
  options?: { value: string; label: string }[];
  /** Para `ref`: recurso de origen de las opciones. */
  ref?: string;
  /** Para `rows`: columnas separadas por «|». */
  columns?: string[];
  wide?: boolean;
};

export type Resource = {
  key: string;
  label: string;
  singular: string;
  cap: Capability;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any;
  titleCol: string;
  listCols: { name: string; label: string }[];
  orderCol: string;
  fields: FieldDef[];
  publicHref?: (row: Record<string, unknown>) => string | null;
  folder?: string;
  /** Solo sirve como fuente de opciones para campos `ref`; no tiene páginas de edición. */
  refOnly?: boolean;
  /** Los registros se crean en otra pantalla (p. ej. subida de archivos), no con «+ Nuevo». */
  createHref?: string;
  /** Columna con el archivo a previsualizar en la edición. */
  previewCol?: string;
};

const VERIF = [
  { value: "verified", label: "Fuente oficial" },
  { value: "internal", label: "Registro institucional" },
  { value: "pending", label: "Por confirmar" },
];
const opts = (o: Record<string, string>) => Object.entries(o).map(([value, label]) => ({ value, label }));

export const RESOURCES: Resource[] = [
  {
    key: "organos",
    label: "Órganos del organigrama",
    singular: "órgano",
    cap: "org.edit",
    table: s.organs,
    titleCol: "name",
    orderCol: "sortOrder",
    listCols: [{ name: "name", label: "Nombre" }, { name: "kind", label: "Tipo" }, { name: "active", label: "Activo" }],
    fields: [
      { name: "name", label: "Nombre", type: "text", required: true },
      { name: "slug", label: "Identificador URL", type: "slug", hint: "Se genera a partir del nombre si lo dejas vacío." },
      {
        name: "kind",
        label: "Tipo",
        type: "select",
        required: true,
        options: opts({ presidencia: "Presidencia", vicepresidencia: "Vicepresidencia", secretaria: "Secretaría", coordinacion: "Coordinación", regional: "Presidencia regional", comision: "Comisión", tribunal: "Tribunal de Honor", departamento: "Departamento", voceria: "Vocería", bancada: "Bancada", asamblea: "Asamblea", otro: "Otro" }),
      },
      { name: "parentId", label: "Depende de", type: "ref", ref: "organos" },
      { name: "description", label: "Descripción", type: "textarea", hint: "Escribe «Agrupación del organigrama» para que funcione como título de grupo." },
      { name: "functions", label: "Funciones", type: "textarea" },
      { name: "sortOrder", label: "Orden", type: "number" },
      { name: "active", label: "Activo (visible en el sitio)", type: "bool" },
      { name: "confirmed", label: "Confirmado en el reglamento vigente", type: "bool" },
    ],
  },
  {
    key: "personas",
    label: "Personas y autoridades",
    singular: "persona",
    cap: "people.edit",
    table: s.people,
    titleCol: "fullName",
    orderCol: "fullName",
    folder: "personas",
    listCols: [{ name: "fullName", label: "Nombre" }, { name: "knownAs", label: "Nombre de uso" }, { name: "public", label: "Pública" }],
    publicHref: (r) => `/estructura/${r.slug}`,
    fields: [
      { name: "fullName", label: "Nombre completo", type: "text", required: true },
      { name: "knownAs", label: "Nombre de uso público", type: "text", hint: "Ej.: «Frank Guerra». Opcional." },
      { name: "slug", label: "Identificador URL", type: "slug" },
      { name: "photoUrl", label: "Fotografía oficial", type: "image" },
      { name: "photoCredit", label: "Crédito de la fotografía", type: "text" },
      { name: "departmentId", label: "Departamento de procedencia", type: "ref", ref: "departamentos" },
      { name: "bio", label: "Biografía", type: "textarea", wide: true },
      { name: "education", label: "Formación académica", type: "textarea" },
      { name: "trajectory", label: "Trayectoria en Congreso Joven", type: "textarea" },
      { name: "verification", label: "Verificación", type: "select", options: VERIF },
      { name: "sourceUrl", label: "Enlace a la fuente", type: "text" },
      { name: "public", label: "Ficha pública", type: "bool" },
      { name: "archived", label: "Archivada", type: "bool" },
    ],
  },
  {
    key: "proyectos",
    label: "Proyectos",
    singular: "proyecto",
    cap: "projects.edit",
    table: s.projects,
    titleCol: "name",
    orderCol: "sortOrder",
    folder: "proyectos",
    listCols: [{ name: "name", label: "Nombre" }, { name: "active", label: "Activo" }, { name: "featured", label: "Destacado" }],
    publicHref: (r) => `/proyectos/${r.slug}`,
    fields: [
      { name: "name", label: "Nombre", type: "text", required: true },
      { name: "slug", label: "Identificador URL", type: "slug" },
      { name: "summary", label: "Resumen", type: "textarea" },
      { name: "body", label: "Descripción completa", type: "textarea", wide: true },
      { name: "objectives", label: "Objetivos", type: "lines", hint: "Uno por línea." },
      { name: "facts", label: "Ficha de datos", type: "rows", columns: ["label", "value", "verification"], hint: "Una fila por línea: Etiqueta | Valor | verified/internal/pending" },
      { name: "coverUrl", label: "Imagen de portada", type: "image" },
      { name: "startDate", label: "Fecha de inicio", type: "date" },
      { name: "verification", label: "Verificación", type: "select", options: VERIF },
      { name: "sortOrder", label: "Orden", type: "number" },
      { name: "active", label: "Activo", type: "bool" },
      { name: "featured", label: "Destacado en inicio", type: "bool" },
    ],
  },
  {
    key: "internacional",
    label: "Participaciones internacionales",
    singular: "participación",
    cap: "international.edit",
    table: s.engagements,
    titleCol: "name",
    orderCol: "startDate",
    listCols: [{ name: "name", label: "Nombre" }, { name: "country", label: "País" }, { name: "status", label: "Estado" }],
    publicHref: (r) => `/internacional/${r.slug}`,
    fields: [
      { name: "name", label: "Nombre", type: "text", required: true },
      { name: "slug", label: "Identificador URL", type: "slug" },
      { name: "country", label: "País", type: "text", required: true },
      { name: "host", label: "Institución anfitriona", type: "text" },
      { name: "startDate", label: "Inicio", type: "date" },
      { name: "endDate", label: "Fin", type: "date" },
      { name: "status", label: "Estado", type: "select", required: true, options: opts({ proyectado: "Proyectado", confirmado: "Confirmado", pospuesto: "Pospuesto", realizado: "Realizado", cancelado: "Cancelado" }) },
      { name: "statusNote", label: "Nota de estado", type: "textarea" },
      { name: "summary", label: "Resumen", type: "textarea" },
      { name: "objectives", label: "Objetivos", type: "lines" },
      { name: "delegation", label: "Delegación", type: "rows", columns: ["name", "role", "verification"], hint: "Nombre | Rol | verified/internal/pending" },
      { name: "program", label: "Programa", type: "textarea" },
      { name: "results", label: "Resultados", type: "textarea", hint: "Solo se muestran si el estado es «Realizado»." },
      { name: "learnings", label: "Aprendizajes", type: "textarea" },
      { name: "costNote", label: "Costo", type: "text" },
      { name: "verification", label: "Verificación", type: "select", options: VERIF },
    ],
  },
  {
    key: "alianzas",
    label: "Alianzas y cooperación",
    singular: "alianza",
    cap: "international.edit",
    table: s.partners,
    titleCol: "name",
    orderCol: "name",
    folder: "alianzas",
    listCols: [{ name: "name", label: "Nombre" }, { name: "relation", label: "Relación" }, { name: "public", label: "Pública" }],
    fields: [
      { name: "name", label: "Nombre", type: "text", required: true },
      { name: "slug", label: "Identificador URL", type: "slug" },
      { name: "logoUrl", label: "Logotipo", type: "image" },
      { name: "country", label: "País", type: "text" },
      { name: "description", label: "Descripción", type: "textarea" },
      { name: "kind", label: "Tipo", type: "select", options: opts({ organizacion_juvenil: "Organización juvenil", parlamento_juvenil: "Parlamento juvenil", internacional: "Organización internacional", fundacion: "Fundación", universidad: "Universidad", red: "Red de liderazgo", plataforma: "Plataforma democrática" }) },
      { name: "relation", label: "Tipo de relación", type: "select", required: true, options: opts({ convenio_firmado: "Convenio firmado", colaboracion: "Colaboración", contacto: "Contacto institucional", participacion_evento: "Participación en evento" }) },
      { name: "since", label: "Desde", type: "date" },
      { name: "public", label: "Publicar en el directorio", type: "bool" },
    ],
  },
  {
    key: "historia",
    label: "Línea de tiempo",
    singular: "acontecimiento",
    cap: "timeline.edit",
    table: s.timelineEvents,
    titleCol: "title",
    orderCol: "date",
    folder: "historia",
    listCols: [{ name: "date", label: "Fecha" }, { name: "title", label: "Título" }, { name: "verification", label: "Verificación" }],
    fields: [
      { name: "title", label: "Título", type: "text", required: true },
      { name: "date", label: "Fecha (para ordenar)", type: "date" },
      { name: "dateLabel", label: "Fecha visible", type: "text", hint: "Ej.: «Período 2023–2024». Si se deja vacía, se muestra la fecha." },
      { name: "summary", label: "Descripción", type: "textarea", wide: true },
      { name: "category", label: "Categoría", type: "select", required: true, options: opts({ fundacion: "Fundación", generacion: "Generaciones", autoridades: "Autoridades", territorio: "Territorio", elecciones: "Elecciones", parlamento: "Parlamentos juveniles", legislativo: "Encuentros legislativos", social: "Proyectos sociales", internacional: "Cooperación internacional" }) },
      { name: "organizer", label: "Organizado por", type: "select", options: opts({ congreso_joven: "Congreso Joven", congreso_republica: "Congreso de la República", coorganizado: "Coorganizado", otro: "Despacho legislativo u otro" }) },
      { name: "people", label: "Personas identificadas", type: "lines", hint: "Una por línea." },
      { name: "sourceUrl", label: "Enlace a la fuente", type: "text" },
      { name: "sourceLabel", label: "Nombre de la fuente", type: "text" },
      { name: "imageUrl", label: "Imagen", type: "image" },
      { name: "verification", label: "Verificación", type: "select", required: true, options: VERIF },
      { name: "public", label: "Público", type: "bool" },
      { name: "showInCongress", label: "Mostrar en «Relación con el Congreso»", type: "bool" },
    ],
  },
  {
    key: "eventos",
    label: "Eventos y convocatorias",
    singular: "evento",
    cap: "events.manage",
    table: s.events,
    titleCol: "title",
    orderCol: "startsAt",
    listCols: [{ name: "startsAt", label: "Fecha" }, { name: "title", label: "Título" }, { name: "published", label: "Publicado" }],
    fields: [
      { name: "title", label: "Título", type: "text", required: true },
      { name: "slug", label: "Identificador URL", type: "slug" },
      { name: "summary", label: "Descripción", type: "textarea" },
      { name: "startsAt", label: "Inicio (hora de Guatemala)", type: "datetime", required: true },
      { name: "endsAt", label: "Fin", type: "datetime" },
      { name: "location", label: "Lugar", type: "text" },
      { name: "capacity", label: "Cupo", type: "number" },
      { name: "registrationOpen", label: "Inscripciones abiertas", type: "bool" },
      { name: "published", label: "Publicado", type: "bool" },
    ],
  },
  {
    key: "regiones",
    label: "Regiones",
    singular: "región",
    cap: "territory.edit",
    table: s.regions,
    titleCol: "name",
    orderCol: "sortOrder",
    listCols: [{ name: "name", label: "Nombre" }, { name: "active", label: "Activa" }],
    publicHref: (r) => `/territorio/${r.slug}`,
    fields: [
      { name: "name", label: "Nombre", type: "text", required: true },
      { name: "slug", label: "Identificador URL", type: "slug" },
      { name: "description", label: "Descripción", type: "textarea" },
      { name: "sortOrder", label: "Orden", type: "number" },
      { name: "active", label: "Activa", type: "bool" },
    ],
  },
  {
    key: "departamentos",
    label: "Departamentos",
    singular: "departamento",
    cap: "territory.edit",
    table: s.departments,
    titleCol: "name",
    orderCol: "name",
    listCols: [{ name: "name", label: "Departamento" }, { name: "regionId", label: "Región" }],
    fields: [
      { name: "name", label: "Nombre", type: "text", required: true },
      { name: "slug", label: "Identificador URL", type: "slug" },
      { name: "regionId", label: "Región", type: "ref", ref: "regiones", hint: "Al asignarla, el mapa colorea el departamento con su región." },
      { name: "description", label: "Información institucional", type: "textarea" },
      { name: "tileX", label: "Columna en el mapa", type: "number", required: true },
      { name: "tileY", label: "Fila en el mapa", type: "number", required: true },
    ],
  },
  {
    key: "autores",
    label: "Autores",
    singular: "autor",
    cap: "authors.manage",
    table: s.authors,
    titleCol: "name",
    orderCol: "name",
    folder: "autores",
    listCols: [{ name: "name", label: "Nombre" }, { name: "userId", label: "Cuenta vinculada" }],
    publicHref: (r) => `/autores/${r.slug}`,
    fields: [
      { name: "name", label: "Nombre público", type: "text", required: true },
      { name: "slug", label: "Identificador URL", type: "slug" },
      { name: "userId", label: "Cuenta de usuario vinculada", type: "ref", ref: "usuarios", hint: "Permite que la persona escriba y envíe sus artículos con su propia cuenta." },
      { name: "photoUrl", label: "Fotografía", type: "image" },
      { name: "bio", label: "Biografía", type: "textarea", wide: true },
      { name: "socials", label: "Redes sociales autorizadas", type: "rows", columns: ["label", "url"], hint: "Red | https://enlace" },
    ],
  },
  {
    key: "albumes",
    label: "Álbumes de fotos",
    singular: "álbum",
    cap: "media.manage",
    table: s.galleries,
    titleCol: "title",
    orderCol: "sortOrder",
    folder: "albumes",
    listCols: [{ name: "title", label: "Título" }, { name: "date", label: "Fecha" }, { name: "public", label: "Público" }],
    publicHref: (r) => (r.public ? `/archivo/galeria/${r.slug}` : null),
    fields: [
      { name: "title", label: "Título", type: "text", required: true },
      { name: "slug", label: "Identificador URL", type: "slug" },
      { name: "description", label: "Descripción", type: "textarea" },
      { name: "date", label: "Fecha", type: "date" },
      { name: "category", label: "Categoría", type: "select", options: opts(MEDIA_CATEGORIES) },
      { name: "coverUrl", label: "Portada", type: "image", hint: "Si no eliges una, se usa la primera foto del álbum." },
      { name: "sortOrder", label: "Orden", type: "number" },
      { name: "public", label: "Publicar en la galería", type: "bool" },
    ],
  },
  {
    key: "multimedia",
    label: "Archivo multimedia",
    singular: "archivo",
    cap: "media.manage",
    table: s.media,
    titleCol: "title",
    orderCol: "createdAt",
    createHref: "/admin/multimedia",
    previewCol: "url",
    listCols: [{ name: "title", label: "Título" }, { name: "kind", label: "Tipo" }, { name: "public", label: "Público" }],
    fields: [
      { name: "title", label: "Título", type: "text", required: true },
      { name: "caption", label: "Descripción / pie de foto", type: "textarea" },
      { name: "credit", label: "Crédito", type: "text" },
      { name: "date", label: "Fecha", type: "date" },
      { name: "year", label: "Año", type: "number" },
      { name: "category", label: "Categoría", type: "select", options: opts(MEDIA_CATEGORIES) },
      { name: "docType", label: "Tipo de documento", type: "select", options: opts(DOC_TYPES), hint: "Solo para documentos PDF." },
      { name: "eventName", label: "Evento", type: "text" },
      { name: "galleryId", label: "Álbum", type: "ref", ref: "albumes" },
      { name: "departmentId", label: "Departamento", type: "ref", ref: "departamentos" },
      { name: "people", label: "Personas que aparecen", type: "lines", hint: "Una por línea. Solo con su consentimiento." },
      { name: "tags", label: "Etiquetas", type: "lines", hint: "Una por línea." },
      { name: "sortOrder", label: "Orden dentro del álbum", type: "number" },
      { name: "public", label: "Público", type: "bool" },
    ],
  },
  {
    key: "usuarios",
    label: "Usuarios",
    singular: "usuario",
    cap: "users.manage",
    table: s.users,
    titleCol: "name",
    orderCol: "name",
    listCols: [],
    fields: [],
    refOnly: true,
  },
  {
    key: "categorias",
    label: "Categorías editoriales",
    singular: "categoría",
    cap: "articles.publish",
    table: s.categories,
    titleCol: "name",
    orderCol: "sortOrder",
    listCols: [{ name: "name", label: "Nombre" }],
    fields: [
      { name: "name", label: "Nombre", type: "text", required: true },
      { name: "slug", label: "Identificador URL", type: "slug" },
      { name: "sortOrder", label: "Orden", type: "number" },
    ],
  },
];

export const getResource = (key: string) => RESOURCES.find((r) => r.key === key);
/** Recursos con páginas de edición (excluye los que solo alimentan opciones). */
export const getEditableResource = (key: string) => RESOURCES.find((r) => r.key === key && !r.refOnly);
