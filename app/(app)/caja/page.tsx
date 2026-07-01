"use client";

import { useState } from "react";
import { LockIcon, LockOpenIcon } from "@phosphor-icons/react";

import { formatDate, formatMoney, formatTime } from "@/lib/format";
import { APP_CONFIG } from "@/shared/config/app";
import {
  useCashSession,
  useCloseCash,
  useClosedSessions,
  useOpenCash,
} from "@/commerce/cash/hooks";
import type { CashClosedSummaryDTO, CashSessionDTO } from "@/commerce/cash/schemas";
import { Badge, Button, Card, Field, Input, Modal } from "@/components/ui";

const CURRENCY = APP_CONFIG.defaultCurrency;
const onlyAmount = (v: string) => v.replace(/[^\d.]/g, "");

export default function CajaPage() {
  const { data: session, isLoading, error } = useCashSession();
  const closed = useClosedSessions();

  const openCash = useOpenCash();
  const closeCash = useCloseCash();

  const [openAmount, setOpenAmount] = useState("");
  const [closeOpen, setCloseOpen] = useState(false);
  const [counted, setCounted] = useState("");
  const [closeNote, setCloseNote] = useState("");

  const openingNum = Number(openAmount);
  const openingValid = openAmount !== "" && Number.isFinite(openingNum) && openingNum >= 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 lg:px-8 lg:py-8">
      <h1 className="mb-1 font-display text-2xl font-bold text-fg">Caja</h1>
      <p className="mb-5 text-sm text-fg-muted">
        Arqueo y control de efectivo del turno.
      </p>

      {isLoading ? (
        <p className="py-16 text-center text-sm text-fg-muted">Cargando caja…</p>
      ) : error ? (
        <Card className="px-5 py-6">
          <p className="text-sm text-danger">
            No se pudo cargar la caja: {(error as Error).message}
          </p>
        </Card>
      ) : !session ? (
        <OpenCard
          value={openAmount}
          onChange={setOpenAmount}
          valid={openingValid}
          pending={openCash.isPending}
          error={openCash.error ? (openCash.error as Error).message : null}
          onOpen={() => {
            if (!openingValid) return;
            openCash.mutate(
              { openingAmount: openingNum },
              { onSuccess: () => setOpenAmount("") }
            );
          }}
        />
      ) : (
        <OpenSessionView
          session={session}
          onClose={() => {
            setCounted("");
            setCloseNote("");
            setCloseOpen(true);
          }}
        />
      )}

      {closed.data && closed.data.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-lg font-bold text-fg">
            Cierres anteriores
          </h2>
          <div className="flex flex-col gap-2">
            {closed.data.map((s) => (
              <ClosedRow key={s.id} session={s} />
            ))}
          </div>
        </section>
      )}

      {/* Close modal */}
      {session && (
        <CloseModal
          open={closeOpen}
          onClose={() => setCloseOpen(false)}
          session={session}
          counted={counted}
          setCounted={setCounted}
          note={closeNote}
          setNote={setCloseNote}
          pending={closeCash.isPending}
          error={closeCash.error ? (closeCash.error as Error).message : null}
          onConfirm={() => {
            if (counted === "" || Number(counted) < 0) return;
            closeCash.mutate(
              { countedAmount: Number(counted) || 0, note: closeNote.trim() || undefined },
              { onSuccess: () => setCloseOpen(false) }
            );
          }}
        />
      )}
    </div>
  );
}

function OpenCard({
  value,
  onChange,
  onOpen,
  valid,
  pending,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  onOpen: () => void;
  valid: boolean;
  pending: boolean;
  error: string | null;
}) {
  return (
    <Card className="px-5 py-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent-soft text-accent">
          <LockIcon size={22} />
        </span>
        <div>
          <p className="font-display text-lg font-bold text-fg">Caja cerrada</p>
          <p className="text-sm text-fg-muted">
            Abrí la caja con el efectivo inicial para empezar a vender.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Field label="Fondo inicial" htmlFor="open-amount" hint="Efectivo en la caja al abrir">
            <Input
              id="open-amount"
              inputMode="decimal"
              value={value}
              onChange={(e) => onChange(onlyAmount(e.target.value))}
              placeholder="0"
            />
          </Field>
        </div>
        <Button size="lg" onClick={onOpen} disabled={!valid || pending}>
          <LockOpenIcon size={18} /> {pending ? "Abriendo…" : "Abrir caja"}
        </Button>
      </div>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </Card>
  );
}

