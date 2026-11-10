/**
 * Datos iniciales. Regla: solo hechos verificados (fuente pública) o internos
 * (proporcionados por Congreso Joven), siempre con su nivel de verificación.
 * Ver docs/INVESTIGACION.md.
 */

const CG = "https://www.congreso.gob.gt/noticias_congreso";

export const REGIONS = [
  { slug: "metropolitana", name: "Región Metropolitana", sortOrder: 1 },
  { slug: "centro", name: "Región Centro", sortOrder: 2 },
  { slug: "norte", name: "Región Norte", sortOrder: 3 },
  { slug: "oriente", name: "Región Oriente", sortOrder: 4 },
  { slug: "occidente", name: "Región Occidente", sortOrder: 5 },
  { slug: "costa-sur", name: "Región Costa Sur", sortOrder: 6 },
];

/** 22 departamentos. tileX/tileY: posición en el cartograma (aprox. geográfica). Región sin asignar hasta confirmación. */
export const DEPARTMENTS: { slug: string; name: string; x: number; y: number }[] = [
  { slug: "peten", name: "Petén", x: 3, y: 0 },
  { slug: "huehuetenango", name: "Huehuetenango", x: 1, y: 1 },
  { slug: "quiche", name: "Quiché", x: 2, y: 1 },
  { slug: "alta-verapaz", name: "Alta Verapaz", x: 3, y: 1 },
  { slug: "izabal", name: "Izabal", x: 4, y: 1 },
  { slug: "san-marcos", name: "San Marcos", x: 0, y: 2 },
  { slug: "quetzaltenango", name: "Quetzaltenango", x: 1, y: 2 },
  { slug: "totonicapan", name: "Totonicapán", x: 2, y: 2 },
  { slug: "baja-verapaz", name: "Baja Verapaz", x: 3, y: 2 },
  { slug: "el-progreso", name: "El Progreso", x: 4, y: 2 },
  { slug: "zacapa", name: "Zacapa", x: 5, y: 2 },
  { slug: "retalhuleu", name: "Retalhuleu", x: 1, y: 3 },
  { slug: "solola", name: "Sololá", x: 2, y: 3 },
  { slug: "chimaltenango", name: "Chimaltenango", x: 3, y: 3 },
  { slug: "guatemala", name: "Guatemala", x: 4, y: 3 },
  { slug: "jalapa", name: "Jalapa", x: 5, y: 3 },
  { slug: "chiquimula", name: "Chiquimula", x: 6, y: 3 },
  { slug: "suchitepequez", name: "Suchitepéquez", x: 2, y: 4 },
  { slug: "sacatepequez", name: "Sacatepéquez", x: 3, y: 4 },
  { slug: "santa-rosa", name: "Santa Rosa", x: 4, y: 4 },
  { slug: "jutiapa", name: "Jutiapa", x: 5, y: 4 },
  { slug: "escuintla", name: "Escuintla", x: 3, y: 5 },
];

export const CATEGORIES = [
  "Política Nacional",
  "Juventud",
  "Educación",
  "Democracia",
  "Congreso de la República",
  "Formación Política",
  "Cultura",
  "Participación Ciudadana",
  "Relaciones Internacionales",
  "Opinión",
  "Noticias Institucionales",
  "Historias de Liderazgo",
];

/**
 * Estructura Nacional oficial (organigrama institucional proporcionado por Congreso Joven, nov. 2026).
 * Los nodos "grupo" agrupan órganos del mismo tipo para la visualización.
 */
type OrganSeed = { slug: string; name: string; kind: string; parent?: string; group?: boolean };
const children = (parent: string, kind: string, items: [string, string][]): OrganSeed[] =>
  items.map(([slug, name]) => ({ slug, name, kind, parent }));

