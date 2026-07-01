"use server";

import { assertAccess, requireAuth } from "@/core/auth/session";
import * as service from "./service";
import type { CreateSaleInput } from "./schemas";

// Vender está permitido para ADMIN y EMPLEADO (sección "pos").
export async function createSaleAction(input: CreateSaleInput) {
  await assertAccess("pos");
  return service.createSale(input);
}

// Listado para reportes: sólo roles con acceso a "reportes" (ADMIN).
export async function listSalesAction(days: number) {
  await assertAccess("reportes");
  return service.listSales(days);
}

// Comprobante de una venta: permitido a quien puede vender (ADMIN y EMPLEADO).
export async function getSaleForTicketAction(id: string) {
  await assertAccess("ventas");
  return service.getSaleForTicket(id);
}

// Historial de ventas: ADMIN y EMPLEADO (sección "ventas").
export async function listRecentSalesAction(limit?: number) {
  await assertAccess("ventas");
  return service.listRecentSales(limit);
}

// Anular una venta: sólo ADMIN (es una operación sensible).
export async function cancelSaleAction(id: string) {
  const user = await requireAuth();
  if (user.role !== "ADMIN") throw new Error("Sólo un administrador puede anular ventas.");
  return service.cancelSale(id, user.id);
}
