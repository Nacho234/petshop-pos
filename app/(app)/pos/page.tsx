"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MagnifyingGlassIcon,
  MinusIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react";

import { Badge, Button } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { useSession } from "@/core/auth/auth-client";
import { useSearchProductsForPos } from "@/commerce/products/hooks";
import { searchProductsForPosAction } from "@/commerce/products/actions";
import type { ProductDTO } from "@/commerce/products/schemas";
import { useCreateSale } from "@/commerce/sales/hooks";
import { PaymentModal } from "@/commerce/sales/components/payment-modal";
import type { PaymentMethod } from "@/commerce/sales/schemas";

type CartItem = {
  productId: string;
  name: string;
  unitPrice: number;
  qty: number;
  maxStock: number;
};

export default function PosPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [rawQuery, setRawQuery] = useState("");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState("");
  const [payOpen, setPayOpen] = useState(false);
  const [success, setSuccess] = useState<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const createSale = useCreateSale();

  useEffect(() => {
    const t = setTimeout(() => setQuery(rawQuery), 200);
    return () => clearTimeout(t);
  }, [rawQuery]);

  const results = useSearchProductsForPos(query);

  const subtotal = useMemo(
    () => cart.reduce((s, i) => s + i.unitPrice * i.qty, 0),
    [cart]
  );
  const discountNum = Math.min(Number(discount) || 0, subtotal);
  const total = subtotal - discountNum;

  function addToCart(p: ProductDTO) {
    if (p.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === p.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === p.id ? { ...i, qty: Math.min(i.qty + 1, i.maxStock) } : i
        );
      }
      return [
        ...prev,
        { productId: p.id, name: p.name, unitPrice: p.price, qty: 1, maxStock: p.stock },
      ];
    });
    setRawQuery("");
    setQuery("");
    searchRef.current?.focus();
  }

  async function onSearchEnter() {
    const q = rawQuery.trim();
    if (!q) return;
    const found = await searchProductsForPosAction(q);
    const exact = found.find(
      (p) =>
        p.barcode?.toLowerCase() === q.toLowerCase() ||
        p.sku?.toLowerCase() === q.toLowerCase()
    );
    const chosen = exact ?? (found.length === 1 ? found[0] : null);
    if (chosen) addToCart(chosen);
  }

  function setQty(productId: string, qty: number) {
    setCart((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, qty: Math.max(1, Math.min(qty, i.maxStock)) } : i
      )
    );
  }

  function setPrice(productId: string, price: number) {
    setCart((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, unitPrice: Math.max(0, price) } : i))
    );
  }

  function removeItem(productId: string) {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }

  async function onConfirmPayment(payments: { method: PaymentMethod; amount: number }[]) {
    try {
      const sale = await createSale.mutateAsync({
        items: cart.map((i) => ({ productId: i.productId, qty: i.qty, unitPrice: i.unitPrice })),
        discount: discountNum,
        payments,
      });
      setPayOpen(false);
      setCart([]);
      setDiscount("");
      setSuccess(sale.number);
      setTimeout(() => setSuccess(null), 4000);
      searchRef.current?.focus();
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo registrar la venta.");
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-5 lg:px-8 lg:py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-fg">Vender</h1>
        {success && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-success-soft px-3 py-1.5 text-sm font-semibold text-success">
            <CheckCircleIcon size={18} weight="fill" /> Venta #{success} registrada
          </span>
        )}
      </div>

      {/* Buscador */}
      <div className="relative">
        <MagnifyingGlassIcon
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle"
        />
        <input
          ref={searchRef}
          value={rawQuery}
          onChange={(e) => setRawQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSearchEnter();
            }
          }}
          autoFocus
          placeholder="Escaneá un código o buscá por nombre / SKU…"
          className="h-12 w-full rounded-lg border border-border-strong bg-surface pl-10 pr-3 text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
        />
        {query && (results.data?.length ?? 0) > 0 && (
          <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-border bg-surface shadow-lg">
            {results.data!.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={p.stock <= 0}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-surface-2 disabled:opacity-50"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-fg">{p.name}</span>
                  <span className="block text-xs text-fg-subtle">
                    {p.sku ? `${p.sku} · ` : ""}Stock: {p.stock}
                  </span>
                </span>
                <span className="tabular font-semibold text-fg">
                  {formatMoney(p.price, "ARS")}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Carrito */}
      {cart.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-strong bg-surface/50 px-6 py-16 text-center text-sm text-fg-muted">
          Buscá o escaneá un producto para empezar la venta.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <ul className="divide-y divide-border">
            {cart.map((i) => (
              <li key={i.productId} className="flex items-center gap-3 px-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-fg">{i.name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    {isAdmin ? (
                      <input
                        value={String(i.unitPrice)}
                        onChange={(e) =>
                          setPrice(i.productId, Number(e.target.value.replace(/[^\d.]/g, "")) || 0)
                        }
                        inputMode="decimal"
                        className="h-8 w-24 rounded-md border border-border-strong bg-surface px-2 text-sm text-fg focus:border-accent focus:outline-none"
                        aria-label="Precio unitario"
                      />
                    ) : (
                      <span className="text-sm text-fg-muted">{formatMoney(i.unitPrice, "ARS")}</span>
                    )}
                    {i.qty >= i.maxStock && <Badge tone="warning">Máx</Badge>}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setQty(i.productId, i.qty - 1)}
                    aria-label="Menos"
                    className="grid h-8 w-8 place-items-center rounded-md border border-border-strong text-fg hover:bg-surface-2"
                  >
                    <MinusIcon size={15} />
                  </button>
                  <input
                    value={String(i.qty)}
                    onChange={(e) => setQty(i.productId, Number(e.target.value.replace(/[^\d]/g, "")) || 1)}
                    inputMode="numeric"
                    className="h-8 w-12 rounded-md border border-border-strong bg-surface text-center text-sm text-fg focus:border-accent focus:outline-none"
                    aria-label="Cantidad"
                  />
                  <button
                    onClick={() => setQty(i.productId, i.qty + 1)}
                    aria-label="Más"
                    className="grid h-8 w-8 place-items-center rounded-md border border-border-strong text-fg hover:bg-surface-2"
                  >
                    <PlusIcon size={15} />
                  </button>
                </div>

                <span className="tabular w-24 text-right font-semibold text-fg">
                  {formatMoney(i.unitPrice * i.qty, "ARS")}
                </span>

                <button
                  onClick={() => removeItem(i.productId)}
                  aria-label={`Quitar ${i.name}`}
                  className="grid h-8 w-8 place-items-center rounded-md text-fg-muted hover:bg-danger-soft hover:text-danger"
                >
                  <TrashIcon size={16} />
                </button>
              </li>
            ))}
          </ul>

          {/* Totales */}
          <div className="border-t border-border p-3">
            <div className="flex items-center justify-between py-1 text-sm text-fg-muted">
              <span>Subtotal</span>
              <span className="tabular">{formatMoney(subtotal, "ARS")}</span>
            </div>
            <div className="flex items-center justify-between gap-3 py-1 text-sm">
              <span className="text-fg-muted">Descuento</span>
              <input
                value={discount}
                onChange={(e) => setDiscount(e.target.value.replace(/[^\d.]/g, ""))}
                inputMode="decimal"
                placeholder="0"
                className="h-8 w-28 rounded-md border border-border-strong bg-surface px-2 text-right text-sm text-fg focus:border-accent focus:outline-none"
              />
            </div>
            <div className="mt-1 flex items-center justify-between border-t border-border pt-2 text-lg font-bold text-fg">
              <span>Total</span>
              <span className="tabular">{formatMoney(total, "ARS")}</span>
            </div>
            <Button
              size="lg"
              className="mt-3 w-full"
              disabled={cart.length === 0 || total <= 0}
              onClick={() => setPayOpen(true)}
            >
              Cobrar {formatMoney(total, "ARS")}
            </Button>
          </div>
        </div>
      )}

      <PaymentModal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        total={total}
        onConfirm={onConfirmPayment}
        submitting={createSale.isPending}
      />
    </div>
  );
}
