import { z } from "zod";

// Etapa sin cambios de DB: la caja usa sólo la tabla CashSession existente.
// Ingresos/egresos manuales quedan pendientes para la etapa de base de datos
// (requieren una tabla nueva de movimientos de caja).

export const openSessionSchema = z.object({
  openingAmount: z.coerce
    .number({ message: "Ingresá un monto válido" })
    .min(0, "El fondo inicial no puede ser negativo"),
});
export type OpenSessionInput = z.infer<typeof openSessionSchema>;

export const closeSessionSchema = z.object({
  countedAmount: z.coerce
    .number({ message: "Ingresá el efectivo contado" })
    .min(0, "El efectivo contado no puede ser negativo"),
  note: z.string().trim().max(300).optional(),
});
export type CloseSessionInput = z.infer<typeof closeSessionSchema>;

// Arqueo del turno. Sin ingresos/egresos manuales todavía:
// `expectedCash` = fondo inicial + ventas cobradas en efectivo del turno.
export type CashMetrics = {
  openingAmount: number;
  cashSales: number;
  expectedCash: number;
};

export type CashSessionDTO = {
  id: string;
  status: "OPEN" | "CLOSED";
  openingAmount: number;
  countedAmount: number | null;
  note: string | null;
  openedAt: string;
  closedAt: string | null;
  metrics: CashMetrics;
};

export type CashClosedSummaryDTO = {
  id: string;
  openedAt: string;
  closedAt: string | null;
  expectedCash: number;
  countedAmount: number | null;
  difference: number | null; // contado − esperado (null si no hay conteo)
};
