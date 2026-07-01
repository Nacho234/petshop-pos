"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MagnifyingGlassIcon,
  MinusIcon,
  PlusIcon,
  ShoppingCartIcon,
  TrashIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { useStore } from "@/lib/store";
import {
  useCartTotals,
  useCategories,
  useCurrency,
  useOpenSession,
  useProducts,
} from "@/lib/selectors";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/lib/types";
import { Badge, Button, EmptyState, Modal, cx } from "@/components/ui";
import { PaymentModal } from "@/components/pos/payment-modal";

const LOW_STOCK = 5;

export default function PosPage() {
  const router = useRouter();
  const products = useProducts();
  const categories = useCategories();
  const currency = useCurrency();
  const openSession = useOpenSession();
  const cart = useStore((s) => s.cart);
  const addToCart = useStore((s) => s.addToCart);
  const totals = useCartTotals();

  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string | "all">("all");
  const [cartOpen, setCartOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (cat !== "all" && p.categoryId !== cat) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.sku ?? "").toLowerCase().includes(q)
      );
    });
  }, [products, query, cat]);

  function openPay() {
    setCartOpen(false);
    setPayOpen(true);
  }

  return (
    <div className="flex h-dvh flex-col lg:flex-row">
      {/* Products column */}
      <section className="flex min-h-0 flex-1 flex-col">
        <div className="border-b border-border bg-surface/80 px-4 py-3 backdrop-blur lg:px-6">
          <div className="mb-3 flex items-center justify-between">
            <h1 className="font-display text-xl font-bold text-fg">Vender</h1>
            {!openSession && (
              <Link
                href="/caja"
                className="hidden items-center gap-1.5 rounded-lg bg-warning-soft px-2.5 py-1 text-xs font-semibold text-warning sm:inline-flex"
              >
                <WarningCircleIcon size={15} weight="fill" />
                Caja cerrada
              </Link>
            )}
          </div>
          <div className="relative">
            <MagnifyingGlassIcon
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar producto o código…"
              className="h-11 w-full rounded-lg border border-border-strong bg-surface pl-10 pr-3 text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
            />
          </div>
          {categories.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              <Chip active={cat === "all"} onClick={() => setCat("all")}>
                Todo
              </Chip>
              {categories.map((c) => (
                <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
                  {c.name}
                </Chip>
              ))}
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 lg:px-6">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<MagnifyingGlassIcon size={34} />}
              title="Sin resultados"
              description="No encontramos productos con ese criterio. Probá con otro nombre o categoría."
            />
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
              {filtered.map((p) => (
                <ProductButton
                  key={p.id}
                  product={p}
                  currency={currency}
                  onAdd={() => addToCart(p.id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Desktop cart */}
      <aside className="hidden w-[22rem] shrink-0 border-l border-border bg-surface lg:flex lg:flex-col">
        <CartContents currency={currency} onCheckout={openPay} />
      </aside>

      {/* Mobile cart bar */}
      {totals.count > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 px-3 lg:hidden">
          <button
            onClick={() => setCartOpen(true)}
            className="flex w-full items-center justify-between rounded-xl bg-accent px-4 py-3 text-accent-fg shadow-lg"
          >
            <span className="flex items-center gap-2 font-semibold">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-white/20 text-xs">
                {totals.count}
              </span>
              Ver carrito
            </span>
            <span className="tabular font-display text-lg font-bold">
              {formatMoney(totals.total, currency)}
            </span>
          </button>
        </div>
      )}

      {/* Mobile cart sheet */}
      <Modal
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        title="Carrito"
        size="lg"
      >
        <CartContents currency={currency} onCheckout={openPay} embedded />
      </Modal>

      <PaymentModal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        total={totals.total}
        currency={currency}
        onDone={(sale) => {
          setPayOpen(false);
          router.push(`/ticket/${sale.id}`);
        }}
      />
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "shrink-0 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors",
        active
          ? "border-accent bg-accent text-accent-fg"
          : "border-border-strong text-fg-muted hover:bg-surface-2"
      )}
    >
      {children}
    </button>
  );
}

function ProductButton({
  product,
  currency,
  onAdd,
}: {
  product: Product;
  currency: string;
  onAdd: () => void;
}) {
  const out = product.trackStock && product.stock <= 0;
  const low = product.trackStock && product.stock > 0 && product.stock <= LOW_STOCK;
  return (
    <button
      onClick={onAdd}
      disabled={out}
      className={cx(
        "flex min-h-[6.5rem] flex-col justify-between rounded-xl border border-border bg-surface p-3 text-left transition-[transform,background-color] active:scale-[0.98]",
        out
          ? "cursor-not-allowed opacity-55"
          : "hover:border-accent/60 hover:bg-accent-soft/40"
      )}
    >
      <span className="line-clamp-2 text-sm font-semibold leading-snug text-fg">
        {product.name}
      </span>
      <span className="mt-2 flex items-center justify-between">
        <span className="tabular font-display font-bold text-fg">
          {formatMoney(product.price, currency)}
        </span>
        {out ? (
          <Badge tone="danger">Sin stock</Badge>
        ) : low ? (
          <Badge tone="warning">{product.stock} u.</Badge>
        ) : product.trackStock ? (
          <span className="tabular text-xs text-fg-subtle">{product.stock} u.</span>
        ) : null}
      </span>
    </button>
  );
}

function CartContents({
  currency,
  onCheckout,
  embedded,
}: {
  currency: string;
  onCheckout: () => void;
  embedded?: boolean;
}) {
  const cart = useStore((s) => s.cart);
  const setQty = useStore((s) => s.setCartQty);
  const removeItem = useStore((s) => s.removeFromCart);
  const clearCart = useStore((s) => s.clearCart);
  const discount = useStore((s) => s.cartDiscount);
  const setDiscount = useStore((s) => s.setCartDiscount);
  const totals = useCartTotals();

  if (cart.length === 0 && !embedded) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <ShoppingCartIcon size={40} className="text-fg-subtle" />
        <div>
          <p className="font-display font-semibold text-fg">Carrito vacío</p>
          <p className="mt-1 text-sm text-fg-muted">
            Tocá un producto para empezar la venta.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cx("flex flex-col", embedded ? "gap-0" : "h-full")}>
      {!embedded && (
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-lg font-bold text-fg">Carrito</h2>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-sm font-semibold text-fg-muted hover:text-danger"
            >
              Vaciar
            </button>
          )}
        </div>
      )}

      <div className={cx("flex-1 overflow-y-auto", embedded ? "" : "px-3 py-3")}>
        <ul className="flex flex-col gap-1.5">
          {cart.map((item) => (
            <li
              key={item.productId}
              className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-surface-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-fg">{item.name}</p>
                <p className="tabular text-xs text-fg-subtle">
                  {formatMoney(item.price, currency)} c/u
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Stepper
                  label="Restar"
                  onClick={() => setQty(item.productId, item.qty - 1)}
                >
                  <MinusIcon size={15} weight="bold" />
                </Stepper>
                <span className="tabular w-7 text-center text-sm font-bold text-fg">
                  {item.qty}
                </span>
                <Stepper
                  label="Sumar"
                  onClick={() => setQty(item.productId, item.qty + 1)}
                >
                  <PlusIcon size={15} weight="bold" />
                </Stepper>
              </div>
              <span className="tabular w-20 text-right text-sm font-bold text-fg">
                {formatMoney(item.price * item.qty, currency)}
              </span>
              <button
                onClick={() => removeItem(item.productId)}
                aria-label={`Quitar ${item.name}`}
                className="grid h-8 w-8 place-items-center rounded-md text-fg-subtle hover:bg-danger-soft hover:text-danger"
              >
                <TrashIcon size={16} />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className={cx("border-t border-border", embedded ? "pt-4" : "px-5 py-4")}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <label htmlFor="discount" className="text-sm font-semibold text-fg-muted">
            Descuento
          </label>
          <div className="relative w-32">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle">
              $
            </span>
            <input
              id="discount"
              inputMode="numeric"
              value={discount === 0 ? "" : discount}
              onChange={(e) =>
                setDiscount(Number(e.target.value.replace(/[^\d.]/g, "")) || 0)
              }
              placeholder="0"
              className="tabular h-10 w-full rounded-lg border border-border-strong bg-surface pl-7 pr-3 text-right text-fg focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        <div className="mb-1 flex items-center justify-between text-sm text-fg-muted">
          <span>Subtotal</span>
          <span className="tabular">{formatMoney(totals.subtotal, currency)}</span>
        </div>
        {totals.discount > 0 && (
          <div className="mb-1 flex items-center justify-between text-sm text-success">
            <span>Descuento</span>
            <span className="tabular">- {formatMoney(totals.discount, currency)}</span>
          </div>
        )}
        <div className="mb-4 flex items-center justify-between">
          <span className="font-display text-base font-bold text-fg">Total</span>
          <span className="tabular font-display text-2xl font-bold text-fg">
            {formatMoney(totals.total, currency)}
          </span>
        </div>

        <Button
          size="lg"
          className="w-full"
          disabled={cart.length === 0}
          onClick={onCheckout}
        >
          Cobrar {totals.count > 0 && `· ${formatMoney(totals.total, currency)}`}
        </Button>
      </div>
    </div>
  );
}

function Stepper({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-md border border-border-strong text-fg-muted hover:bg-surface-2 hover:text-fg active:scale-95"
    >
      {children}
    </button>
  );
}
