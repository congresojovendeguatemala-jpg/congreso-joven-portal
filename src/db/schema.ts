import {
  pgTable,
  pgEnum,
  text,
  integer,
  boolean,
  timestamp,
  date,
  jsonb,
  uuid,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/* ───────────── Enums ───────────── */

export const roleEnum = pgEnum("role", [
  "superadmin",
  "admin_institucional",
  "admin_comunicacion",
  "editor_jefe",
  "editor",
  "autor",
  "coordinador_regional",
  "admin_proyectos",
  "usuario",
]);

/** Nivel de verificación de un dato institucional. */
export const verificationEnum = pgEnum("verification", ["verified", "internal", "pending"]);

export const applicationTypeEnum = pgEnum("application_type", [
  "integrante",
  "voluntario",
  "autor",
  "participante",
  "delegado",
  "cooperacion",
  "contacto",
  "propuesta",
]);

export const applicationStatusEnum = pgEnum("application_status", [
  "recibida",
  "en_revision",
  "info_solicitada",
  "aprobada",
  "rechazada",
  "archivada",
]);

export const articleStatusEnum = pgEnum("article_status", [
  "borrador",
  "enviado",
  "en_revision",
  "requiere_correcciones",
  "aprobado",
  "programado",
  "publicado",
  "archivado",
]);

export const engagementStatusEnum = pgEnum("engagement_status", [
  "proyectado",
  "confirmado",
  "pospuesto",
  "realizado",
  "cancelado",
]);

export const partnerKindEnum = pgEnum("partner_relation", [
  "convenio_firmado",
  "colaboracion",
  "contacto",
  "participacion_evento",
]);

export const organizerEnum = pgEnum("organizer", [
  "congreso_joven",
  "congreso_republica",
  "coorganizado",
  "otro",
]);

export const requestStatusEnum = pgEnum("request_status", ["pendiente", "recibido", "completado"]);

/* ───────────── Usuarios, sesiones, auditoría ───────────── */

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("usuario"),
  regionId: integer("region_id"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});

