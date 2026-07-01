import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/core/auth/auth";
import { canAccess, type AppSection } from "@/core/auth/access";

// Sesión activa (o null). Los campos de dominio (role, organizationId, active)
// viajan en `user` gracias a los additionalFields de la config de auth.
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export type SessionUser = NonNullable<
  Awaited<ReturnType<typeof getSession>>
>["user"];

/** Exige sesión; si no hay, redirige al login. Devuelve el usuario. */
export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.user;
}

/** Exige acceso a una sección; si no alcanza el rol, redirige. */
export async function requireAccess(section: AppSection): Promise<SessionUser> {
  const user = await requireAuth();
  if (!canAccess(user.role, section)) redirect("/pos");
  return user;
}

/**
 * Igual que requireAccess pero LANZA en vez de redirigir. Para usar en Server
 * Actions (mutaciones), donde un throw es el comportamiento correcto.
 */
export async function assertAccess(section: AppSection): Promise<SessionUser> {
  const user = await requireAuth();
  if (!canAccess(user.role, section)) {
    throw new Error("No autorizado");
  }
  return user;
}
