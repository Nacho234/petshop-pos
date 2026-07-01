"use server";

import { assertAccess } from "@/core/auth/session";
import * as service from "./service";
import type { AdjustStockInput, ReceiveStockInput } from "./schemas";

export async function receiveStockAction(input: ReceiveStockInput) {
  await assertAccess("inventario");
  return service.receiveStock(input);
}

export async function adjustStockAction(input: AdjustStockInput) {
  await assertAccess("inventario");
  return service.adjustStock(input);
}

export async function listMovementsAction(productId?: string, limit?: number) {
  await assertAccess("inventario");
  return service.listMovements(productId, limit);
}

export async function listLowStockAction() {
  await assertAccess("inventario");
  return service.listLowStock();
}
