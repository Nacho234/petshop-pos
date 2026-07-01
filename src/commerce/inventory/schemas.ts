import { z } from "zod";

// Ingreso de mercadería (reponer): suma stock → movimiento PURCHASE.
export const receiveStockSchema = z.object({
  productId: z.string().min(1, "Elegí un producto"),
  quantity: z.coerce.number().int().positive("La cantidad debe ser mayor a 0"),
  reason: z.string().trim().max(200).optional().or(z.literal("")),
});
export type ReceiveStockInput = z.infer<typeof receiveStockSchema>;

// Ajuste por recuento: fija el stock real → movimiento ADJUSTMENT (delta).
export const adjustStockSchema = z.object({
  productId: z.string().min(1, "Elegí un producto"),
  newStock: z.coerce.number().int().min(0, "No puede ser negativo"),
  reason: z.string().trim().min(1, "Indicá el motivo del ajuste").max(200),
});
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;

export const MOVEMENT_LABELS: Record<string, string> = {
  INITIAL: "Stock inicial",
  PURCHASE: "Ingreso",
  SALE: "Venta",
  ADJUSTMENT: "Ajuste",
};

export type MovementDTO = {
  id: string;
  productId: string;
  productName: string;
  type: string;
  quantity: number;
  reason: string | null;
  createdAt: string;
};

export type LowStockDTO = {
  id: string;
  name: string;
  stock: number;
  minStock: number;
};