export const ORGANS: OrganSeed[] = [
  { slug: "presidencia", name: "Presidencia", kind: "presidencia" },

  // Rama de la Secretaría General
  { slug: "secretaria-general", name: "Secretaría General", kind: "secretaria", parent: "presidencia" },
  { slug: "coordinacion-nacional", name: "Coordinación Nacional", kind: "coordinacion", parent: "secretaria-general" },
  { slug: "presidencias-regionales", name: "Presidencias regionales", kind: "regional", parent: "coordinacion-nacional", group: true },
  ...children("presidencias-regionales", "regional", [
    ["presidencia-regional-metropolitana", "Presidencia Regional Metropolitana"],
    ["presidencia-regional-centro", "Presidencia Regional Centro"],
    ["presidencia-regional-norte", "Presidencia Regional Norte"],
    ["presidencia-regional-costa-sur", "Presidencia Regional Costa Sur"],
    ["presidencia-regional-oriente", "Presidencia Regional Oriente"],
    ["presidencia-regional-occidente", "Presidencia Regional Occidente"],
  ]),
  { slug: "direcciones-de-comision", name: "Direcciones de comisión", kind: "comision", parent: "coordinacion-nacional", group: true },
  ...children("direcciones-de-comision", "comision", [
    ["comision-educacion", "Comisión de Educación"],
    ["comision-salud", "Comisión de Salud"],
    ["comision-cultura", "Comisión de Cultura"],
    ["comision-medio-ambiente", "Comisión de Medio Ambiente"],
    ["comision-emprendimiento", "Comisión de Emprendimiento"],
  ]),

  // Vicepresidencias y secretarías
  { slug: "vicepresidencias", name: "Vicepresidencias", kind: "vicepresidencia", parent: "presidencia", group: true },
  ...children("vicepresidencias", "vicepresidencia", [
    ["vicepresidencia-planificacion", "Vicepresidencia de Planificación"],
    ["vicepresidencia-formacion", "Vicepresidencia de Formación Política"],
    ["vicepresidencia-relaciones-externas", "Vicepresidencia de Relaciones Externas"],
  ]),
  { slug: "secretarias", name: "Secretarías", kind: "secretaria", parent: "presidencia", group: true },
  ...children("secretarias", "secretaria", [
    ["secretaria-staff", "Secretaría de Staff"],
    ["secretaria-actas", "Secretaría de Actas"],
    ["secretaria-comunicacion-medios", "Secretaría de Comunicación y Medios"],
    ["secretaria-obras-sociales", "Secretaría de Obras Sociales"],
  ]),

  // Vocería y bancadas
  { slug: "voceria-oficial", name: "Vocería Oficial", kind: "voceria", parent: "presidencia" },
  { slug: "cuerpo-de-portavoces", name: "Cuerpo de Portavoces", kind: "voceria", parent: "voceria-oficial" },
  { slug: "bancadas", name: "Bancadas", kind: "bancada", parent: "presidencia", group: true },
  ...children("bancadas", "bancada", [
    ["bancada-f", "Bancada F"],
    ["bancada-g", "Bancada G"],
    ["bancada-e", "Bancada E"],
  ]),

  // Tribunal de Honor
  { slug: "tribunal-de-honor", name: "Presidencia del Tribunal de Honor", kind: "tribunal", parent: "presidencia" },
  { slug: "departamentos-th", name: "Departamentos", kind: "departamento", parent: "tribunal-de-honor", group: true },
  ...children("departamentos-th", "departamento", [
    ["departamento-asuntos-legales", "Departamento de Asuntos Legales"],
    ["departamento-cooperacion-internacional", "Departamento de Cooperación Internacional"],
    ["departamento-funcionamiento-interno", "Departamento de Funcionamiento Interno"],
    ["departamento-sanciones", "Departamento de Sanciones"],
  ]),
  { slug: "consejo-disciplinario", name: "Consejo Disciplinario", kind: "tribunal", parent: "tribunal-de-honor" },
  ...children("consejo-disciplinario", "tribunal", [
    ["vocal-i-th", "Vocal I del Tribunal de Honor"],
    ["vocal-ii-th", "Vocal II del Tribunal de Honor"],
    ["vocal-iii-th", "Vocal III del Tribunal de Honor"],
    ["vocal-iv-th", "Vocal IV del Tribunal de Honor"],
  ]),
];

const INSTITUCIONAL = "Registro institucional (presidencias de Congreso Joven)";

type PositionSeed = {
  organ: string | null;
  title: string;
  periodLabel: string;
  periodStart?: string;
  periodEnd?: string;
  current?: boolean;
  elect?: boolean;
  verification: "verified" | "internal" | "pending";
  sourceUrl?: string;
};

