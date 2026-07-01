"use client";

import { useEffect, useMemo, useState } from "react";

import { Button, Field, Input, Modal, cx } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import {
  PAYMENT_LABELS,
  PAYMENT_METHODS,
  type PaymentMethod,
} from "../schemas";

type PaymentLine = { method: PaymentMethod; amount: number };

export function PaymentModal({
  open,
  onClose,
  total,
  onConfirm,
  submitting,
}: {
  open: boolean;
  onClose: () => void;
  total: number;
  onConfirm: (payments: PaymentLine[]) => void;
  submitting: boolean;
}) {
  const [mixed, setMixed] = useState(false);
  const [amounts, setAmounts] = useState<Record<PaymentMethod, string>>({
    EFECTIVO: "",
    DEBITO: "",
    CREDITO: "",
    TRANSFERENCIA: "",
    MERCADO_PAGO: "",
  });
  const [cashReceived, setCashReceived] = useState("");

  useEffect(() => {
    if (open) {
      setMixed(false);
      setAmounts({ EFECTIVO: "", DEBITO: "", CREDITO: "", TRANSFERENCIA: "", MERCADO_PAGO: "" });
      setCashReceived("");
    }
  }, [open]);

  const paid = useMemo(
    () => PAYMENT_METHODS.reduce((s, m) => s + (Number(amounts[m]) || 0), 0),
    [amounts]
  );
  const remaining = Math.round((total - paid) * 100) / 100;

  const received = Number(cashReceived) || 0;
  const change = received > total ? received - total : 0;

  function paySingle(method: PaymentMethod) {
    onConfirm([{ method, amount: total }]);
  }

  function confirmMixed() {
    const payments = PAYMENT_METHODS.map((m) => ({
      method: m,
      amount: Number(amounts[m]) || 0,
    })).filter((p) => p.amount > 0);
    onConfirm(payments);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Cobrar ${formatMoney(total, "ARS")}`}
      footer={
        mixed ? (
          <div className="flex items-center justify-between gap-2">
            <span
              className={cx(
                "text-sm font-semibold",
                Math.abs(remaining) < 0.01 ? "text-success" : "text-fg-muted"
              )}
            >
              Restante: {formatMoney(remaining, "ARS")}
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setMixed(false)}>
                Volver
              </Button>
              <Button
                onClick={confirmMixed}
                disabled={submitting || Math.abs(remaining) >= 0.01}
              >
                {submitting ? "Cobrando…" : "Confirmar"}
              </Button>
            </div>
          </div>
        ) : undefined
      }
    >
      {!mixed ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((m) => (
              <Button
                key={m}
                variant="secondary"
                size="lg"
                disabled={submitting}
                onClick={() => paySingle(m)}
                className="justify-start"
              >
                {PAYMENT_LABELS[m]}
              </Button>
            ))}
          </div>

          <div className="rounded-lg border border-border bg-surface-2 p-3">
            <Field label="Efectivo recibido (opcional)" htmlFor="cash">
              <Input
                id="cash"
                inputMode="decimal"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value.replace(/[^\d.]/g, ""))}
                placeholder="0"
                className="h-10"
              />
            </Field>
            {change > 0 && (
              <p className="mt-2 text-sm font-semibold text-success">
                Vuelto: {formatMoney(change, "ARS")}
              </p>
            )}
          </div>

          <Button variant="ghost" onClick={() => setMixed(true)} disabled={submitting}>
            Pago mixto (combinar formas)
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {PAYMENT_METHODS.map((m) => (
            <Field key={m} label={PAYMENT_LABELS[m]} htmlFor={`mix-${m}`}>
              <Input
                id={`mix-${m}`}
                inputMode="decimal"
                value={amounts[m]}
                onChange={(e) =>
                  setAmounts((a) => ({ ...a, [m]: e.target.value.replace(/[^\d.]/g, "") }))
                }
                placeholder="0"
                className="h-10"
              />
            </Field>
          ))}
        </div>
      )}
    </Modal>
  );
}
