"use client";

import { useMemo, useState } from "react";
import {
  ChartBarIcon,
  ReceiptIcon,
  StackIcon,
  TrendUpIcon,
} from "@phosphor-icons/react";
import {
  summarizeSales,
  topProducts,
  useCurrency,
  useSales,
} from "@/lib/selectors";
import { formatMoney } from "@/lib/format";
import type { PaymentMethod, Sale } from "@/lib/types";
import { Badge, Card, EmptyState, cx } from "@/components/ui";

type Period = "today" | "7d" | "30d";

const PERIODS: { id: Period; label: string; days: number }[] = [
  { id: "today", label: "Hoy", days: 1 },
  { id: "7d", label: "7 días", days: 7 },
  { id: "30d", label: "30 días", days: 30 },
];

const METHOD_LABEL: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
};
const METHOD_COLOR: Record<PaymentMethod, string> = {
  efectivo: "var(--success)",
  tarjeta: "var(--accent)",
  transferencia: "var(--warning)",
};

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

interface DayBucket {
  key: string;
  label: string;
  total: number;
}

function dailySeries(sales: Sale[], days: number): DayBucket[] {
  const today = startOfDay(new Date());
  const buckets: DayBucket[] = [];
  const byKey = new Map<string, number>();
  for (const s of sales) {
    const k = startOfDay(new Date(s.createdAt)).toISOString();
    byKey.set(k, (byKey.get(k) ?? 0) + s.total);
  }
  const fmt = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit" });
  const fmtDow = new Intl.DateTimeFormat("es-AR", { weekday: "short" });
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const k = d.toISOString();
    buckets.push({
      key: k,
      label: days <= 7 ? fmtDow.format(d) : fmt.format(d),
      total: byKey.get(k) ?? 0,
    });
  }
  return buckets;
}

export default function ReportesPage() {
  const sales = useSales();
  const currency = useCurrency();
  const [period, setPeriod] = useState<Period>("7d");

  const days = PERIODS.find((p) => p.id === period)!.days;

  const periodSales = useMemo(() => {
    const from = startOfDay(new Date());
    from.setDate(from.getDate() - (days - 1));
    return sales.filter((s) => new Date(s.createdAt) >= from);
  }, [sales, days]);

  const summary = useMemo(() => summarizeSales(periodSales), [periodSales]);
  const series = useMemo(() => dailySeries(periodSales, days), [periodSales, days]);
  const top = useMemo(() => topProducts(periodSales, 5), [periodSales]);
  const maxDay = Math.max(1, ...series.map((b) => b.total));
  const avgTicket = summary.count > 0 ? summary.total / summary.count : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 lg:px-8 lg:py-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-fg">Reportes</h1>
        <div className="flex rounded-lg border border-border-strong bg-surface p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={cx(
                "rounded-md px-3 py-1.5 text-sm font-semibold transition-colors",
                period === p.id
                  ? "bg-accent text-accent-fg"
                  : "text-fg-muted hover:text-fg"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {sales.length === 0 ? (
        <EmptyState
          icon={<ChartBarIcon size={34} />}
          title="Todavía no hay ventas"
          description="Cuando registres ventas vas a ver acá los totales, los medios de pago y los productos más vendidos."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi
              icon={<TrendUpIcon size={18} />}
              label="Ventas"
              value={formatMoney(summary.total, currency)}
            />
            <Kpi
              icon={<ReceiptIcon size={18} />}
              label="Tickets"
              value={String(summary.count)}
            />
            <Kpi
              icon={<StackIcon size={18} />}
              label="Unidades"
              value={String(summary.items)}
            />
            <Kpi
              icon={<TrendUpIcon size={18} />}
              label="Ticket promedio"
              value={formatMoney(avgTicket, currency)}
            />
          </div>

          {/* Daily chart */}
          <Card className="px-5 py-4">
            <p className="mb-4 font-display font-bold text-fg">Ventas por día</p>
            <div className="flex h-44 items-end gap-1.5">
              {series.map((b) => (
                <div key={b.key} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                  <div className="flex w-full flex-1 items-end" title={`${b.label}: ${formatMoney(b.total, currency)}`}>
                    <div
                      className="w-full rounded-t bg-accent transition-[height] duration-300"
                      style={{
                        height: `${(b.total / maxDay) * 100}%`,
                        minHeight: b.total > 0 ? 4 : 0,
                      }}
                    />
                  </div>
                  <span className="w-full truncate text-center text-[10px] text-fg-subtle">
                    {b.label}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Payment methods */}
            <Card className="px-5 py-4">
              <p className="mb-3 font-display font-bold text-fg">Medios de pago</p>
              {summary.count === 0 ? (
                <p className="py-6 text-center text-sm text-fg-muted">
                  Sin ventas en este período.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {(Object.keys(METHOD_LABEL) as PaymentMethod[]).map((method) => {
                    const val = summary.byMethod[method] ?? 0;
                    const pct = summary.total > 0 ? (val / summary.total) * 100 : 0;
                    return (
                      <li key={method}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="font-medium text-fg">{METHOD_LABEL[method]}</span>
                          <span className="tabular text-fg-muted">
                            {formatMoney(val, currency)}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: METHOD_COLOR[method] }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            {/* Top products */}
            <Card className="px-5 py-4">
              <p className="mb-3 font-display font-bold text-fg">Más vendidos</p>
              {top.length === 0 ? (
                <p className="py-6 text-center text-sm text-fg-muted">
                  Sin ventas en este período.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {top.map((p, i) => (
                    <li key={p.productId} className="flex items-center gap-3">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-surface-2 text-sm font-bold text-fg-muted tabular">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">
                        {p.name}
                      </span>
                      <Badge tone="neutral">{p.qty} u.</Badge>
                      <span className="tabular w-24 text-right text-sm font-semibold text-fg">
                        {formatMoney(p.revenue, currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="px-4 py-3.5">
      <div className="mb-1.5 flex items-center gap-1.5 text-fg-subtle">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="tabular font-display text-xl font-bold text-fg">{value}</p>
    </Card>
  );
}