/** Personas con cargo documentado. Fotos: recortes de piezas gráficas institucionales (solicitar originales). */
export const PEOPLE: {
  slug: string;
  fullName: string;
  knownAs?: string;
  photoUrl?: string;
  verification: "verified" | "internal";
  sourceUrl?: string;
  /** false = no aparece en el sitio. archived = oculto en la lista del panel (se puede restaurar). */
  public?: boolean;
  archived?: boolean;
  positions: PositionSeed[];
}[] = [
  // ── Autoridades en funciones (confirmadas por Congreso Joven, 9 nov. 2026) ──
  {
    slug: "fabrizio-esquivel-obregon",
    fullName: "Fabrizio Manuel Toribio Esquivel-Obregón Arias",
    photoUrl: "/images/autoridades/fabrizio-esquivel-obregon.jpg",
    verification: "internal",
    positions: [{ organ: "presidencia", title: "Presidente", periodLabel: "Período 2026–2027", current: true, verification: "internal" }],
  },
  {
    slug: "francisco-guerra",
    fullName: "Francisco Guerra",
    knownAs: "Frank Guerra",
    photoUrl: "/images/autoridades/francisco-guerra.jpg",
    verification: "verified",
    sourceUrl: `${CG}/14013/2025/1`,
    positions: [
      { organ: "coordinacion-nacional", title: "Coordinador Nacional", periodLabel: "En funciones", current: true, verification: "internal" },
      { organ: "presidencia", title: "Presidente", periodLabel: "Período 2025–2026", verification: "verified", sourceUrl: `${CG}/14013/2025/1` },
    ],
  },
  {
    slug: "carlos-david-cardenas-rivera",
    fullName: "Carlos David Cárdenas Rivera",
    verification: "internal",
    positions: [{ organ: "secretaria-general", title: "Secretario General", periodLabel: "En funciones", current: true, verification: "internal" }],
  },
  {
    slug: "nery-adrian-lucas-garcia",
    fullName: "Nery Adrián Lucas García",
    verification: "internal",
    positions: [{ organ: "vicepresidencia-planificacion", title: "Vicepresidente de Planificación", periodLabel: "En funciones", current: true, verification: "internal" }],
  },
  {
    slug: "denny-cifuentes",
    fullName: "Denny Cifuentes",
    verification: "internal",
    positions: [{ organ: "vicepresidencia-formacion", title: "Vicepresidenta de Formación Política", periodLabel: "En funciones", current: true, verification: "internal" }],
  },
  {
    slug: "cezibel-cifuentes",
    fullName: "Cezibel Cifuentes",
    verification: "internal",
    positions: [{ organ: "secretaria-actas", title: "Secretaria de Actas", periodLabel: "En funciones", current: true, verification: "internal" }],
  },
  {
    slug: "jose-pacheco",
    fullName: "José Pacheco",
    verification: "internal",
    positions: [{ organ: "secretaria-obras-sociales", title: "Secretario de Obras Sociales", periodLabel: "En funciones", current: true, verification: "internal" }],
  },
  {
    slug: "manuel-corado",
    fullName: "Manuel Corado",
    verification: "internal",
    positions: [{ organ: "comision-educacion", title: "Director de la Comisión de Educación", periodLabel: "En funciones", current: true, verification: "internal" }],
  },
  {
    slug: "jimmy-de-leon",
    fullName: "Jimmy de León",
    verification: "internal",
    positions: [{ organ: "comision-cultura", title: "Director de la Comisión de Cultura", periodLabel: "En funciones", current: true, verification: "internal" }],
  },

  // ── Ocultas por indicación de Congreso Joven (9 nov. 2026): no se publican; se conservan archivadas ──
  {
    slug: "natalia-espineira",
    fullName: "Natalia Espiñeira",
    knownAs: "Nath Espiñeira",
    photoUrl: "/images/autoridades/natalia-espineira.jpg",
    verification: "verified",
    sourceUrl: `${CG}/12752/2025/1`,
    public: false,
    archived: true,
    positions: [{ organ: "presidencia", title: "Presidenta", periodLabel: "Período 2024–2025", verification: "verified", sourceUrl: `${CG}/12752/2025/1` }],
  },
  {
    slug: "kevin-bin",
    fullName: "Kevin Bin",
    photoUrl: "/images/autoridades/kevin-bin.jpg",
    verification: "internal",
    public: false,
    archived: true,
    positions: [{ organ: "presidencia", title: "Presidente", periodLabel: "Período 2023–2024", verification: "internal" }],
  },
  {
    slug: "gustavo-casimiro",
    fullName: "Gustavo Casimiro",
    verification: "verified",
    sourceUrl: `${CG}/14013/2025/1`,
    public: false,
    archived: true,
    positions: [{ organ: "vicepresidencias", title: "Vicepresidencia", periodLabel: "Registrado el 25 de julio de 2025", verification: "verified", sourceUrl: `${CG}/14013/2025/1` }],
  },
  {
    slug: "hector-peche",
    fullName: "Héctor Peche",
    verification: "verified",
    sourceUrl: `${CG}/14013/2025/1`,
    public: false,
    archived: true,
    positions: [{ organ: "vicepresidencia-planificacion", title: "Vicepresidencia de Planificación", periodLabel: "Registrado el 25 de julio de 2025", verification: "verified", sourceUrl: `${CG}/14013/2025/1` }],
  },
];
export { INSTITUCIONAL };

