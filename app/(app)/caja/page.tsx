"use client";

import { useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  LockIcon,
  LockOpenIcon,
  ReceiptIcon,
} from "@phosphor-icons/react";
import { useStore } from "@/lib/store";
import {
  computeSessionMetrics,
  useCurrency,
  useOpenSession,
  useSessions,
} from "@/lib/selectors";
import { formatDate, formatMoney, formatTime } from "@/lib/format";
import type { CashMovement, CashSession } from "@/lib/types";
import { Badge, Button, Card, Field, Input, Modal } from "@/components/ui";

export default function CajaPage() {
  const currency = useCurrency();
  const session = useOpenSession();
  const sessions = useSessions();
  const movements = useStore((s) => s.cashMovements);

  const openSession = useStore((s) => s.openSession);
  const closeSession = useStore((s) => s.closeSession);
  const addMovement = useStore((s) => s.addCashMovement);

  const [openAmount, setOpenAmount] = useState("");
  const [mvOpen, setMvOpen] = useState<null | "ingreso" | "egreso">(null);
  const [mvAmount, setMvAmount] = useState("");
  const [mvReason, setMvReason] = useState("");
  const [closeOpen, setCloseOpen] = useState(false);
  const [counted, setCounted] = useState("");
  const [closeNote, setCloseNote] = useState("");

  const closed = sessions.filter((s) => s.status === "closed");

  function submitMovement() {
    const amount = Number(mvAmount) || 0;
    if (!mvOpen || amount <= 0) return;
    addMovement(mvOpen, amount, mvReason);
    setMvAmount("");
    setMvReason("");
    setMvOpen(null);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 lg:px-8 lg:py-8">
      <h1 className="mb-1 font-display text-2xl font-bold text-fg">Caja</h1>
      <p className="mb-5 text-sm text-fg-muted">
        Arqueo y control de efectivo del turno.
      </p>

      {!session ? (
        <OpenCard
          value={openAmount}
          onChange={setOpenAmount}
          onOpen={() => {
            openSession(Number(openAmount) || 0);
            setOpenAmount("");
          }}
        />
      ) : (
        <OpenSessionView
          session={session}
          movements={movements}
          currency={currency}
          onIngreso={() => setMvOpen("ingreso")}
          onEgreso={() => setMvOpen("egreso")}
          onClose={() => {
            setCounted("");
            setCloseNote("");
            setCloseOpen(true);
          }}
        />
      )}

      {closed.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-lg font-bold text-fg">
            Cierres anteriores
          </h2>
          <div className="flex flex-col gap-2">
            {closed.map((s) => {
              const m = computeSessionMetrics(s, movements);
              return (
                <Card key={s.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-fg">
                        {formatDate(s.openedAt)}
                      </p>
                      <p className="text-xs text-fg-subtle">
                        Cerrada {s.closedAt ? formatTime(s.closedAt) : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="text-xs text-fg-subtle">Esperado</p>
                        <p className="tabular text-sm font-semibold text-fg">
                          {formatMoney(m.expectedCash, currency)}
                        </p>
                      </div>
                      {m.difference != null && (
                        <Badge
                          tone={
                            m.difference === 0
                              ? "success"
                              : m.difference > 0
                                ? "accent"
                                : "danger"
                          }
                        >
                          {m.difference === 0
                            ? "Exacto"
                            : `${m.difference > 0 ? "+" : ""}${formatMoney(m.difference, currency)}`}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Movement modal */}
      <Modal
        open={!!mvOpen}
        onClose={() => setMvOpen(null)}
        title={mvOpen === "ingreso" ? "Registrar ingreso" : "Registrar egreso"}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setMvOpen(null)}>
              Cancelar
            </Button>
            <Button onClick={submitMovement} disabled={!(Number(mvAmount) > 0)}>
              Registrar
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Monto" htmlFor="mv-amount" required>
            <Input
              id="mv-amount"
              inputMode="decimal"
              value={mvAmount}
              onChange={(e) => setMvAmount(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="0"
              autoFocus
            />
          </Field>
          <Field
            label="Motivo"
            htmlFor="mv-reason"
            hint={mvOpen === "egreso" ? "Ej. pago a proveedor, retiro" : "Ej. aporte de caja"}
          >
            <Input
              id="mv-reason"
              value={mvReason}
              onChange={(e) => setMvReason(e.target.value)}
              placeholder="Motivo"
            />
          </Field>
        </div>
      </Modal>

      {/* Close modal */}
      {session && (
        <CloseModal
          open={closeOpen}
          onClose={() => setCloseOpen(false)}
          session={session}
          movements={movements}
          currency={currency}
          counted={counted}
          setCounted={setCounted}
          note={closeNote}
          setNote={setCloseNote}
          onConfirm={() => {
            closeSession(session.id, Number(counted) || 0, closeNote.trim() || undefined);
            setCloseOpen(false);
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
}: {
  value: string;
  onChange: (v: string) => void;
  onOpen: () => void;
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
            Abrí la caja con el efectivo inicial para empezar el turno.
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
              onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="0"
            />
          </Field>
        </div>
        <Button size="lg" onClick={onOpen}>
          <LockOpenIcon size={18} /> Abrir caja
        </Button>
      </div>
    </Card>
  );
}

function OpenSessionView({
  session,
  movements,
  currency,
  onIngreso,
  onEgreso,
  onClose,
}: {
  session: CashSession;
  movements: CashMovement[];
  currency: string;
  onIngreso: () => void;
  onEgreso: () => void;
  onClose: () => void;
}) {
  const m = computeSessionMetrics(session, movements);
  const list = movements
    .filter((mv) => mv.sessionId === session.id)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

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
        <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
          <Metric label="Fondo inicial" value={formatMoney(session.openingAmount, currency)} />
          <Metric label="Ventas efectivo" value={formatMoney(m.cashSales, currency)} />
          <Metric label="Ingresos" value={formatMoney(m.income, currency)} />
          <Metric label="Egresos" value={formatMoney(m.expense, currency)} />
        </div>
        <div className="flex items-center justify-between px-5 py-4">
          <span className="font-display font-bold text-fg">Efectivo esperado</span>
          <span className="tabular font-display text-2xl font-bold text-fg">
            {formatMoney(m.expectedCash, currency)}
          </span>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Button variant="secondary" onClick={onIngreso}>
          <ArrowDownIcon size={18} className="text-success" /> Ingreso
        </Button>
        <Button variant="secondary" onClick={onEgreso}>
          <ArrowUpIcon size={18} className="text-danger" /> Egreso
        </Button>
        <Button variant="danger" onClick={onClose} className="col-span-2 sm:col-span-1">
          <LockIcon size={18} /> Cerrar caja
        </Button>
      </div>

      <Card className="px-2 py-2">
        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
          Movimientos del turno
        </p>
        {list.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-fg-muted">
            Todavía no hay movimientos.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {list.map((mv) => (
              <li key={mv.id} className="flex items-center gap-3 px-3 py-2.5">
                <span
                  className={`grid h-8 w-8 place-items-center rounded-md ${
                    mv.type === "egreso"
                      ? "bg-danger-soft text-danger"
                      : "bg-success-soft text-success"
                  }`}
                >
                  {mv.type === "venta" ? (
                    <ReceiptIcon size={16} />
                  ) : mv.type === "egreso" ? (
                    <ArrowUpIcon size={16} />
                  ) : (
                    <ArrowDownIcon size={16} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">{mv.reason}</p>
                  <p className="text-xs text-fg-subtle">{formatTime(mv.createdAt)}</p>
                </div>
                <span
                  className={`tabular text-sm font-semibold ${
                    mv.type === "egreso" ? "text-danger" : "text-success"
                  }`}
                >
                  {mv.type === "egreso" ? "-" : "+"}
                  {formatMoney(mv.amount, currency)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
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

function CloseModal({
  open,
  onClose,
  session,
  movements,
  currency,
  counted,
  setCounted,
  note,
  setNote,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  session: CashSession;
  movements: CashMovement[];
  currency: string;
  counted: string;
  setCounted: (v: string) => void;
  note: string;
  setNote: (v: string) => void;
  onConfirm: () => void;
}) {
  const m = computeSessionMetrics(session, movements);
  const countedNum = Number(counted) || 0;
  const diff = counted === "" ? null : countedNum - m.expectedCash;

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
          <Button variant="danger" onClick={onConfirm}>
            Cerrar caja
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-lg bg-surface-2 px-4 py-3">
          <span className="text-sm font-medium text-fg-muted">Efectivo esperado</span>
          <span className="tabular font-display text-lg font-bold text-fg">
            {formatMoney(m.expectedCash, currency)}
          </span>
        </div>
        <Field label="Efectivo contado" htmlFor="counted" hint="Lo que hay realmente en la caja" required>
          <Input
            id="counted"
            inputMode="decimal"
            value={counted}
            onChange={(e) => setCounted(e.target.value.replace(/[^\d.]/g, ""))}
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
              {formatMoney(diff, currency)}
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
      </div>
    </Modal>
  );
}
