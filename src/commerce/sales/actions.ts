"use server";

import { assertAccess } from "@/core/auth/session";
import * as service from "./service";
import type { CreateSaleInput } from "./schemas";

// Vender está permitido para ADMIN y EMPLEADO (sección "pos").
export async function createSaleAction(input: CreateSaleInput) {
  await assertAccess("pos");
  return service.createSale(input);
}
