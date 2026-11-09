# Arquitectura — Portal Congreso Joven Guatemala

## 1. Auditoría del entorno (9 nov 2026)
| Herramienta | Estado inicial | Acción |
|---|---|---|
| Node.js | No instalado | Instalado Node 22 LTS (winget) |
| Git | No instalado | Instalado (winget) |
| Docker / PostgreSQL | No instalados | Se usa PGlite (Postgres embebido) en desarrollo |
| Python | No instalado | No se necesita |
| Disco | ~750 GB libres | — |

## 2. Decisiones

| Capa | Elección | Por qué |
|---|---|---|
| Framework | **Next.js 15 (App Router) + React 19 + TypeScript** | Server Components y Server Actions: formularios y panel sin escribir una API aparte, SSR/ISR para SEO. |
| Estilos | **Tailwind CSS v4** con tokens propios | Sistema de diseño en variables CSS, sin depender de una plantilla. |
| Base de datos | **PostgreSQL**. En desarrollo, **PGlite** (Postgres compilado a WASM dentro del proceso) | La máquina no tiene Docker ni Postgres; PGlite usa el mismo dialecto SQL que producción, así que no hay diferencias entre SQLite y Postgres. En producción, Supabase, Neon o cualquier Postgres. |
| ORM | **Drizzle ORM** | Tiene drivers nativos para PGlite y para node-postgres, esquema en TypeScript, migraciones SQL legibles y sin binarios nativos (Prisma necesita un motor binario y no admite PGlite de forma estable). |
| Autenticación | **Sesiones propias en base de datos** + **bcryptjs** | Para un panel con 10 roles y auditoría, una sesión en BD con cookie `httpOnly` revocable es más simple y auditable que un JWT. Las contraseñas solo se guardan como hash bcrypt. |
| Permisos | **RBAC por capacidades** (`src/lib/permissions.ts`) | Cada rol es una lista de capacidades (`org.edit`, `articles.publish`…). Las rutas y acciones verifican capacidades, nunca nombres de rol. |
| Validación | **Zod** | El mismo esquema valida el cliente y el servidor. |
| Antispam | Honeypot + tiempo mínimo de llenado + límite por IP; preparado para Cloudflare Turnstile (`TURNSTILE_SECRET`) | Funciona sin claves externas; Turnstile se activa cuando estén las credenciales. |
| Archivos | Interfaz `Storage` con driver **local** (dev) y **S3-compatible** (prod: R2, S3, Supabase Storage) | Cambio por variable de entorno. |
| Editor | **TipTap** (fase 6) | Contenido estructurado en JSON, extensible (galerías, citas, documentos). |
| Mapa | **Cartograma de mosaicos** de los 22 departamentos (SVG propio) | Legible en móvil, accesible por teclado y fiel a la estética del hemiciclo. Se puede cambiar por geometría real (GeoJSON) sin tocar los datos. |
| Animación | CSS y `IntersectionObserver`; Framer Motion solo donde aporte | Menos JavaScript enviado al navegador. |

## 3. Principios de contenido
1. **Nada inventado.** Las entidades con datos institucionales tienen `verification` (`verified`, `internal`, `pending`) y `sourceUrl`. Las vistas públicas muestran el nivel cuando no es `verified`.
2. **Estados configurables.** Órganos, comisiones y regiones tienen `active` y `confirmed`. Los eventos internacionales tienen `status` (`proyectado`, `confirmado`, `pospuesto`, `realizado`, `cancelado`).
3. **Contenido pendiente.** La tabla `content_requests` lista lo que falta (fotos, biografías, documentos) con la sección donde se usa. El panel la muestra como lista de tareas; el sitio muestra placeholders elegantes y marcados.

## 4. Módulos y rutas

```
/                       Inicio
/conocenos              Quiénes somos, historia (línea de tiempo), principios, transparencia
/estructura             Organigrama interactivo, Junta Directiva, Tribunal de Honor, comisiones
/estructura/[slug]      Ficha de autoridad
/territorio             Mapa interactivo y regiones
/territorio/[region]    Página regional
/participa              Las 6 modalidades de participación
/participa/[modalidad]  Formulario independiente para cada modalidad
/actualidad             Medio editorial (nombre configurable)
/actualidad/[slug]      Artículo
/autores/[slug]         Perfil público de autor
/proyectos, /proyectos/[slug]
/internacional, /internacional/[slug]
/congreso               Cronología de relaciones con el Congreso de la República
/elecciones             Democracia interna (documentación, no votación en vivo)
/archivo                Galería, videoteca, documentos y búsqueda por metadatos
/eventos                Calendario e inscripciones
/contacto, /privacidad, /terminos
/admin/**               Panel privado (protegido por middleware y capacidades)
```

## 5. Modelo de datos (resumen)
`users`, `sessions`, `audit_log` · `people` (personas públicas: autoridades, autores) · `organs` (árbol de órganos con `parentId`, `kind`, `active`, `confirmed`) · `positions` (persona + órgano + cargo + período) · `regions`, `departments`, `municipalities` · `applications` (postulaciones de las 6 modalidades, `type` + `data` JSON + estado + historial) · `articles`, `categories`, `article_reviews` · `projects` · `international_engagements` · `partners` · `timeline_events` · `events`, `event_registrations` · `media`, `documents`, `tags` · `content_requests` · `settings` (clave/valor: nombre del medio, cifras, redes).

## 6. Seguridad
- Cookie de sesión `httpOnly`, `secure`, `sameSite=lax`; el token se guarda hasheado (SHA-256) en la BD.
- Todas las Server Actions del panel llaman a `requireCapability()`.
- Auditoría: cada mutación administrativa escribe en `audit_log` (quién, qué, antes/después).
- Los datos de postulantes nunca se exponen en rutas públicas; la exportación exige la capacidad `applications.export` y queda registrada.
- Secretos solo en `.env.local` (ignorado por Git); `.env.example` documenta las variables.
- El seed de desarrollo no contiene datos personales de integrantes reales.