type TL = {
  date?: string;
  dateLabel?: string;
  title: string;
  summary: string;
  category: string;
  organizer?: "congreso_joven" | "congreso_republica" | "coorganizado" | "otro";
  people?: string[];
  sourceUrl?: string;
  sourceLabel?: string;
  verification: "verified" | "internal" | "pending";
  showInCongress?: boolean;
  public?: boolean;
};

/**
 * Nota: `date` ordena la cronología; cuando solo se conoce el período, se usa el 1 de enero del año
 * de inicio y lo que se muestra es `dateLabel`.
 */
export const TIMELINE: TL[] = [
  {
    date: "2023-01-01",
    dateLabel: "Período 2023–2024",
    title: "Presidencia de Kevin Bin",
    summary: "Primera presidencia registrada de Congreso Joven.",
    category: "autoridades",
    organizer: "congreso_joven",
    people: ["Kevin Bin"],
    sourceLabel: "Registro institucional",
    verification: "internal",
  },
  {
    date: "2024-01-01",
    dateLabel: "Período 2024–2025",
    title: "Presidencia de Natalia Espiñeira",
    summary: "Natalia «Nath» Espiñeira preside Congreso Joven durante el período 2024–2025.",
    category: "autoridades",
    organizer: "congreso_joven",
    people: ["Natalia Espiñeira"],
    sourceLabel: "Registro institucional",
    verification: "internal",
  },
  {
    date: "2025-01-01",
    dateLabel: "Período 2025–2026",
    title: "Presidencia de Frank Guerra",
    summary: "Francisco «Frank» Guerra preside Congreso Joven durante el período 2025–2026.",
    category: "autoridades",
    organizer: "congreso_joven",
    people: ["Francisco Guerra"],
    sourceLabel: "Registro institucional",
    verification: "internal",
  },
  {
    date: "2026-11-01",
    dateLabel: "2026",
    title: "Presidencia de Fabrizio Esquivel-Obregón",
    summary:
      "Fabrizio Manuel Toribio Esquivel-Obregón Arias, electo para el período 2026–2027, asume la presidencia de Congreso Joven. Frank Guerra, presidente del período anterior, pasa a la Coordinación Nacional.",
    category: "autoridades",
    organizer: "congreso_joven",
    people: ["Fabrizio Manuel Toribio Esquivel-Obregón Arias", "Francisco «Frank» Guerra"],
    sourceLabel: "Registro institucional",
    verification: "internal",
  },
  {
    dateLabel: "Octubre 2024",
    date: "2024-10-01",
    title: "Primeras bancadas registradas",
    summary:
      "Se registran las bancadas «Jóvenes por Guatemala» y «Generación que impacta». Según el registro institucional, 104 jóvenes fueron electos en línea con representación de 22 departamentos.",
    category: "generacion",
    organizer: "congreso_joven",
    sourceLabel: "Registro institucional",
    verification: "internal",
  },
  {
    date: "2025-02-05",
    title: "Conversatorio y recorrido por el Palacio Legislativo",
    summary:
      "Encuentro con el diputado Vasny Maldonado Alonzo sobre empleo, emprendimiento y educación financiera. Participó Natalia Espiñeira como presidenta de Congreso Joven.",
    category: "legislativo",
    organizer: "otro",
    people: ["Natalia Espiñeira", "Dip. Vasny Maldonado Alonzo", "Nelson Aguilar (Desafío Joven)"],
    sourceUrl: `${CG}/12752/2025/1`,
    sourceLabel: "Congreso de la República",
    verification: "verified",
    showInCongress: true,
  },
  {
    date: "2025-04-30",
    title: "Gestión de un simulacro de sesión plenaria",
    summary:
      "En una reunión con el diputado Vasny Maldonado Alonzo se planteó un evento con Congreso Joven para simular una sesión plenaria el 25 de junio, sujeto a autorización.",
    category: "legislativo",
    organizer: "otro",
    people: ["Dip. Vasny Maldonado Alonzo", "Kevin Agustín Bin (Desafío Joven)"],
    sourceUrl: `${CG}/13381/2025/1`,
    sourceLabel: "Congreso de la República",
    verification: "verified",
    showInCongress: true,
  },
  {
    date: "2025-07-25",
    title: "Conversatorio «Desafío Joven: Retos y Oportunidades»",
    summary:
      "Impulsado por representantes de Congreso Joven junto al diputado Julio Portillo. Los jóvenes presentaron propuestas de iniciativas de ley sobre educación, salud, empleo, becas y seguridad alimentaria.",
    category: "legislativo",
    organizer: "congreso_joven",
    people: [
      "Francisco Guerra (presidente)",
      "Gustavo Casimiro (vicepresidente)",
      "Héctor Peche (vicepresidente de planificación)",
      "Dip. Julio Portillo",
    ],
    sourceUrl: `${CG}/14013/2025/1`,
    sourceLabel: "Congreso de la República",
    verification: "verified",
    showInCongress: true,
  },
  {
    date: "2025-09-04",
    title: "«La Educación como poder: Hablemos claro»",
    summary:
      "Diálogo con el diputado Nery Rodas y 45 estudiantes universitarios sobre inversión educativa, pensum y brecha rural. El diputado propuso a Congreso Joven formular una iniciativa de ley sobre educación.",
    category: "legislativo",
    organizer: "otro",
    people: ["Dip. Nery Rodas"],
    sourceUrl: `${CG}/14305/2025/1`,
    sourceLabel: "Congreso de la República",
    verification: "verified",
    showInCongress: true,
  },
  {
    date: "2026-04-30",
    title: "Diálogo sobre participación cívica, liderazgo juvenil y procesos legislativos",
    summary:
      "Recibidos en el Congreso como parte de la política de puertas abiertas de la X Legislatura. Congreso Joven expuso avances en formación en inglés y herramientas tecnológicas.",
    category: "parlamento",
    organizer: "congreso_republica",
    people: [
      "Dip. Nery Ramos y Ramos (primer vicepresidente del Congreso)",
      "Dip. Karina Paz",
      "Dip. Evelyn Morataya",
      "Dip. Darwin Lucas",
      "Dip. Vasny Maldonado Alonzo",
    ],
    sourceUrl: `${CG}/15927/2026/1`,
    sourceLabel: "Congreso de la República",
    verification: "verified",
    showInCongress: true,
  },
  {
    date: "2026-06-11",
    title: "Conversatorio sobre el proceso legislativo",
    summary:
      "El diputado Mynor de la Rosa explicó a representantes de Congreso Joven la formación de leyes, el trabajo en comisiones y el Presupuesto General.",
    category: "legislativo",
    organizer: "otro",
    people: ["Dip. Mynor de la Rosa"],
    sourceUrl: `${CG}/16270/2026/1`,
    sourceLabel: "Congreso de la República",
    verification: "verified",
    showInCongress: true,
  },
];