export const sessions = pgTable("sessions", {
  /** SHA-256 del token; el token en claro solo vive en la cookie. */
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLog = pgTable(
  "audit_log",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    detail: jsonb("detail"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_created_idx").on(t.createdAt)],
);

/* ───────────── Configuración ───────────── */

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ───────────── Territorio ───────────── */

export const regions = pgTable("regions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const departments = pgTable("departments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  /** Asignación a región: nula hasta que Congreso Joven la confirme. */
  regionId: integer("region_id").references(() => regions.id, { onDelete: "set null" }),
  /** Posición en el cartograma de mosaicos (columna, fila). */
  tileX: integer("tile_x").notNull(),
  tileY: integer("tile_y").notNull(),
  description: text("description"),
});

export const municipalities = pgTable("municipalities", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  departmentId: integer("department_id")
    .notNull()
    .references(() => departments.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
});

/* ───────────── Personas y estructura ───────────── */

export const people = pgTable("people", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: text("slug").notNull().unique(),
  fullName: text("full_name").notNull(),
  /** Nombre de uso público, p. ej. "Frank Guerra". */
  knownAs: text("known_as"),
  photoUrl: text("photo_url"),
  photoCredit: text("photo_credit"),
  bio: text("bio"),
  departmentId: integer("department_id").references(() => departments.id, { onDelete: "set null" }),
  education: text("education"),
  trajectory: text("trajectory"),
  socials: jsonb("socials").$type<Record<string, string>>(),
  verification: verificationEnum("verification").notNull().default("pending"),
  sourceUrl: text("source_url"),
  public: boolean("public").notNull().default(true),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const organs = pgTable("organs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  /** asamblea | junta | presidencia | vicepresidencia | secretaria | tribunal | comision | coordinacion | direccion */
  kind: text("kind").notNull(),
  parentId: integer("parent_id"),
  description: text("description"),
  functions: text("functions"),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  /** Falso = estructura de referencia, aún no confirmada en el reglamento vigente. */
  confirmed: boolean("confirmed").notNull().default(false),
});

export const positions = pgTable("positions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  personId: integer("person_id")
    .notNull()
    .references(() => people.id, { onDelete: "cascade" }),
  organId: integer("organ_id").references(() => organs.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  periodStart: date("period_start"),
  periodEnd: date("period_end"),
  periodLabel: text("period_label"),
  current: boolean("current").notNull().default(false),
  /** Electo para un período que aún no inicia. */
  elect: boolean("elect").notNull().default(false),
  verification: verificationEnum("verification").notNull().default("pending"),
  sourceUrl: text("source_url"),
  sortOrder: integer("sort_order").notNull().default(0),
});

/* ───────────── Postulaciones (todas las modalidades) ───────────── */

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: applicationTypeEnum("type").notNull(),
    status: applicationStatusEnum("status").notNull().default("recibida"),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    departmentId: integer("department_id").references(() => departments.id, { onDelete: "set null" }),
    /** Campos específicos de cada modalidad. */
    data: jsonb("data").$type<Record<string, unknown>>().notNull(),
    privacyAccepted: boolean("privacy_accepted").notNull(),
    photoConsent: boolean("photo_consent").notNull().default(false),
    reviewerNotes: text("reviewer_notes"),
    history: jsonb("history")
      .$type<{ at: string; by: string | null; status: string; note?: string }[]>()
      .notNull()
      .default([]),
    ipHash: text("ip_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("applications_type_status_idx").on(t.type, t.status)],
);

/* ───────────── Editorial ───────────── */

export const categories = pgTable("categories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const authors = pgTable("authors", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: text("slug").notNull().unique(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  photoUrl: text("photo_url"),
  bio: text("bio"),
  socials: jsonb("socials").$type<Record<string, string>>(),
});

export const articles = pgTable(
  "articles",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    authorId: integer("author_id").references(() => authors.id, { onDelete: "set null" }),
    categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
    coverUrl: text("cover_url"),
    /** Documento TipTap (JSON). */
    content: jsonb("content"),
    contentText: text("content_text"),
    sources: text("sources"),
    authorshipDeclared: boolean("authorship_declared").notNull().default(false),
    status: articleStatusEnum("status").notNull().default("borrador"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    readingMinutes: integer("reading_minutes"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("articles_status_pub_idx").on(t.status, t.publishedAt)],
);

export const articleReviews = pgTable("article_reviews", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  articleId: integer("article_id")
    .notNull()
    .references(() => articles.id, { onDelete: "cascade" }),
  reviewerId: uuid("reviewer_id").references(() => users.id, { onDelete: "set null" }),
  fromStatus: articleStatusEnum("from_status").notNull(),
  toStatus: articleStatusEnum("to_status").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ───────────── Proyectos, internacional, alianzas ───────────── */

export const projects = pgTable("projects", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  summary: text("summary"),
  body: text("body"),
  objectives: jsonb("objectives").$type<string[]>(),
  /** Bloques adicionales configurables: participantes, centros, resultados, testimonios… */
  facts: jsonb("facts").$type<{ label: string; value: string; verification: string; source?: string }[]>(),
  coverUrl: text("cover_url"),
  startDate: date("start_date"),
  active: boolean("active").notNull().default(true),
  featured: boolean("featured").notNull().default(false),
  verification: verificationEnum("verification").notNull().default("internal"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const engagements = pgTable("international_engagements", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  host: text("host"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  status: engagementStatusEnum("status").notNull().default("proyectado"),
  statusNote: text("status_note"),
  summary: text("summary"),
  objectives: jsonb("objectives").$type<string[]>(),
  delegation: jsonb("delegation").$type<{ name: string; role?: string; verification: string }[]>(),
  program: text("program"),
  results: text("results"),
  learnings: text("learnings"),
  costNote: text("cost_note"),
  verification: verificationEnum("verification").notNull().default("internal"),
});

export const partners = pgTable("partners", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  country: text("country"),
  description: text("description"),
  /** organizacion_juvenil | parlamento_juvenil | internacional | fundacion | universidad | red | plataforma */
  kind: text("kind"),
  relation: partnerKindEnum("relation").notNull().default("contacto"),
  since: date("since"),
  public: boolean("public").notNull().default(false),
});

/* ───────────── Historia y relación con el Congreso ───────────── */

export const timelineEvents = pgTable(
  "timeline_events",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    date: date("date"),
    /** Para fechas imprecisas: "2024", "Octubre 2024". */
    dateLabel: text("date_label"),
    title: text("title").notNull(),
    summary: text("summary"),
    /** fundacion | generacion | autoridades | territorio | elecciones | parlamento | legislativo | social | internacional */
    category: text("category").notNull(),
    organizer: organizerEnum("organizer"),
    people: jsonb("people").$type<string[]>(),
    sourceUrl: text("source_url"),
    sourceLabel: text("source_label"),
    imageUrl: text("image_url"),
    verification: verificationEnum("verification").notNull().default("pending"),
    public: boolean("public").notNull().default(true),
    showInCongress: boolean("show_in_congress").notNull().default(false),
  },
  (t) => [index("timeline_date_idx").on(t.date)],
);

/* ───────────── Eventos ───────────── */

export const events = pgTable("events", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  summary: text("summary"),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  location: text("location"),
  /** Texto largo del evento (párrafos separados por línea en blanco). */
  body: text("body"),
  /** Afiches e imágenes del evento (URLs). La primera es la principal. */
  images: jsonb("images").$type<string[]>(),
  /** Conferencistas e invitados: nombre, cargo y grupo («Conferencista», «Diputados»…). */
  speakers: jsonb("speakers").$type<{ name: string; role: string; group: string }[]>(),
  registrationOpen: boolean("registration_open").notNull().default(false),
  capacity: integer("capacity"),
  published: boolean("published").notNull().default(false),
});

export const registrationStatusEnum = pgEnum("registration_status", ["confirmado", "asistio", "cancelado"]);

/**
 * Confirmaciones de asistencia a eventos. Contienen datos personales (DPI incluido):
 * nunca se muestran en el sitio público; solo en el panel, con la capacidad events.manage.
 */
export const eventRegistrations = pgTable(
  "event_registrations",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    firstNames: text("first_names").notNull(),
    lastNames: text("last_names").notNull(),
    /** CUI del DPI, 13 dígitos sin espacios. */
    dpi: text("dpi").notNull(),
    institution: text("institution").notNull(),
    age: integer("age").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    status: registrationStatusEnum("status").notNull().default("confirmado"),
    privacyAccepted: boolean("privacy_accepted").notNull(),
    photoConsent: boolean("photo_consent").notNull().default(false),
    ipHash: text("ip_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  // Una persona (DPI) solo puede confirmar una vez por evento.
  (t) => [uniqueIndex("event_registrations_event_dpi_uq").on(t.eventId, t.dpi), index("event_registrations_event_idx").on(t.eventId)],
);

/* ───────────── Multimedia y documentos ───────────── */

/** Álbumes de fotos (galerías de eventos, generaciones, actividades). */
export const galleries = pgTable("galleries", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  date: date("date"),
  category: text("category"),
  coverUrl: text("cover_url"),
  public: boolean("public").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Archivo multimedia: fotografías (subidas), videos (enlaces de YouTube) y documentos (PDF).
 * Los metadatos permiten buscar por año, persona, cargo, departamento, evento y categoría.
 */
export const media = pgTable(
  "media",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    kind: text("kind").notNull(), // image | video | document
    url: text("url").notNull(),
    title: text("title"),
    caption: text("caption"),
    credit: text("credit"),
    year: integer("year"),
    date: date("date"),
    /** eventos | autoridades | generaciones | territorial | congreso | internacional | institucional */
    category: text("category"),
    /** Para documentos: estatutos | reglamento | codigo | acta | informe | convocatoria | memoria | reconocimiento | resultados | otro */
    docType: text("doc_type"),
    eventName: text("event_name"),
    people: jsonb("people").$type<string[]>(),
    tags: jsonb("tags").$type<string[]>(),
    galleryId: integer("gallery_id").references(() => galleries.id, { onDelete: "set null" }),
    departmentId: integer("department_id").references(() => departments.id, { onDelete: "set null" }),
    mime: text("mime"),
    bytes: integer("bytes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    public: boolean("public").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("media_kind_public_idx").on(t.kind, t.public), index("media_gallery_idx").on(t.galleryId)],
);

/** Reservadas para un catálogo de etiquetas normalizado; hoy las etiquetas viven en media.tags (jsonb). */
export const tags = pgTable("tags", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
});

export const mediaTags = pgTable(
  "media_tags",
  {
    mediaId: integer("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.mediaId, t.tagId] })],
);

/* ───────────── Contenido pendiente ───────────── */

export const contentRequests = pgTable(
  "content_requests",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    section: text("section").notNull(),
    item: text("item").notNull(),
    detail: text("detail"),
    usedIn: text("used_in"),
    stage: integer("stage").notNull().default(1),
    status: requestStatusEnum("status").notNull().default("pendiente"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("content_requests_item_uq").on(t.section, t.item)],
);
