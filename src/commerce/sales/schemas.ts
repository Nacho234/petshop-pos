import { z } from "zod";

export const PAYMENT_METHODS = [
  "EFECTIVO",
  "DEBITO",
  "CREDITO",
  "TRANSFERENCIA",
  "MERCADO_PAGO",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  EFECTIVO: "Efectivo",
  DEBITO: "Débito",
  CREDITO: "Crédito",
  TRANSFERENCIA: "Transferencia",
  MERCADO_PAGO: "Mercado Pago",
};

export const saleItemInputSchema = z.object({
  productId: z.string().min(1),
  qty: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().min(0),
});

export const paymentInputSchema = z.object({
  method: z.enum(PAYMENT_METHODS),
  amount: z.coerce.number().min(0),
});

export const createSaleSchema = z.object({
  items: z.array(saleItemInputSchema).min(1, "La venta no tiene productos"),
  discount: z.coerce.number().min(0).default(0),
  payments: z.array(paymentInputSchema).min(1, "Falta la forma de pago"),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;

export type SaleDTO = {
  id: string;
  number: number;
  subtotal: number;
  discount: number;
  total: number;
  createdAt: string;
  items: { name: string; unitPrice: number; qty: number; subtotal: number }[];
  payments: { method: PaymentMethod; amount: number }[];
};
