// Seed de bootstrap (Fase 1): crea la organización inicial, su configuración,
// un usuario administrador y algunas categorías/marcas de ejemplo.
//
// Al terminar imprime el DEFAULT_ORG_ID para pegar en `.env`.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.create({
    data: {
      name: "Zafari",
      settings: {
        create: {
          businessName: "Zafari",
          currency: "ARS",
        },
      },
      users: {
        create: {
          email: "admin@zafari.local",
          name: "Administrador",
          role: "ADMIN",
        },
      },
      categories: {
        create: [{ name: "Alimentos" }, { name: "Accesorios" }, { name: "Higiene" }],
      },
      brands: {
        create: [{ name: "Genérica" }],
      },
    },
  });

  console.log("\n✅ Seed completo.");
  console.log("   Pegá esto en tu .env:\n");
  console.log(`   DEFAULT_ORG_ID="${org.id}"\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
