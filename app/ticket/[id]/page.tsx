"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  PrinterIcon,
  PlusCircleIcon,
} from "@phosphor-icons/react";

import { formatDate, formatMoney } from "@/lib/format";
import { useSaleTicket } from "@/commerce/sales/hooks";
import { PAYMENT_LABELS } from "@/commerce/sales/schemas";
import { Button } from "@/components/ui";

export default function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading, isError } = useSaleTicket(id);

  if (isLoading) {
    return <div className="grid min-h-dvh place-items-center text-fg-subtle">Cargando…</div>;
  }

  if (isError || !data) {
    return (
      <div className="grid min-h-dvh place-items-center px-6 text-center">
        <div>
          <p className="font-display text-lg font-bold text-fg">Ticket no encontrado</p>
          <p className="mt-1 text-sm text-fg-muted">
            No pudimos encontrar esa venta.
          </p>
          <Link href="/pos" className="mt-4 inline-block font-semibold text-accent">
            Volver a vender
          </Link>
        </div>
      </div>
    );
  }

  const { sale, business } = data;
  const currency = business.currency;

  return (
    <div className="min-h-dvh bg-bg px-4 py-6">
      <div className="mx-auto max-w-sm">
        <div className="no-print mb-4 flex items-center justify-between">
          <Link
            href="/pos"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-fg-muted hover:text-fg"
          >
            <ArrowLeftIcon size={17} /> Volver
          </Link>
          <span className="rounded-full bg-success-soft px-3 py-1 text-xs font-bold text-success">
            Venta registrada
          </span>
        </div>

        {/* Ticket */}
        <div className="rounded-xl border border-border bg-surface px-6 py-6 shadow-sm print:border-0 print:shadow-none">
          <header className="border-b border-dashed border-border-strong pb-4 text-center">
            <h1 className="font-display text-lg font-bold text-fg">{business.name}</h1>
            {business.legalName && (
              <p className="text-xs text-fg-muted">{business.legalName}</p>
            )}
            {business.taxId && (
              <p className="tabular text-xs text-fg-subtle">CUIT {business.taxId}</p>
            )}
            {business.address && (
              <p className="text-xs text-fg-subtle">{business.address}</p>
            )}
          </header>

          <div className="flex items-center justify-between border-b border-dashed border-border-strong py-3 text-xs text-fg-muted">
            <span>
              Ticket <span className="tabular font-bold text-fg">#{sale.number}</span>
            </span>
            <span className="tabular">{formatDate(sale.createdAt)}</span>
          </div>

          <ul className="divide-y divide-border py-2">
            {sale.items.map((item, idx) => (
              <li key={idx} className="py-2">
                <div className="flex justify-between gap-2">
                  <span className="text-sm font-medium text-fg">{item.name}</span>
                  <span className="tabular text-sm font-semibold text-fg">
                    {formatMoney(item.subtotal, currency)}
                  </span>
                </div>
                <span className="tabular text-xs text-fg-subtle">
                  {item.qty} × {formatMoney(item.unitPrice, currency)}
                </span>
              </li>
            ))}
          </ul>

          <div className="border-t border-dashed border-border-strong pt-3 text-sm">
            <Row label="Subtotal" value={formatMoney(sale.subtotal, currency)} />
            {sale.discount > 0 && (
              <Row label="Descuento" value={`- ${formatMoney(sale.discount, currency)}`} />
            )}
            <div className="mt-1 flex justify-between border-t border-border pt-2">
              <span className="font-display text-base font-bold text-fg">TOTAL</span>
              <span className="tabular font-display text-base font-bold text-fg">
                {formatMoney(sale.total, currency)}
              </span>
            </div>
          </div>

          <div className="mt-3 rounded-lg bg-surface-2 px-3 py-2 text-sm">
            {sale.payments.map((p, idx) => (
              <Row key={idx} label={PAYMENT_LABELS[p.method]} value={formatMoney(p.amount, currency)} />
            ))}
          </div>

          <p className="mt-5 text-center text-xs text-fg-subtle">
            ¡Gracias por su compra!
          </p>
        </div>

        <div className="no-print mt-4 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => window.print()}>
            <PrinterIcon size={18} /> Imprimir
          </Button>
          <Link href="/pos" className="contents">
            <Button className="w-full">
              <PlusCircleIcon size={18} /> Nueva venta
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className="text-fg-muted">{label}</span>
      <span className="tabular font-medium text-fg">{value}</span>
    </div>
  );
}
