import { getSession } from "@/core/auth/session";

// ---------------------------------------------------------------------------
// Resolución del tenant activo (organizationId) para la request en curso.
//
// Se obtiene de la organización del usuario logueado (sesión de Better Auth).
// Si no hay sesión, lanza — las rutas protegidas ya exigen auth antes de llegar
// acá. El fallback DEFAULT_ORG_ID cubre contextos sin request (seed/scripts).
// ---------------------------------------------------------------------------

export async function getTenantId(): Promise<string> {
  const session = await getSession();
  const orgId = session?.user.organizationId ?? process.env.DEFAULT_ORG_ID;
  if (!orgId) {
    throw new Error("Tenant no resuelto: no hay sesión activa ni DEFAULT_ORG_ID.");
  }
  return orgId;
}
