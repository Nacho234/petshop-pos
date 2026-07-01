"use client";

import { useEffect, useMemo, useState } from "react";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";

import { Button, Field, Input, Modal, cx } from "@/components/ui";
import { useProducts } from "@/commerce/products/hooks";
import { useAdjustStock, useReceiveStock } from "../hooks";

type Mode = "receive" | "adjust";
type Selected = { id: string; name: string; stock: number };

export function StockModal({
  open,
  onClose,
  initialMode = "receive",
  preselected = null,
}: {
  open: boolean;
  onClose: () => void;
  initialMode?: Mode;
  preselected?: Selected | null;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [selected, setSelected] = useState<Selected | null>(preselected);
  const [search, setSearch] = useState("");
  const [quantity, setQuantity] = useState("");
  const [newStock, setNewStock] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const receive = useReceiveStock();
  const adjust = useAdjustStock();
  const saving = receive.isPending || adjust.isPending;

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setSelected(preselected);
      setSearch("");
      setQuantity("");
      setNewStock(preselected ? String(preselected.stock) : "");
      setReason("");
      setError(null);
    }
  }, [open, initialMode, preselected]);

  const productsQuery = useProducts(
    useMemo(() => ({ q: search || undefined, page: 1, pageSize: 8, sort: "name" as const }), [search])
  );

  function choose(p: { id: string; name: string; stock: number }) {
    setSelected({ id: p.id, name: p.name, stock: p.stock });
    setNewStock(String(p.stock));
    setSearch("");
  }

  async function onConfirm() {
    setError(null);
    if (!selected) return;
    try {
      if (mode === "receive") {
        await receive.mutateAsync({
          productId: selected.id,
          quantity: Number(quantity) || 0,
          reason,
        });
      } else {
        await adjust.mutateAsync({
          productId: selected.id,
          newStock: Number(newStock) || 0,
          reason,
        });
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo registrar el movimiento.");
    }
  }

  const canConfirm =
    !!selected &&
    (mode === "receive" ? Number(quantity) > 0 : reason.trim().length > 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Movimiento de stock"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={!canConfirm || saving}>
            {saving ? "Guardando…" : mode === "receive" ? "Ingresar" : "Ajustar"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Tipo de movimiento */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setMode("receive")}
            className={cx(
              "rounded-lg border px-3 py-2 text-sm font-semibold",
              mode === "receive"
                ? "border-accent bg-accent-soft text-accent"
                : "border-border-strong text-fg-muted hover:bg-surface-2"
            )}
          >
            Ingreso (reponer)
          </button>
          <button
            onClick={() => setMode("adjust")}
            className={cx(
              "rounded-lg border px-3 py-2 text-sm font-semibold",
              mode === "adjust"
                ? "border-accent bg-accent-soft text-accent"
                : "border-border-strong text-fg-muted hover:bg-surface-2"
            )}
          >
            Ajuste (recuento)
          </button>
        </div>

        {/* Selección de producto */}
        {selected ? (
          <div className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-3 py-2">
            <div>
              <p className="font-semibold text-fg">{selected.name}</p>
              <p className="text-xs text-fg-subtle">Stock actual: {selected.stock}</p>
            </div>
            {!preselected && (
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
                Cambiar
              </Button>
            )}
          </div>
        ) : (
          <div>
            <div className="relative">
              <MagnifyingGlassIcon
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar producto por nombre / SKU…"
                autoFocus
                className="h-10 w-full rounded-lg border border-border-strong bg-surface pl-9 pr-3 text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
              />
            </div>
            {(productsQuery.data?.items.length ?? 0) > 0 && (
              <ul className="mt-2 max-h-52 overflow-auto rounded-lg border border-border">
                {productsQuery.data!.items.map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => choose(p)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-surface-2"
                    >
                      <span className="truncate text-fg">{p.name}</span>
                      <span className="text-xs text-fg-subtle">Stock: {p.stock}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Campos según modo */}
        {selected && mode === "receive" && (
          <Field label="Cantidad a ingresar" htmlFor="qty" required>
            <Input
              id="qty"
              inputMode="numeric"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="0"
              autoFocus
            />
          </Field>
        )}

        {selected && mode === "adjust" && (
          <Field label="Stock real (recuento)" htmlFor="newstock" required>
            <Input
              id="newstock"
              inputMode="numeric"
              value={newStock}
              onChange={(e) => setNewStock(e.target.value.replace(/[^\d]/g, ""))}
            />
          </Field>
        )}

        {selected && (
          <Field
            label="Motivo"
            htmlFor="reason"
            required={mode === "adjust"}
            hint={mode === "receive" ? "Opcional (ej. proveedor, remito)" : undefined}
          >
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={mode === "adjust" ? "Rotura, faltante, recuento…" : "Compra a proveedor…"}
            />
          </Field>
        )}

        {error && (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
