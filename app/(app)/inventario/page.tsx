"use client";

import { useState } from "react";
import {
  ArrowClockwiseIcon,
  PackageIcon,
  PlusIcon,
  WarningIcon,
} from "@phosphor-icons/react";

import { Badge, Button, EmptyState } from "@/components/ui";
import { useLowStock, useMovements } from "@/commerce/inventory/hooks";
import { MOVEMENT_LABELS } from "@/commerce/inventory/schemas";
import { StockModal } from "@/commerce/inventory/components/stock-modal";

type Preselected = { id: string; name: string; stock: number } | null;

const dateFmt = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function movementTone(type: string): "success" | "danger" | "accent" | "neutral" {
  if (type === "PURCHASE" || type === "INITIAL") return "success";
  if (type === "SALE") return "danger";
  if (type === "ADJUSTMENT") return "accent";
  return "neutral";
}

export default function InventoryPage() {
  const lowStock = useLowStock();
  const movements = useMovements();

  const [modalOpen, setModalOpen] = useState(false);
  const [preselected, setPreselected] = useState<Preselected>(null);

  function openReceive(p?: Preselected) {
    setPreselected(p ?? null);
    setModalOpen(true);
  }

  const low = lowStock.data ?? [];
  const movs = movements.data ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 lg:px-8 lg:py-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-fg">Inventario</h1>
          <p className="text-sm text-fg-muted">Ingresos, ajustes y movimientos de stock</p>
        </div>
        <Button onClick={() => openReceive(null)}>
          <PlusIcon size={18} weight="bold" /> Registrar movimiento
        </Button>
      </div>

      {/* Stock bajo */}
      <section className="mb-6">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-fg">
          <WarningIcon size={18} className="text-warning" weight="fill" />
          Stock bajo
          {low.length > 0 && <Badge tone="warning">{low.length}</Badge>}
        </h2>
        {low.length === 0 ? (
          <p className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-fg-muted">
            Todo en orden: ningún producto por debajo del mínimo.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <ul className="divide-y divide-border">
              {low.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-fg">{p.name}</p>
                    <p className="text-xs text-fg-subtle">Mínimo: {p.minStock}</p>
                  </div>
                  {p.stock <= 0 ? (
                    <Badge tone="danger">Sin stock</Badge>
                  ) : (
                    <Badge tone="warning">{p.stock}</Badge>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openReceive({ id: p.id, name: p.name, stock: p.stock })}
                  >
                    Reponer
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Movimientos */}
      <section>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-fg">
          <ArrowClockwiseIcon size={18} className="text-fg-muted" />
          Últimos movimientos
        </h2>
        {movs.length === 0 ? (
          <EmptyState
            icon={<PackageIcon size={34} />}
            title="Sin movimientos"
            description="Los ingresos, ventas y ajustes van a aparecer acá."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <ul className="divide-y divide-border">
              {movs.map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-fg">{m.productName}</p>
                    <p className="text-xs text-fg-subtle">
                      {dateFmt.format(new Date(m.createdAt))}
                      {m.reason ? ` · ${m.reason}` : ""}
                    </p>
                  </div>
                  <Badge tone={movementTone(m.type)}>{MOVEMENT_LABELS[m.type] ?? m.type}</Badge>
                  <span
                    className={`tabular w-14 text-right font-semibold ${
                      m.quantity >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {m.quantity >= 0 ? `+${m.quantity}` : m.quantity}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <StockModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialMode="receive"
        preselected={preselected}
      />
    </div>
  );
}
