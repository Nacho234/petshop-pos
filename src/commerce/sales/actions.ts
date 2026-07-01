"use server";

import { assertAccess } from "@/core/auth/session";
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
