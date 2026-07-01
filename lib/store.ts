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
  businesses: Business[];
  currentBusinessId: ID;
  categories: Category[];
  products: Product[];
  sales: Sale[];
  cashSessions: CashSession[];
  cashMovements: CashMovement[];
  cart: SaleItem[];
  cartDiscount: number;
  theme: ThemePref;

  // tenant
  setCurrentBusiness: (id: ID) => void;
  addBusiness: (b: Omit<Business, "id" | "createdAt">) => Business;

  // catalog
  addCategory: (name: string) => Category;
  addProduct: (
    p: Omit<Product, "id" | "businessId" | "createdAt" | "active">
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
      businesses: initial.businesses,
      currentBusinessId: initial.businesses[0].id,
      categories: initial.categories,
      products: initial.products,
      sales: [],
      cashSessions: [],
      cashMovements: [],
      cart: [],
      cartDiscount: 0,
      theme: "system",

      setCurrentBusiness: (id) =>
        set({ currentBusinessId: id, cart: [], cartDiscount: 0 }),

      addBusiness: (b) => {
        const biz: Business = {
          ...b,
          id: newId(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ businesses: [...s.businesses, biz] }));
        return biz;
      },

      addCategory: (name) => {
        const cat: Category = {
          id: newId(),
          businessId: get().currentBusinessId,
          name: name.trim(),
        };
        set((s) => ({ categories: [...s.categories, cat] }));
        return cat;
      },

      addProduct: (p) => {
        const product: Product = {
          ...p,
          id: newId(),
          businessId: get().currentBusinessId,
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

      setCartDiscount: (amount) =>
        set({ cartDiscount: Math.max(0, amount) }),

      clearCart: () => set({ cart: [], cartDiscount: 0 }),

      checkout: ({ paymentMethod, cashReceived }) => {
        const s = get();
        const businessId = s.currentBusinessId;
        if (s.cart.length === 0) return null;

        const subtotal = s.cart.reduce((sum, i) => sum + i.price * i.qty, 0);
        const discount = Math.min(s.cartDiscount, subtotal);
        const total = subtotal - discount;

        const number =
          s.sales
            .filter((sale) => sale.businessId === businessId)
            .reduce((max, sale) => Math.max(max, sale.number), 0) + 1;

        const openSession = s.cashSessions.find(
          (c) => c.businessId === businessId && c.status === "open"
        );

        const sale: Sale = {
          id: newId(),
          businessId,
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

        // decrement stock for tracked products
        const products = s.products.map((p) => {
          const line = s.cart.find((i) => i.productId === p.id);
          if (line && p.trackStock) {
            return { ...p, stock: p.stock - line.qty };
          }
          return p;
        });

        // register cash income if paid cash into an open session
        const movements = [...s.cashMovements];
        if (paymentMethod === "efectivo" && openSession) {
          movements.push({
            id: newId(),
            businessId,
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
        const businessId = s.currentBusinessId;
        const already = s.cashSessions.find(
          (c) => c.businessId === businessId && c.status === "open"
        );
        if (already) return null;
        const session: CashSession = {
          id: newId(),
          businessId,
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
        const businessId = s.currentBusinessId;
        const session = s.cashSessions.find(
          (c) => c.businessId === businessId && c.status === "open"
        );
        if (!session || amount <= 0) return;
        const mv: CashMovement = {
          id: newId(),
          businessId,
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
      name: "caja-store",
      version: 1,
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : noopStorage
      ),
      partialize: (s) => ({
        businesses: s.businesses,
        currentBusinessId: s.currentBusinessId,
        categories: s.categories,
        products: s.products,
        sales: s.sales,
        cashSessions: s.cashSessions,
        cashMovements: s.cashMovements,
        cart: s.cart,
        cartDiscount: s.cartDiscount,
        theme: s.theme,
      }),
    }
  )
);

/** True once the persisted state has been read on the client (avoids SSR mismatch). */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
