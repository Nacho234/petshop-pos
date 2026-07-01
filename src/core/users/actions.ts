"use server";

import { assertAccess, requireAuth } from "@/core/auth/session";
import * as service from "./service";
import type { CreateUserInput } from "./schemas";

// Gestión de usuarios: sólo ADMIN (sección "usuarios").
export async function listUsersAction() {
  await assertAccess("usuarios");
  return service.listUsers();
}

export async function createUserAction(input: CreateUserInput) {
  await assertAccess("usuarios");
  return service.createUser(input);
}

export async function setUserActiveAction(id: string, active: boolean) {
  const me = await requireAuth();
  if (me.role !== "ADMIN") throw new Error("No autorizado");
  return service.setUserActive(id, active, me.id);
}
