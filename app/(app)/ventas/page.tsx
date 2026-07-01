"use client";

import Link from "next/link";
import { ReceiptIcon, ProhibitIcon, PrinterIcon } from "@phosphor-icons/react";

import { Badge, EmptyState } from "@/components/ui";
import { formatMoney, formatDate } from "@/lib/format";
import { APP_CONFIG } from "@/shared/config/app";
import { useSession } from "@/core/auth/auth-client";
import { useRecentSales, useCancelSale } from "@/commerce/sales/hooks";
import { PAYMENT_LABELS, type SaleDTO } from "@/commerce/sales/schemas";

const CURRENCY = APP_CONFIG.defaultCurrency;

export default function VentasPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const sales = useRecentSales(80);
  const cancel = useCancelSale();

  function onCancel(sale: SaleDTO) {
    if (
      !window.confirm(
        `¿Anular la venta #${sale.number} por ${formatMoney(sale.total, CURRENCY)}? Se va a devolver el stock. Esta acción no se puede deshacer.`
      )
    )
      return;
    cancel.mutate(sale.id);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 lg:px-8 lg:py-8">
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold text-fg">Ventas</h1>
        <p className="text-sm text-fg-muted">Historial de ventas y comprobantes.</p>
      </div>

      {cancel.error && (
        <p className="mb-4 rounded-lg bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {(cancel.error as Error).message}
        </p>
      )}

      {sales.isLoading ? (
        <p className="py-16 text-center text-sm text-fg-muted">Cargando ventas…</p>
      ) : (sales.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={<ReceiptIcon size={34} />}
          title="Todavía no hay ventas"
          description="Cuando registres ventas en el POS las vas a ver acá."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <ul className="divide-y divide-border">
            {sales.data!.map((s) => {
              const cancelled = s.status === "CANCELLED";
              const units = s.items.reduce((n, i) => n + i.qty, 0);
              const methods = s.payments.map((p) => PAYMENT_LABELS[p.method]).join(" + ");
              return (
                <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-semibold text-fg">
                      Venta #{s.number}
                      {cancelled && <Badge tone="danger">Anulada</Badge>}
                    </p>
                    <p className="text-xs text-fg-subtle">
                      {formatDate(s.createdAt)} · {units} {units === 1 ? "unidad" : "unidades"}
                      {methods ? ` · ${methods}` : ""}
                    </p>
                  </div>

                  <span
                    className={`tabular w-28 text-right font-semibold ${
                      cancelled ? "text-fg-subtle line-through" : "text-fg"
                    }`}
                  >
                    {formatMoney(s.total, CURRENCY)}
                  </span>

                  <div className="flex items-center gap-1">
                    <Link
                      href={`/ticket/${s.id}`}
                      className="grid h-8 w-8 place-items-center rounded-md text-fg-muted hover:bg-surface-2 hover:text-fg"
                      aria-label={`Ver ticket de la venta ${s.number}`}
                      title="Ver / imprimir ticket"
                    >
                      <PrinterIcon size={17} />
                    </Link>
                    {isAdmin && !cancelled && (
                      <button
                        onClick={() => onCancel(s)}
                        disabled={cancel.isPending}
                        className="grid h-8 w-8 place-items-center rounded-md text-fg-muted hover:bg-danger-soft hover:text-danger disabled:opacity-40"
                        aria-label={`Anular venta ${s.number}`}
                        title="Anular venta"
                      >
                        <ProhibitIcon size={17} />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
