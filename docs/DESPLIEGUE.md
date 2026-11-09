# Despliegue

Configuración recomendada: **Vercel** (aplicación Next.js) + **Supabase** o **Neon** (PostgreSQL administrado) + **Cloudflare R2** (archivos, compatible con S3). Las tres opciones tienen planes gratuitos suficientes para empezar.

## 1. Base de datos
1. Crea un proyecto PostgreSQL (Supabase o Neon) y copia la cadena de conexión `postgres://…`.
2. Desde tu equipo, con esa cadena en `DATABASE_URL`:
   ```powershell
   $env:DATABASE_URL="postgres://..."; npm run db:setup
   $env:DATABASE_URL="postgres://..."; npm run admin:create -- correo@dominio.org "Nombre Apellido"
   ```
   Con `DATABASE_URL` definida, el sistema usa PostgreSQL en lugar de PGlite.

## 2. Aplicación
1. Sube el repositorio a GitHub (sin `.env.local`: ya está en `.gitignore`).
2. Importa el repositorio en Vercel.
3. Variables de entorno en Vercel: `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL` (dominio final) e `IP_SALT` (cadena aleatoria). Opcionales: `TURNSTILE_SECRET` y `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `RESEND_API_KEY` y `NOTIFY_EMAIL`, y las variables `S3_*`.
4. Despliega y conecta el dominio.

## 3. Copias de seguridad
- Supabase y Neon hacen copias automáticas diarias (revisa la retención de tu plan).
- Copia manual: `pg_dump "$DATABASE_URL" > respaldo-AAAA-MM-DD.sql`. Guárdala fuera del servidor.
- Antes de cada migración en producción, haz una copia manual.

## 4. Seguridad en producción
- `NEXT_PUBLIC_SITE_URL` debe usar `https://`. La cookie de sesión se marca `secure` en producción.
- El límite de envíos por IP se guarda en memoria. Con varias instancias, conviene moverlo a Redis (Upstash).
- Cambia la contraseña temporal del superadministrador después del primer ingreso.
