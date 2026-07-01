// Domain model for a SINGLE-business POS. This project is one deploy = one
// business (the pet shop). To reuse it for another business, copy the template
// and change the seed / business config. There is no runtime multi-tenancy.

export type ID = string;

export interface Business {
  name: string;
  legalName?: string;
  taxId?: string; // CUIT
  address?: string;
  phone?: string;
  currency: string; // ISO 4217, e.g. "ARS"
}

export interface Category {
  id: ID;
  name: string;
}

export interface Product {
  id: ID;
  name: string;
  sku?: string;
  price: number;
  cost?: number;
  stock: number;
  trackStock: boolean;
  categoryId?: ID | null;
  active: boolean;
  createdAt: string;
}

export type PaymentMethod = "efectivo" | "tarjeta" | "transferencia";

export interface SaleItem {
  productId: ID;
  name: string; // snapshot at time of sale
  price: number; // unit price snapshot
  qty: number;
}

export interface Sale {
  id: ID;
  number: number; // incremental ticket number
  items: SaleItem[];
  subtotal: number;
  discount: number; // absolute amount
  total: number;
  paymentMethod: PaymentMethod;
  cashReceived?: number; // only for efectivo
  change?: number; // only for efectivo
  cashSessionId?: ID | null;
  createdAt: string;
}

export type CashMovementType = "venta" | "ingreso" | "egreso";

export interface CashMovement {
  id: ID;
  sessionId: ID;
  type: CashMovementType;
  amount: number; // always positive; `type` sets the direction
  reason: string;
  saleId?: ID | null;
  createdAt: string;
}

export type CashSessionStatus = "open" | "closed";

export interface CashSession {
  id: ID;
  status: CashSessionStatus;
  openedAt: string;
  openingAmount: number;
  closedAt?: string | null;
  countedAmount?: number | null; // real cash counted at close
  note?: string;
}

export type ThemePref = "light" | "dark" | "system";
