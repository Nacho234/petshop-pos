"use client";

import { useMemo } from "react";
import { useStore } from "./store";
import type { CashMovement, CashSession, Sale } from "./types";

// NOTE: Zustand v5 compares selector results by reference. Returning a fresh
// array/object from a selector (e.g. `s.products.filter(...)`) changes the
// snapshot on every render and triggers an infinite update loop. So we select
// the stable slices and derive with `useMemo`.

export function useCurrentBusiness() {
  const businesses = useStore((s) => s.businesses);
  const currentId = useStore((s) => s.currentBusinessId);
  return useMemo(
    () => businesses.find((b) => b.id === currentId)!,
    [businesses, currentId]
  );
}

export function useCurrency() {
  const business = useCurrentBusiness();
  return business?.currency ?? "ARS";
}

export function useProducts(opts?: { activeOnly?: boolean }) {
  const activeOnly = opts?.activeOnly ?? true;
  const products = useStore((s) => s.products);
  const currentId = useStore((s) => s.currentBusinessId);
  return useMemo(
    () =>
      products.filter(
        (p) => p.businessId === currentId && (!activeOnly || p.active)
      ),
    [products, currentId, activeOnly]
  );
}

export function useCategories() {
  const categories = useStore((s) => s.categories);
  const currentId = useStore((s) => s.currentBusinessId);
  return useMemo(
    () => categories.filter((c) => c.businessId === currentId),
    [categories, currentId]
  );
}

export function useSales() {
  const sales = useStore((s) => s.sales);
  const currentId = useStore((s) => s.currentBusinessId);
  return useMemo(
    () => sales.filter((sale) => sale.businessId === currentId),
    [sales, currentId]
  );
}

export function useOpenSession() {
  const sessions = useStore((s) => s.cashSessions);
  const currentId = useStore((s) => s.currentBusinessId);
  return useMemo(
    () =>
      sessions.find((c) => c.businessId === currentId && c.status === "open"),
    [sessions, currentId]
  );
}

export function useSessions() {
  const sessions = useStore((s) => s.cashSessions);
  const currentId = useStore((s) => s.currentBusinessId);
  return useMemo(
    () => sessions.filter((c) => c.businessId === currentId),
    [sessions, currentId]
  );
}

export function useCartTotals() {
  const cart = useStore((s) => s.cart);
  const cartDiscount = useStore((s) => s.cartDiscount);
  return useMemo(() => {
    const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    const discount = Math.min(cartDiscount, subtotal);
    const count = cart.reduce((sum, i) => sum + i.qty, 0);
    return { subtotal, discount, total: subtotal - discount, count };
  }, [cart, cartDiscount]);
}

// ---- Pure helpers (no hooks) --------------------------------------------

export interface SessionMetrics {
  cashSales: number; // efectivo movements of type venta
  income: number; // manual ingresos
  expense: number; // manual egresos
  expectedCash: number; // opening + cashSales + income - expense
  difference: number | null; // counted - expected (null while open)
}

export function computeSessionMetrics(
  session: CashSession,
  movements: CashMovement[]
): SessionMetrics {
  const forSession = movements.filter((m) => m.sessionId === session.id);
  const cashSales = forSession
    .filter((m) => m.type === "venta")
    .reduce((s, m) => s + m.amount, 0);
  const income = forSession
    .filter((m) => m.type === "ingreso")
    .reduce((s, m) => s + m.amount, 0);
  const expense = forSession
    .filter((m) => m.type === "egreso")
    .reduce((s, m) => s + m.amount, 0);
  const expectedCash = session.openingAmount + cashSales + income - expense;
  const difference =
    session.status === "closed" && session.countedAmount != null
      ? session.countedAmount - expectedCash
      : null;
  return { cashSales, income, expense, expectedCash, difference };
}

export function isSameDay(iso: string, ref = new Date()): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

export interface SalesSummary {
  total: number;
  count: number;
  byMethod: Record<string, number>;
  items: number;
}

export function summarizeSales(sales: Sale[]): SalesSummary {
  return sales.reduce<SalesSummary>(
    (acc, sale) => {
      acc.total += sale.total;
      acc.count += 1;
      acc.items += sale.items.reduce((s, i) => s + i.qty, 0);
      acc.byMethod[sale.paymentMethod] =
        (acc.byMethod[sale.paymentMethod] ?? 0) + sale.total;
      return acc;
    },
    { total: 0, count: 0, byMethod: {}, items: 0 }
  );
}

export interface TopProduct {
  productId: string;
  name: string;
  qty: number;
  revenue: number;
}

export function topProducts(sales: Sale[], limit = 5): TopProduct[] {
  const map = new Map<string, TopProduct>();
  for (const sale of sales) {
    for (const item of sale.items) {
      const cur = map.get(item.productId) ?? {
        productId: item.productId,
        name: item.name,
        qty: 0,
        revenue: 0,
      };
      cur.qty += item.qty;
      cur.revenue += item.price * item.qty;
      map.set(item.productId, cur);
    }
  }
  return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, limit);
}