function OpenSessionView({
  session,
  onClose,
}: {
  session: CashSessionDTO;
  onClose: () => void;
}) {
  const m = session.metrics;

  return (
    <div className="flex flex-col gap-4">
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between bg-success-soft px-5 py-3">
          <span className="flex items-center gap-2 font-semibold text-success">
            <LockOpenIcon size={18} weight="fill" /> Caja abierta
          </span>
          <span className="text-xs text-success">
            desde {formatTime(session.openedAt)}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-px bg-border">
          <Metric label="Fondo inicial" value={formatMoney(m.openingAmount, CURRENCY)} />
          <Metric label="Ventas en efectivo" value={formatMoney(m.cashSales, CURRENCY)} />
        </div>
        <div className="flex items-center justify-between px-5 py-4">
          <span className="font-display font-bold text-fg">Efectivo esperado</span>
          <span className="tabular font-display text-2xl font-bold text-fg">
            {formatMoney(m.expectedCash, CURRENCY)}
          </span>
        </div>
      </Card>

      <Button variant="danger" onClick={onClose}>
        <LockIcon size={18} /> Cerrar caja
      </Button>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface px-4 py-3">
      <p className="text-xs text-fg-subtle">{label}</p>
      <p className="tabular mt-0.5 font-semibold text-fg">{value}</p>
    </div>
  );
}

function ClosedRow({ session: s }: { session: CashClosedSummaryDTO }) {
  return (
    <Card className="px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-fg">{formatDate(s.openedAt)}</p>
          <p className="text-xs text-fg-subtle">
            Cerrada {s.closedAt ? formatTime(s.closedAt) : ""}
          </p>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div>
            <p className="text-xs text-fg-subtle">Esperado</p>
            <p className="tabular text-sm font-semibold text-fg">
              {formatMoney(s.expectedCash, CURRENCY)}
            </p>
          </div>
          <div>
            <p className="text-xs text-fg-subtle">Contado</p>
            <p className="tabular text-sm font-semibold text-fg">
              {s.countedAmount == null ? "—" : formatMoney(s.countedAmount, CURRENCY)}
            </p>
          </div>
          {s.difference != null && (
            <Badge
              tone={
                s.difference === 0
                  ? "success"
                  : s.difference > 0
                    ? "accent"
                    : "danger"
              }
            >
              {s.difference === 0
                ? "Exacto"
                : `${s.difference > 0 ? "+" : ""}${formatMoney(s.difference, CURRENCY)}`}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}

function CloseModal({
  open,
  onClose,
  session,
  counted,
  setCounted,
  note,
  setNote,
  onConfirm,
  pending,
  error,
}: {
  open: boolean;
  onClose: () => void;
  session: CashSessionDTO;
  counted: string;
  setCounted: (v: string) => void;
  note: string;
  setNote: (v: string) => void;
  onConfirm: () => void;
  pending: boolean;
  error: string | null;
}) {
  const expected = session.metrics.expectedCash;
  const countedNum = Number(counted) || 0;
  const diff = counted === "" ? null : countedNum - expected;
  const canConfirm = counted !== "" && countedNum >= 0 && !pending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cerrar caja"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={!canConfirm}>
            {pending ? "Cerrando…" : "Confirmar cierre"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-fg-muted">
          Vas a cerrar el turno actual. Revisá el arqueo antes de confirmar.
        </p>
        <div className="flex items-center justify-between rounded-lg bg-surface-2 px-4 py-3">
          <span className="text-sm font-medium text-fg-muted">Efectivo esperado</span>
          <span className="tabular font-display text-lg font-bold text-fg">
            {formatMoney(expected, CURRENCY)}
          </span>
        </div>
        <Field label="Efectivo contado" htmlFor="counted" hint="Lo que hay realmente en la caja" required>
          <Input
            id="counted"
            inputMode="decimal"
            value={counted}
            onChange={(e) => setCounted(onlyAmount(e.target.value))}
            placeholder="0"
            autoFocus
          />
        </Field>
        {diff != null && (
          <div
            className={`flex items-center justify-between rounded-lg px-4 py-2.5 ${
              diff === 0
                ? "bg-success-soft text-success"
                : diff > 0
                  ? "bg-accent-soft text-accent"
                  : "bg-danger-soft text-danger"
            }`}
          >
            <span className="text-sm font-semibold">
              {diff === 0 ? "Sin diferencia" : diff > 0 ? "Sobrante" : "Faltante"}
            </span>
            <span className="tabular font-display font-bold">
              {diff > 0 ? "+" : ""}
              {formatMoney(diff, CURRENCY)}
            </span>
          </div>
        )}
        <Field label="Nota" htmlFor="close-note" hint="Opcional">
          <Input
            id="close-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Observaciones del cierre"
          />
        </Field>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </Modal>
  );
}
