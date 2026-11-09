# Portal Congreso Joven Guatemala

Portal institucional, plataforma de participación y panel administrativo de Congreso Joven Guatemala.

- Arquitectura y decisiones técnicas: [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md)
- Archivo de investigación y verificación: [docs/INVESTIGACION.md](docs/INVESTIGACION.md)
- Despliegue: [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md)
- Manual básico de administración: [docs/MANUAL-ADMIN.md](docs/MANUAL-ADMIN.md)

## Puesta en marcha local (Windows)

Requisitos: Node.js 22+ (probado con Node 26) y Git.

```powershell
npm install
copy .env.example .env.local     # y ajustar valores
npm run db:setup                 # crea tablas y carga datos iniciales verificados
npm run admin:create -- correo@dominio.org "Nombre Apellido"
npm run dev                      # http://localhost:3000
```

> **Importante en Windows con OneDrive:** la base local (PGlite) debe vivir **fuera** de OneDrive.
> Define `PGLITE_DIR` en `.env.local`, por ejemplo `C:/Users/<usuario>/AppData/Local/congreso-joven/pglite`.
> La sincronización de OneDrive corrompe una base de datos abierta. Conviene excluir también `node_modules` de la sincronización.
>
> PGlite admite **un solo proceso a la vez**: detén `npm run dev` antes de ejecutar `db:setup`, `db:seed` o `admin:create`.

## Scripts

| Script | Uso |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Compilación y servidor de producción |
| `npm run typecheck` | Verificación de tipos |
| `npm run db:generate` | Genera una migración SQL tras cambiar `src/db/schema.ts` |
| `npm run db:setup` | Aplica migraciones y carga datos iniciales (idempotente) |
| `npm run db:reset` | Solo desarrollo: borra la base PGlite local y la vuelve a crear (se niega a correr contra PostgreSQL) |
| `npm run admin:create -- <correo> "<nombre>"` | Crea o restablece un superadministrador con contraseña aleatoria |

## Estructura

```
src/
  app/(site)/        páginas públicas
  app/admin/         panel privado (ingreso, resumen, postulaciones, pendientes, auditoría)
  components/        UI (hemiciclo, mapa, formularios, línea de tiempo)
  db/                esquema Drizzle, conexión, migraciones y datos iniciales
  lib/               autenticación, permisos, antispam, modalidades, auditoría
drizzle/             migraciones SQL generadas
docs/                documentación
```

## Estado por fases

| Fase | Estado |
|---|---|
| 1. Investigación y arquitectura | ✅ |
| 2. Diseño visual y navegación | ✅ base (pendiente: logotipo y fotografías oficiales) |
| 3. Base de datos y autenticación | ✅ |
| 4. Página pública | ✅ todas las secciones |
| 5. Organigrama y territorio | ✅ organigrama oficial (nov. 2026), presidencias, mapa · ✅ edición desde el panel |
| 6. Sistema editorial | ✅ editor visual TipTap, 8 estados con permisos por rol, correcciones con comentario, publicación programada, perfiles de autor, artículos relacionados, SEO (metadatos, JSON-LD, sitemap, robots) |
| 7. Formularios y postulaciones | ✅ 8 formularios, validación, antispam, revisión con historial · ⏳ correo de notificación (requiere credenciales) |
| 8. Proyectos e internacional | ✅ visualización y edición desde el panel |
| 9. Panel administrativo | ✅ resumen, postulaciones, pendientes, auditoría, personas y cargos, órganos, línea de tiempo, regiones, departamentos, proyectos, eventos, internacional, alianzas, configuración, usuarios |
| 10. Galería y archivo | ✅ subida múltiple con verificación de tipo, álbumes, galería con visor, videoteca (YouTube sin cookies), biblioteca de documentos, búsqueda unificada por persona, evento, año, categoría y departamento · ⏳ almacenamiento S3 para producción |
| 11. Seguridad y pruebas | ✅ sesiones, RBAC, auditoría, cabeceras · ⏳ pruebas automatizadas |
| 12. Despliegue y documentación | ✅ documentación · ⏳ despliegue (requiere cuentas) |
