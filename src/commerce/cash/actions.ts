"use server";

import { assertAccess } from "@/core/auth/session";
import * as service from "./service";
import type { CloseSessionInput, OpenSessionInput } from "./schemas";

// La caja es una sección propia; la habilita el control de acceso por rol.
export async function getCurrentSessionAction() {
  await assertAccess("caja");
  return service.getCurrentSession();
}

export async function openSessionAction(input: OpenSessionInput) {
  await assertAccess("caja");
  return service.openSession(input);
}

export async function closeSessionAction(input: CloseSessionInput) {
  await assertAccess("caja");
  return service.closeSession(input);
}

export async function listClosedSessionsAction(limit?: number) {
  await assertAccess("caja");
  return service.listClosedSessions(limit);
}
