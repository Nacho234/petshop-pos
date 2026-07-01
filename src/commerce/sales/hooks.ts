"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  cancelSaleAction,
  createSaleAction,
  getSaleForTicketAction,
  listRecentSalesAction,
  listSalesAction,
} from "./actions";
import type { CreateSaleInput } from "./schemas";

const SALES_KEY = "sales";

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSaleInput) => createSaleAction(input),
    onSuccess: () => {
      // El stock cambió: invalidar productos. La venta nueva debe reflejarse
      // en los reportes: invalidar también el listado de ventas.
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: [SALES_KEY] });
      // El efectivo esperado del turno cambió (ventas en efectivo).
      qc.invalidateQueries({ queryKey: ["cash"] });
    },
  });
}

// Ventas de los últimos `days` días para los reportes.
export function useSalesReport(days = 30) {
  return useQuery({
    queryKey: [SALES_KEY, days],
    queryFn: () => listSalesAction(days),
  });
}

// Comprobante de una venta por id.
export function useSaleTicket(id: string) {
  return useQuery({
    queryKey: [SALES_KEY, "ticket", id],
    queryFn: () => getSaleForTicketAction(id),
    enabled: !!id,
  });
}

// Historial de ventas (todos los estados).
export function useRecentSales(limit = 50) {
  return useQuery({
    queryKey: [SALES_KEY, "recent", limit],
    queryFn: () => listRecentSalesAction(limit),
  });
}

// Anular venta: refresca ventas, productos (stock) y caja.
export function useCancelSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelSaleAction(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SALES_KEY] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["cash"] });
    },
  });
}