export const PROJECTS = [
  {
    slug: "parlamento-juvenil-2026",
    name: "Parlamento Juvenil 2026",
    summary: "Encuentro legislativo juvenil realizado el 30 de abril de 2026.",
    startDate: "2026-04-30",
    featured: true,
    facts: [
      { label: "Fecha", value: "30 de abril de 2026", verification: "internal" },
      { label: "Participantes", value: "Más de 128 jóvenes", verification: "internal" },
    ],
  },
  {
    slug: "proyecto-6001-promocion",
    name: "Proyecto 6001 Promoción",
    summary:
      "Programa de apoyo educativo: inglés gratuito en centros educativos públicos, formación en herramientas tecnológicas y certificación en Microsoft Word y Excel.",
    featured: true,
    objectives: [
      "Enseñanza gratuita de inglés en centros educativos públicos.",
      "Formación en herramientas tecnológicas.",
      "Certificación en Microsoft Word y Excel.",
    ],
    facts: [],
  },
  {
    slug: "formacion-politica",
    name: "Formación Política",
    summary: "Cursos, seminarios, talleres y conferencias sobre el funcionamiento del Estado y la participación democrática.",
    featured: false,
    facts: [],
  },
  {
    slug: "obras-sociales",
    name: "Obras Sociales",
    summary: "Archivo de proyectos sociales y actividades comunitarias.",
    featured: false,
    facts: [],
  },
];

