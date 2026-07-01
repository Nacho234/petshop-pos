import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { prisma } from "@/shared/lib/prisma";

// ---------------------------------------------------------------------------
// Configuración de Better Auth (servidor).
//
// - Sin registro público: los usuarios los crea el administrador. El login es
//   email + password.
// - Campos de dominio (role, organizationId, active) viajan en la sesión.
// - Fase 1 (single-org bootstrap): al crear un usuario se le asigna la
//   organización activa desde DEFAULT_ORG_ID. Cuando exista alta multi-org,
//   este hook se reemplaza por la selección de organización del alta.
// ---------------------------------------------------------------------------

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    disableSignUp: true, // el alta de usuarios la hace el admin, no es pública
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "EMPLEADO",
        input: false, // no se setea desde el cliente
      },
      organizationId: {
        type: "string",
        required: false,
        input: false,
      },
      active: {
        type: "boolean",
        required: false,
        defaultValue: true,
        input: false,
      },
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const organizationId = process.env.DEFAULT_ORG_ID;
          if (!organizationId) {
            throw new Error(
              "No se puede crear el usuario: falta DEFAULT_ORG_ID (bootstrap de organización)."
            );
          }
          return { data: { ...user, organizationId } };
        },
      },
    },
  },

  plugins: [nextCookies()],
});
