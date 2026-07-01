// ---------------------------------------------------------------------------
// Resolución del tenant activo (organizationId) para la request en curso.
//
// FASE 1 (single-org bootstrap): se resuelve desde DEFAULT_ORG_ID mientras el
// módulo de auth no está conectado.
//
// PASO 2 (auth): reemplazar por la organización del usuario logueado (leída de
// la sesión de Better Auth). La firma no cambia, así que los repositorios que
// dependen de esto no se tocan.
// ---------------------------------------------------------------------------

export function getTenantId(): string {
  const orgId = process.env.DEFAULT_ORG_ID;
  if (!orgId) {
    throw new Error(
      "Tenant no resuelto: falta DEFAULT_ORG_ID (bootstrap). En el paso de auth se reemplaza por la organización de la sesión."
    );
  }
  return orgId;
}
