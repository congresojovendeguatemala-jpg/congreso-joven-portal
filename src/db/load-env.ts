// Carga .env.local / .env para scripts fuera de Next.js (migraciones, seed).
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
