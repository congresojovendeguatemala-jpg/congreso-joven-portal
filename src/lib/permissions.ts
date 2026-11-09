/** RBAC por capacidades. Las rutas verifican capacidades, nunca nombres de rol. */
export const CAPABILITIES = [
  "dashboard.view",
  "applications.view",
  "applications.review",
  "applications.export",
  "articles.submit",
  "articles.review",
  "articles.publish",
  "articles.delete",
  "authors.manage",
  "org.edit",
  "people.edit",
  "territory.edit",
  "territory.edit_own",
  "projects.edit",
  "international.edit",
  "timeline.edit",
  "media.upload",
  "media.manage",
  "events.manage",
  "settings.edit",
  "users.manage",
  "audit.view",
  "content_requests.view",
] as const;

export type Capability = (typeof CAPABILITIES)[number];
export type Role =
  | "superadmin"
  | "admin_institucional"
  | "admin_comunicacion"
  | "editor_jefe"
  | "editor"
  | "autor"
  | "coordinador_regional"
  | "admin_proyectos"
  | "usuario";

export const ROLE_LABELS: Record<Role, string> = {
  superadmin: "Superadministrador",
  admin_institucional: "Administrador institucional",
  admin_comunicacion: "Administrador de comunicación",
  editor_jefe: "Editor jefe",
  editor: "Editor",
  autor: "Autor",
  coordinador_regional: "Coordinador regional",
  admin_proyectos: "Administrador de proyectos",
  usuario: "Usuario registrado",
};

const ROLE_CAPS: Record<Role, readonly Capability[] | "*"> = {
  superadmin: "*",
  admin_institucional: [
    "dashboard.view", "applications.view", "applications.review", "applications.export",
    "org.edit", "people.edit", "territory.edit", "projects.edit", "international.edit",
    "timeline.edit", "media.upload", "media.manage", "events.manage", "audit.view", "content_requests.view",
  ],
  admin_comunicacion: [
    "dashboard.view", "articles.submit", "articles.review", "articles.publish", "authors.manage",
    "media.upload", "media.manage", "events.manage", "timeline.edit", "content_requests.view",
  ],
  editor_jefe: ["dashboard.view", "articles.submit", "articles.review", "articles.publish", "articles.delete", "authors.manage", "media.upload"],
  editor: ["dashboard.view", "articles.submit", "articles.review", "media.upload"],
  autor: ["articles.submit"],
  coordinador_regional: ["dashboard.view", "territory.edit_own", "media.upload", "events.manage"],
  admin_proyectos: ["dashboard.view", "projects.edit", "media.upload", "events.manage", "content_requests.view"],
  usuario: [],
};

export function can(role: Role | null | undefined, cap: Capability): boolean {
  if (!role) return false;
  const caps = ROLE_CAPS[role];
  return caps === "*" || caps.includes(cap);
}
