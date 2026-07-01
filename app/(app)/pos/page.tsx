"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  MagnifyingGlassIcon,
  MinusIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  WarningIcon,
  LockIcon,
} from "@phosphor-icons/react";

import { Badge, Button } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { APP_CONFIG } from "@/shared/config/app";
import { useSession } from "@/core/auth/auth-client";
import { useSearchProductsForPos } from "@/commerce/products/hooks";
import { searchProductsForPosAction } from "@/commerce/products/actions";
import type { ProductDTO } from "@/commerce/products/schemas";
import { useCreateSale } from "@/commerce/sales/hooks";
import { useCashSession } from "@/commerce/cash/hooks";
import { PaymentModal } from "@/commerce/sales/components/payment-modal";
import type { PaymentMethod } from "@/commerce/sales/schemas";

const CURRENCY = APP_CONFIG.defaultCurrency;

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

  // Regla obligatoria: no se puede vender sin una caja abierta.
  const caja = useCashSession();
  const cajaOpen = !!caja.data;
  const cajaLoading = caja.isLoading;

  const [rawQuery, setRawQuery] = useState("");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState("");
  const [payOpen, setPayOpen] = useState(false);
  const [lastSale, setLastSale] = useState<{ id: string; number: number } | null>(null);
  const [saleError, setSaleError] = useState<string | null>(null);
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
  const discountRaw = Number(discount) || 0;
  const discountNum = Math.min(discountRaw, subtotal);
  const discountTooHigh = discountRaw > subtotal;
  const total = subtotal - discountNum;

  const canCharge = cajaOpen && cart.length > 0 && total > 0;

  function addToCart(p: ProductDTO) {
    if (p.stock <= 0) return;
    setLastSale(null);
    setSaleError(null);
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === p.id);
      if (existing) {
        if (existing.qty >= existing.maxStock) return prev; // no superar stock
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

  function clearCart() {
    if (cart.length === 0) return;
    if (!window.confirm("¿Vaciar el carrito? Se van a quitar todos los productos.")) return;
    setCart([]);
    setDiscount("");
    searchRef.current?.focus();
  }

  function openPayment() {
    setSaleError(null);
    // Doble chequeo antes de abrir el cobro (la validación real está en el server).
    if (!cajaOpen) {
      setSaleError("Para realizar ventas primero tenés que abrir la caja.");
      return;
    }
    if (cart.length === 0 || total <= 0) return;
    setPayOpen(true);
  }

  async function onConfirmPayment(payments: { method: PaymentMethod; amount: number }[]) {
    setSaleError(null);
    try {
      const sale = await createSale.mutateAsync({
        items: cart.map((i) => ({ productId: i.productId, qty: i.qty, unitPrice: i.unitPrice })),
        discount: discountNum,
        payments,
      });
      setPayOpen(false);
      setCart([]);
      setDiscount("");
      setLastSale({ id: sale.id, number: sale.number });
      searchRef.current?.focus();
    } catch (e) {
      setPayOpen(false);
      setSaleError(e instanceof Error ? e.message : "No se pudo registrar la venta.");
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-5 lg:px-8 lg:py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-fg">Vender</h1>
        {lastSale && (
          <Link
            href={`/ticket/${lastSale.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-success-soft px-3 py-1.5 text-sm font-semibold text-success hover:brightness-95"
          >
            <CheckCircleIcon size={18} weight="fill" /> Venta #{lastSale.number} · Ver ticket
          </Link>
        )}
      </div>

      {/* Regla de caja: aviso + bloqueo cuando está cerrada */}
      {!cajaLoading && !cajaOpen && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/40 bg-warning-soft px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-warning">
            <LockIcon size={18} weight="fill" />
            Para realizar ventas primero tenés que abrir la caja.
          </span>
          <Link href="/caja" className="contents">
            <Button size="sm" variant="secondary">
              Abrir caja
            </Button>
          </Link>
        </div>
      )}

      {/* Error de venta */}
      {saleError && (
        <div className="flex items-start gap-2 rounded-lg border border-danger/40 bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          <WarningIcon size={18} weight="fill" className="mt-0.5 shrink-0" />
          <span>{saleError}</span>
        </div>
      )}

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
                    {p.sku ? `${p.sku} · ` : ""}
                    {p.stock <= 0 ? "Sin stock" : `Stock: ${p.stock}`}
                  </span>
                </span>
                <span className="tabular font-semibold text-fg">
                  {formatMoney(p.price, CURRENCY)}
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
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">
              {cart.length} {cart.length === 1 ? "producto" : "productos"}
            </span>
            <button
              onClick={clearCart}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-fg-muted hover:bg-danger-soft hover:text-danger"
            >
              <TrashIcon size={14} /> Vaciar carrito
            </button>
          </div>
          <ul className="divide-y divide-border border-t border-border">
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
                      <span className="text-sm text-fg-muted">{formatMoney(i.unitPrice, CURRENCY)}</span>
                    )}
                    {i.qty >= i.maxStock && <Badge tone="warning">Máx stock</Badge>}
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
                    disabled={i.qty >= i.maxStock}
                    aria-label="Más"
                    className="grid h-8 w-8 place-items-center rounded-md border border-border-strong text-fg hover:bg-surface-2 disabled:opacity-40"
                  >
                    <PlusIcon size={15} />
                  </button>
                </div>

                <span className="tabular w-24 text-right font-semibold text-fg">
                  {formatMoney(i.unitPrice * i.qty, CURRENCY)}
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
              <span className="tabular">{formatMoney(subtotal, CURRENCY)}</span>
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
            {discountTooHigh && (
              <p className="py-1 text-right text-xs font-medium text-warning">
                El descuento no puede superar el subtotal. Se ajustó a {formatMoney(subtotal, CURRENCY)}.
              </p>
            )}
            <div className="mt-1 flex items-center justify-between border-t border-border pt-2 text-lg font-bold text-fg">
              <span>Total</span>
              <span className="tabular">{formatMoney(total, CURRENCY)}</span>
            </div>
            <Button
              size="lg"
              className="mt-3 w-full"
              disabled={!canCharge}
              onClick={openPayment}
            >
              {cajaOpen ? (
                <>Cobrar {formatMoney(total, CURRENCY)}</>
              ) : (
                <>
                  <LockIcon size={18} /> Abrí la caja para cobrar
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <PaymentModal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        total={total}
        itemCount={cart.reduce((s, i) => s + i.qty, 0)}
        onConfirm={onConfirmPayment}
        submitting={createSale.isPending}
      />
    </div>
  );
}
