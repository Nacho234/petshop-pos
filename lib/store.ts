"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useEffect, useState } from "react";
import { newId } from "./format";
import { seed } from "./mock-data";
import type {
  Business,
  CashMovement,
  CashMovementType,
  CashSession,
  Category,
  ID,
  PaymentMethod,
  Product,
  Sale,
  SaleItem,
  ThemePref,
} from "./types";

interface CheckoutInput {
  paymentMethod: PaymentMethod;
  cashReceived?: number;
}

interface State {
  business: Business;
  categories: Category[];
  products: Product[];
  sales: Sale[];
  cashSessions: CashSession[];
  cashMovements: CashMovement[];
  cart: SaleItem[];
  cartDiscount: number;
  theme: ThemePref;

  // business config
  updateBusiness: (patch: Partial<Business>) => void;

  // catalog
  addCategory: (name: string) => Category;
  addProduct: (
    p: Omit<Product, "id" | "createdAt" | "active">
  ) => Product;
  updateProduct: (id: ID, patch: Partial<Product>) => void;
  archiveProduct: (id: ID) => void;

  // cart
  addToCart: (productId: ID, qty?: number) => void;
  setCartQty: (productId: ID, qty: number) => void;
  removeFromCart: (productId: ID) => void;
  setCartDiscount: (amount: number) => void;
  clearCart: () => void;

  // checkout
  checkout: (input: CheckoutInput) => Sale | null;

  // cash register
  openSession: (openingAmount: number) => CashSession | null;
  closeSession: (sessionId: ID, countedAmount: number, note?: string) => void;
  addCashMovement: (
    type: Exclude<CashMovementType, "venta">,
    amount: number,
    reason: string
  ) => void;

  // theme
  setTheme: (t: ThemePref) => void;
}

const initial = seed();

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      business: initial.business,
      categories: initial.categories,
      products: initial.products,
      sales: [],
      cashSessions: [],
      cashMovements: [],
      cart: [],
      cartDiscount: 0,
      theme: "system",

      updateBusiness: (patch) =>
        set((s) => ({ business: { ...s.business, ...patch } })),

      addCategory: (name) => {
        const cat: Category = { id: newId(), name: name.trim() };
        set((s) => ({ categories: [...s.categories, cat] }));
        return cat;
      },

      addProduct: (p) => {
        const product: Product = {
          ...p,
          id: newId(),
          active: true,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ products: [...s.products, product] }));
        return product;
      },

      updateProduct: (id, patch) =>
        set((s) => ({
          products: s.products.map((p) =>
            p.id === id ? { ...p, ...patch } : p
          ),
        })),

      archiveProduct: (id) =>
        set((s) => ({
          products: s.products.map((p) =>
            p.id === id ? { ...p, active: false } : p
          ),
        })),

      addToCart: (productId, qty = 1) => {
        const product = get().products.find((p) => p.id === productId);
        if (!product) return;
        set((s) => {
          const existing = s.cart.find((i) => i.productId === productId);
          if (existing) {
            return {
              cart: s.cart.map((i) =>
                i.productId === productId ? { ...i, qty: i.qty + qty } : i
              ),
            };
          }
          const item: SaleItem = {
            productId,
            name: product.name,
            price: product.price,
            qty,
          };
          return { cart: [...s.cart, item] };
        });
      },

      setCartQty: (productId, qty) =>
        set((s) => ({
          cart:
            qty <= 0
              ? s.cart.filter((i) => i.productId !== productId)
              : s.cart.map((i) =>
                  i.productId === productId ? { ...i, qty } : i
                ),
        })),

      removeFromCart: (productId) =>
        set((s) => ({ cart: s.cart.filter((i) => i.productId !== productId) })),

      setCartDiscount: (amount) => set({ cartDiscount: Math.max(0, amount) }),

      clearCart: () => set({ cart: [], cartDiscount: 0 }),

      checkout: ({ paymentMethod, cashReceived }) => {
        const s = get();
        if (s.cart.length === 0) return null;

        const subtotal = s.cart.reduce((sum, i) => sum + i.price * i.qty, 0);
        const discount = Math.min(s.cartDiscount, subtotal);
        const total = subtotal - discount;

        const number =
          s.sales.reduce((max, sale) => Math.max(max, sale.number), 0) + 1;

        const openSession = s.cashSessions.find((c) => c.status === "open");

        const sale: Sale = {
          id: newId(),
          number,
          items: s.cart.map((i) => ({ ...i })),
          subtotal,
          discount,
          total,
          paymentMethod,
          cashReceived: paymentMethod === "efectivo" ? cashReceived : undefined,
          change:
            paymentMethod === "efectivo" && cashReceived != null
              ? Math.max(0, cashReceived - total)
              : undefined,
          cashSessionId: openSession?.id ?? null,
          createdAt: new Date().toISOString(),
        };

        const products = s.products.map((p) => {
          const line = s.cart.find((i) => i.productId === p.id);
          if (line && p.trackStock) {
            return { ...p, stock: p.stock - line.qty };
          }
          return p;
        });

        const movements = [...s.cashMovements];
        if (paymentMethod === "efectivo" && openSession) {
          movements.push({
            id: newId(),
            sessionId: openSession.id,
            type: "venta",
            amount: total,
            reason: `Venta #${number}`,
            saleId: sale.id,
            createdAt: sale.createdAt,
          });
        }

        set({
          sales: [sale, ...s.sales],
          products,
          cashMovements: movements,
          cart: [],
          cartDiscount: 0,
        });
        return sale;
      },

      openSession: (openingAmount) => {
        const s = get();
        if (s.cashSessions.find((c) => c.status === "open")) return null;
        const session: CashSession = {
          id: newId(),
          status: "open",
          openedAt: new Date().toISOString(),
          openingAmount,
        };
        set({ cashSessions: [session, ...s.cashSessions] });
        return session;
      },

      closeSession: (sessionId, countedAmount, note) =>
        set((s) => ({
          cashSessions: s.cashSessions.map((c) =>
            c.id === sessionId
              ? {
                  ...c,
                  status: "closed",
                  closedAt: new Date().toISOString(),
                  countedAmount,
                  note,
                }
              : c
          ),
        })),

      addCashMovement: (type, amount, reason) => {
        const s = get();
        const session = s.cashSessions.find((c) => c.status === "open");
        if (!session || amount <= 0) return;
        const mv: CashMovement = {
          id: newId(),
          sessionId: session.id,
          type,
          amount,
          reason: reason.trim() || (type === "ingreso" ? "Ingreso" : "Egreso"),
          createdAt: new Date().toISOString(),
        };
        set({ cashMovements: [mv, ...s.cashMovements] });
      },

      setTheme: (t) => set({ theme: t }),
    }),
    {
      name: "petshop-pos",
      version: 1,
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : noopStorage
      ),
    }
  )
);

/** True once the persisted state has been read on the client (avoids SSR mismatch). */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
