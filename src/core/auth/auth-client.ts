"use client";

import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

import type { auth } from "./auth";

// inferAdditionalFields hace que la sesión del cliente incluya los campos de
// dominio del server (role, organizationId, active). El import de `auth` es
// sólo de tipos, así que no se bundlea código de servidor.
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});

export const { signIn, signOut, useSession } = authClient;
