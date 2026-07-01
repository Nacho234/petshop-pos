// Seed de bootstrap (Fase 1): crea la organización inicial, su configuración,
// un usuario ADMIN con contraseña, y categorías/marcas de ejemplo.
//
// La contraseña se hashea con Better Auth (mismo algoritmo que usa el login),
// y la credencial se guarda como Account providerId "credential" — sin pasar
// por el signup (que está deshabilitado).
//
// Al terminar imprime el DEFAULT_ORG_ID y las credenciales del admin.

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { betterAuth } from "better-auth";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
const prisma = new PrismaClient({ adapter });

const ADMIN_EMAIL = "admin@zafari.local";
const ADMIN_PASSWORD = "admin1234"; // cambiar después del primer login

async function main() {
  const org = await prisma.organization.create({
    data: {
      name: "Zafari",
      settings: { create: { businessName: "Zafari", currency: "ARS" } },
      categories: {
        create: [{ name: "Alimentos" }, { name: "Accesorios" }, { name: "Higiene" }],
      },
      brands: { create: [{ name: "Genérica" }] },
    },
  });

  // Hash de contraseña con el algoritmo de Better Auth (default scrypt).
  const auth = betterAuth({
    emailAndPassword: { enabled: true },
    secret: process.env.BETTER_AUTH_SECRET ?? "seed-only-secret",
  });
  const ctx = await auth.$context;
  const passwordHash = await ctx.password.hash(ADMIN_PASSWORD);

  const user = await prisma.user.create({
    data: {
      name: "Administrador",
      email: ADMIN_EMAIL,
      emailVerified: true,
      role: "ADMIN",
      organizationId: org.id,
    },
  });

  await prisma.account.create({
    data: {
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      password: passwordHash,
    },
  });

  console.log("\n✅ Seed completo.");
  console.log("   Pegá esto en tu .env:\n");
  console.log(`   DEFAULT_ORG_ID="${org.id}"\n`);
  console.log("   Credenciales del admin:");
  console.log(`   email:    ${ADMIN_EMAIL}`);
  console.log(`   password: ${ADMIN_PASSWORD}  (cambiala después del primer login)\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