export const ENGAGEMENTS = [
  {
    slug: "mexico-parlamento-juvenil-internacional",
    name: "Parlamento Juvenil Internacional del Senado de México",
    country: "México",
    host: "Senado de la República (México)",
    startDate: "2026-11-13",
    endDate: "2026-11-16",
    status: "pospuesto" as const,
    statusNote: "La participación prevista del 13 al 16 de noviembre de 2026 fue pospuesta. Nueva fecha por confirmar.",
    summary: "Participación proyectada de una delegación de Congreso Joven Guatemala.",
    delegation: [],
  },
  {
    slug: "panama-iv-foro-jovenes-lideres",
    name: "IV Foro de Jóvenes Líderes Políticos Panamericano",
    country: "Panamá",
    host: null,
    startDate: "2026-12-02",
    endDate: "2026-12-06",
    status: "proyectado" as const,
    statusNote: "Participación proyectada. Aún no se ha realizado.",
    summary: "Delegación propuesta de Congreso Joven Guatemala al foro panamericano de liderazgo político juvenil.",
    delegation: [
      { name: "Eric Francisco Guerra", verification: "internal" },
      { name: "Carlos David Cárdenas Rivera", verification: "internal" },
    ],
    costNote: "Paquete ejecutivo comunicado inicialmente: USD 700 por persona.",
  },
];

/** Cifras de portada: cada una con fecha y fuente. Editables en Configuración. */
export const STATS = [
  { value: "2,000", label: "Jóvenes en la comunidad activa", note: "Registro institucional · nov. 2026", verification: "internal" },
  { value: "22", label: "Departamentos representados", note: "Registro institucional · 2024", verification: "internal" },
  { value: "128+", label: "Participantes en el Parlamento Juvenil", note: "Registro institucional · 30 abr 2026", verification: "internal" },
  { value: "928", label: "Personas en el padrón electoral de referencia", note: "Registro institucional · fecha por confirmar", verification: "internal" },
];

