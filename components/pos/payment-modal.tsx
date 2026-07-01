"use client";

import { useMemo, useState } from "react";
import {
  BankIcon,
  CreditCardIcon,
  MoneyIcon,
} from "@phosphor-icons/react";
import { useStore } from "@/lib/store";
import type { PaymentMethod, Sale } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { Button, Field, Input, Modal, cx } from "@/components/ui";

const METHODS: { id: PaymentMethod; label: string; icon: typeof MoneyIcon }[] = [
  { id: "efectivo", label: "Efectivo", icon: MoneyIcon },
  { id: "tarjeta", label: "Tarjeta", icon: CreditCardIcon },
  { id: "transferencia", label: "Transfer.", icon: BankIcon },
];

function cashSuggestions(total: number): number[] {
  const out = new Set<number>();
  out.add(Math.ceil(total / 100) * 100);
  for (const step of [500, 1000, 2000, 5000, 10000]) {
    const up = Math.ceil(total / step) * step;
    if (up > total) out.add(up);
  }
  return [...out].sort((a, b) => a - b).slice(0, 4);
}

export function PaymentModal({
  open,
  onClose,
  total,
  currency,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  total: number;
  currency: string;
  onDone: (sale: Sale) => void;
}) {
  const checkout = useStore((s) => s.checkout);
  const [method, setMethod] = useState<PaymentMethod>("efectivo");
  const [cash, setCash] = useState<string>("");

  const cashReceived = cash === "" ? NaN : Number(cash);
  const change = Number.isFinite(cashReceived) ? cashReceived - total : 0;
  const suggestions = useMemo(() => cashSuggestions(total), [total]);

  const cashShort = method === "efectivo" && Number.isFinite(cashReceived) && cashReceived < total;
  const canConfirm = method !== "efectivo" || cash === "" || !cashShort;

  function confirm() {
    const sale = checkout({
      paymentMethod: method,
      cashReceived:
        method === "efectivo" && Number.isFinite(cashReceived)
          ? cashReceived
          : undefined,
    });
    if (sale) {
      setCash("");
      setMethod("efectivo");
      onDone(sale);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cobrar"
      footer={
        <div className="flex flex-col gap-3">
          {method === "efectivo" && Number.isFinite(cashReceived) && !cashShort && (
            <div className="flex items-center justify-between rounded-lg bg-success-soft px-3 py-2 text-success">
              <span className="text-sm font-semibold">Vuelto</span>
              <span className="tabular font-display text-lg font-bold">
                {formatMoney(change, currency)}
              </span>
            </div>
          )}
          <Button
            size="lg"
            variant="success"
            onClick={confirm}
            disabled={!canConfirm}
            className="w-full"
          >
            Confirmar {formatMoney(total, currency)}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="rounded-xl bg-surface-2 px-4 py-3 text-center">
          <p className="text-sm font-medium text-fg-muted">Total a cobrar</p>
          <p className="tabular font-display text-3xl font-bold text-fg">
            {formatMoney(total, currency)}
          </p>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-fg-muted">Medio de pago</p>
          <div className="grid grid-cols-3 gap-2">
            {METHODS.map((m) => {
              const Icon = m.icon;
              const active = method === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  aria-pressed={active}
                  className={cx(
                    "flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-sm font-semibold transition-colors",
                    active
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-border-strong text-fg-muted hover:bg-surface-2"
                  )}
                >
                  <Icon size={22} weight={active ? "fill" : "regular"} />
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {method === "efectivo" && (
          <div className="flex flex-col gap-3">
            <Field label="Paga con" htmlFor="cash-in" error={cashShort ? "Menor al total" : undefined}>
              <Input
                id="cash-in"
                inputMode="numeric"
                placeholder={formatMoney(total, currency)}
                value={cash}
                onChange={(e) => setCash(e.target.value.replace(/[^\d.]/g, ""))}
                autoFocus
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCash(String(total))}
                className="rounded-lg border border-border-strong px-3 py-1.5 text-sm font-semibold text-fg-muted hover:bg-surface-2"
              >
                Justo
              </button>
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setCash(String(s))}
                  className="rounded-lg border border-border-strong px-3 py-1.5 text-sm font-semibold text-fg-muted hover:bg-surface-2 tabular"
                >
                  {formatMoney(s, currency)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
