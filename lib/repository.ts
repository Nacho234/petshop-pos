// ---------------------------------------------------------------------------
// Persistence boundary (single-business).
//
// Right now the app persists to localStorage through the Zustand store
// (`lib/store.ts`). That store is the ONLY place that reads/writes data, which
// keeps this swap cheap: to move to Supabase, implement `PosRepository` with a
// `SupabaseRepository` and make the store actions call it.
//
// This is a single-business deploy, so there is no tenant key. If you ever want
// several businesses to share one backend, add a `business_id` column to every
// table plus a Row Level Security policy; but the intended reuse model for this
// template is one copy (one deploy, one database) per business.
// ---------------------------------------------------------------------------

import type {
  Business,
  CashMovement,
  CashSession,
  Category,
  ID,
  Product,
  Sale,
} from "./types";

export interface PosRepository {
  getBusiness(): Promise<Business>;
  updateBusiness(patch: Partial<Business>): Promise<Business>;

  listCategories(): Promise<Category[]>;
  createCategory(name: string): Promise<Category>;

  listProducts(): Promise<Product[]>;
  createProduct(
    input: Omit<Product, "id" | "createdAt" | "active">
  ): Promise<Product>;
  updateProduct(id: ID, patch: Partial<Product>): Promise<Product>;
  archiveProduct(id: ID): Promise<void>;

  listSales(): Promise<Sale[]>;
  createSale(sale: Omit<Sale, "id" | "number" | "createdAt">): Promise<Sale>;

  listCashSessions(): Promise<CashSession[]>;
  openCashSession(openingAmount: number): Promise<CashSession>;
  closeCashSession(
    id: ID,
    countedAmount: number,
    note?: string
  ): Promise<CashSession>;

  listCashMovements(): Promise<CashMovement[]>;
  createCashMovement(
    input: Omit<CashMovement, "id" | "createdAt">
  ): Promise<CashMovement>;
}

// Suggested Supabase schema (for when we wire it up):
//
//   business(id, name, legal_name, tax_id, address, phone, currency)  -- 1 row
//   categories(id, name)
//   products(id, name, sku, price, cost, stock, track_stock, category_id,
//            active, created_at)
//   sales(id, number, subtotal, discount, total, payment_method, cash_received,
//         change, cash_session_id, created_at)
//   sale_items(id, sale_id fk, product_id, name, price, qty)
//   cash_sessions(id, status, opened_at, opening_amount, closed_at,
//                 counted_amount, note)
//   cash_movements(id, session_id fk, type, amount, reason, sale_id, created_at)
