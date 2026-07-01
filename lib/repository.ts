// ---------------------------------------------------------------------------
// Persistence boundary.
//
// Right now the app persists to localStorage through the Zustand store
// (`lib/store.ts`). That store is the ONLY place that reads/writes data, which
// keeps this swap cheap: to move to Supabase, implement `PosRepository` with a
// `SupabaseRepository`, make the store actions call it, and enforce tenant
// isolation with a Row Level Security policy on `business_id`.
//
// This interface is the contract that a real backend must satisfy. It is async
// on purpose so the store actions can be turned into async calls later without
// changing component code (components already treat the store as the source of
// truth).
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
  // Tenant
  listBusinesses(): Promise<Business[]>;
  createBusiness(input: Omit<Business, "id" | "createdAt">): Promise<Business>;

  // Everything below is implicitly scoped to a business id (the tenant key).
  // With Supabase this is enforced server-side by RLS, not by the client.
  listCategories(businessId: ID): Promise<Category[]>;
  createCategory(businessId: ID, name: string): Promise<Category>;

  listProducts(businessId: ID): Promise<Product[]>;
  createProduct(
    businessId: ID,
    input: Omit<Product, "id" | "businessId" | "createdAt" | "active">
  ): Promise<Product>;
  updateProduct(id: ID, patch: Partial<Product>): Promise<Product>;
  archiveProduct(id: ID): Promise<void>;

  listSales(businessId: ID): Promise<Sale[]>;
  createSale(sale: Omit<Sale, "id" | "number" | "createdAt">): Promise<Sale>;

  listCashSessions(businessId: ID): Promise<CashSession[]>;
  openCashSession(businessId: ID, openingAmount: number): Promise<CashSession>;
  closeCashSession(
    id: ID,
    countedAmount: number,
    note?: string
  ): Promise<CashSession>;

  listCashMovements(businessId: ID): Promise<CashMovement[]>;
  createCashMovement(
    input: Omit<CashMovement, "id" | "createdAt">
  ): Promise<CashMovement>;
}

// Suggested Supabase schema (for when we wire it up):
//
//   businesses(id uuid pk, name, slug, legal_name, tax_id, address, phone,
//              currency, created_at)
//   memberships(user_id uuid, business_id uuid, role)   -- who can access what
//   categories(id, business_id fk, name)
//   products(id, business_id fk, name, sku, price, cost, stock, track_stock,
//            category_id, active, created_at)
//   sales(id, business_id fk, number, subtotal, discount, total,
//         payment_method, cash_received, change, cash_session_id, created_at)
//   sale_items(id, sale_id fk, product_id, name, price, qty)
//   cash_sessions(id, business_id fk, status, opened_at, opening_amount,
//                 closed_at, counted_amount, note)
//   cash_movements(id, business_id fk, session_id fk, type, amount, reason,
//                  sale_id, created_at)
//
// RLS (every table): USING (business_id IN (
//   SELECT business_id FROM memberships WHERE user_id = auth.uid()
// ))