/** Contenido pendiente, solicitado por etapas. */
export const CONTENT_REQUESTS: { stage: number; section: string; item: string; detail: string; usedIn: string; status?: "pendiente" | "recibido" | "completado" }[] = [
  { stage: 2, section: "Estructura", item: "Organigrama oficial de la Estructura Nacional", detail: "Recibido en noviembre de 2026.", usedIn: "Organigrama", status: "completado" },
  { stage: 2, section: "Estructura", item: "Presidencias históricas y presidencia vigente", detail: "Recibido: 2023–2024, 2024–2025, 2025–2026 y 2026–2027 (en funciones). Frank Guerra: Coordinación Nacional.", usedIn: "Galería de presidentes", status: "completado" },
  { stage: 2, section: "Estructura", item: "Fotografías originales en alta resolución de los presidentes", detail: "Las fotos actuales son recortes de baja resolución de piezas gráficas.", usedIn: "Galería de presidentes y fichas" },
  { stage: 2, section: "Estructura", item: "Integrantes vigentes por cargo (primer grupo)", detail: "Recibido: Secretaría General, Coordinación Nacional, VP de Planificación y de Formación Política, Secretarías de Actas y Obras Sociales, Comisiones de Educación y Cultura.", usedIn: "Organigrama y fichas", status: "completado" },
  { stage: 2, section: "Estructura", item: "Cargos aún sin titular", detail: "VP de Relaciones Externas, Secretarías de Staff y de Comunicación y Medios, Vocería Oficial, bancadas, Tribunal de Honor (presidencia, departamentos, vocales), 6 presidencias regionales, Comisiones de Salud, Medio Ambiente y Emprendimiento.", usedIn: "Organigrama" },
  { stage: 2, section: "Estructura", item: "Fotografías de las nuevas autoridades", detail: "Carlos David Cárdenas Rivera, Nery Adrián Lucas García, Denny Cifuentes, Cezibel Cifuentes, José Pacheco, Manuel Corado, Jimmy de León.", usedIn: "Autoridades en funciones y fichas" },
  { stage: 2, section: "Estructura", item: "Nombre completo de Kevin Bin", detail: "Una nota oficial del Congreso (30/04/2025) menciona a «Kevin Agustín Bin» de Desafío Joven. ¿Es la misma persona?", usedIn: "Ficha y línea de tiempo" },
  { stage: 2, section: "Estructura", item: "Fecha exacta de toma de posesión del período 2026–2027", detail: "Fabrizio ya está en funciones; falta la fecha para la línea de tiempo.", usedIn: "Línea de tiempo" },
  { stage: 2, section: "Estructura", item: "Biografías de las autoridades", detail: "Formación, departamento de procedencia, trayectoria en Congreso Joven.", usedIn: "Fichas de autoridades" },
  // Etapa 1 — Identidad y portada
  { stage: 1, section: "Identidad", item: "Logotipo oficial (SVG o PNG en alta resolución)", detail: "Versión a color, blanca y monocroma si existen.", usedIn: "Encabezado, pie, favicon, documentos" },
  { stage: 1, section: "Identidad", item: "Manual de marca o colores oficiales", detail: "Si no existe, se usa la paleta propuesta del portal.", usedIn: "Sistema de diseño" },
  { stage: 1, section: "Inicio", item: "3 a 5 fotografías institucionales de alta calidad", detail: "Horizontales, de preferencia en el Palacio Legislativo o en sesiones plenarias. Indicar crédito.", usedIn: "Hero de portada" },
  { stage: 1, section: "Conócenos", item: "Misión, visión y valores aprobados", detail: "Texto oficial vigente.", usedIn: "Conócenos" },
  { stage: 1, section: "Conócenos", item: "Fecha y circunstancias de fundación", detail: "Incluye la relación con Desafío Joven (las fuentes públicas la mencionan).", usedIn: "Historia · línea de tiempo" },
  { stage: 1, section: "Canales", item: "Redes sociales oficiales vigentes", detail: "Hay dos cuentas de Instagram (@congresojoven_gt y @congresojoven.gt). ¿Cuál es la oficial?", usedIn: "Pie y contacto" },
  // Etapa 2 — Autoridades
  { stage: 2, section: "Estructura", item: "Grafía correcta del secretario 2025", detail: "La fuente oficial escribe «Sergio Paz» y «Sergio Paiz».", usedIn: "Historial de autoridades" },
  { stage: 2, section: "Estructura", item: "Reglamento o estatutos vigentes", detail: "Para confirmar qué órganos y comisiones existen formalmente.", usedIn: "Organigrama · Documentos" },
  // Etapa 3 — Territorio
  { stage: 3, section: "Territorio", item: "Asignación de departamentos a las 6 regiones", detail: "Qué departamentos pertenecen a cada región.", usedIn: "Mapa interactivo" },
  { stage: 3, section: "Territorio", item: "Coordinaciones regionales vigentes", detail: "Solo personas confirmadas.", usedIn: "Páginas regionales" },
  // Etapa 4 — Proyectos
  { stage: 4, section: "Proyectos", item: "Parlamento Juvenil 2026: fotos, departamentos y resultados", detail: "Confirmar si coincide con el diálogo del 30/04/2026 en el Congreso.", usedIn: "Proyecto Parlamento Juvenil" },
  { stage: 4, section: "Proyectos", item: "Proyecto 6001: centros educativos, instructores y relación con la iniciativa 6001", detail: "", usedIn: "Proyecto 6001 Promoción" },
  // Etapa 5 — Internacional
  { stage: 5, section: "Internacional", item: "Invitaciones y cartas de México y Panamá", detail: "", usedIn: "Relaciones internacionales" },
  { stage: 5, section: "Internacional", item: "Alianzas formales y convenios firmados", detail: "Distinguir convenio, colaboración, contacto y participación.", usedIn: "Directorio de cooperación" },
  // Etapa 6 — Elecciones y archivo
  { stage: 6, section: "Elecciones", item: "Convocatorias, actas y resultados electorales históricos", detail: "Con fecha y fuente de los datos de 2,000 registros y padrón de 928.", usedIn: "Elecciones y democracia interna" },
];

export function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
