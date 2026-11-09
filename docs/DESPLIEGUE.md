# Despliegue

## Configuración actual (noviembre de 2026)

| Pieza | Servicio | Detalle |
|---|---|---|
| Código | GitHub | Repositorio privado `congresojovendeguatemala-jpg/congreso-joven-portal`, rama `main` |
| Sitio | Vercel | Proyecto `congreso-joven-portal`, región `iad1`, https://congreso-joven-portal.vercel.app |
| Base de datos | Neon (PostgreSQL), integración del Marketplace de Vercel | Variables `DATABASE_URL` / `POSTGRES_URL` puestas por la integración |
| Archivos | Vercel Blob, store `congreso-joven-archivos` (público) | Variable `BLOB_READ_WRITE_TOKEN`, solo en Production y Preview |

**Publicar cambios:** basta con `git push` a `main`. Vercel ejecuta `npm run vercel-build`, que:
1. aplica las migraciones pendientes (`drizzle/`),
2. ejecuta la carga inicial **solo si nunca se ejecutó** en esa base (marca `seed.version`),
3. compila el sitio.

Cada rama distinta de `main` genera una vista previa (*Preview*). **Atención:** la integración de Neon conecta también las vistas previas a la misma base de producción. No pruebes datos destructivos en una vista previa.

## Variables de entorno en Vercel
| Variable | Entornos | Origen |
|---|---|---|
| `DATABASE_URL`, `POSTGRES_URL`, … | todos | Integración Neon |
| `BLOB_READ_WRITE_TOKEN` | Production, Preview | Vercel Blob |
| `IP_SALT` | Production (secreta) | Generada al azar |
| `NEXT_PUBLIC_SITE_URL` | Production | `https://congreso-joven-portal.vercel.app` (cambiar al conectar un dominio propio) |

## Tareas de administración sobre la base de producción
Desde la carpeta del proyecto, con la sesión de Vercel iniciada (`vercel login`):

```powershell
$env:USE_REMOTE_DB = '1'; vercel env run -e production -- npm run admin:create -- correo@dominio.org "Nombre"; $env:USE_REMOTE_DB = '0'
```

`vercel env run` pasa las claves en memoria, sin guardarlas en archivos. `USE_REMOTE_DB=1` es obligatorio: sin esa variable, la computadora de desarrollo siempre usa la base local PGlite (`PGLITE_DIR`), aunque `.env.local` contenga claves de Neon.

**Cuidado:** `vercel env pull` y algunos comandos de integración escriben las claves de producción en `.env.local`. Esto no es peligroso, gracias a la regla anterior, pero conviene borrarlas de ese archivo.

## Dominio propio
1. Comprar el dominio (p. ej. en un registrador de `.org.gt` o `.org`).
2. Vercel → proyecto → Settings → Domains → agregar el dominio y seguir las instrucciones DNS.
3. Actualizar `NEXT_PUBLIC_SITE_URL` en Production y volver a publicar.

## Copias de seguridad
- Neon guarda un historial de restauración (*point-in-time restore*); su duración depende del plan.
- Copia manual: `pg_dump "$DATABASE_URL" > respaldo-AAAA-MM-DD.sql` (con `vercel env run -e production -- …`). Guárdala fuera del servidor.
- Antes de una migración grande, haz una copia manual.

## Seguridad
- La cookie de sesión es `secure` en producción. Las contraseñas se guardan con bcrypt y los tokens de sesión como hash.
- El límite de envíos de formularios por IP vive en memoria de cada instancia. Si hay abuso, conviene moverlo a Redis (Upstash, desde el Marketplace de Vercel).
- Cada persona cambia su contraseña en **Panel → Mi cuenta y contraseña**.
