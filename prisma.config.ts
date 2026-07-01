import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migraciones: conexión DIRECTA (Supabase puerto 5432).
    // Fallback placeholder para que `prisma generate` (postinstall en Vercel)
    // y el build funcionen SIN base de datos configurada todavía. Las
    // migraciones reales requieren DIRECT_URL seteada.
    url:
      process.env.DIRECT_URL ??
      "postgresql://placeholder:placeholder@localhost:5432/postgres",
  },
});
