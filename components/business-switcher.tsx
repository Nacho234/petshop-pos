"use client";

import { useState } from "react";
import {
  CaretUpDownIcon,
  CheckIcon,
  PlusIcon,
  StorefrontIcon,
} from "@phosphor-icons/react";
import { useStore } from "@/lib/store";
import { Button, Field, Input, Modal, cx } from "./ui";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function BusinessSwitcher() {
  const businesses = useStore((s) => s.businesses);
  const currentId = useStore((s) => s.currentBusinessId);
  const setCurrent = useStore((s) => s.setCurrentBusiness);
  const addBusiness = useStore((s) => s.addBusiness);

  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [taxId, setTaxId] = useState("");

  const current = businesses.find((b) => b.id === currentId)!;

  function create() {
    if (!name.trim()) return;
    const biz = addBusiness({
      name: name.trim(),
      slug: name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      taxId: taxId.trim() || undefined,
      currency: "ARS",
    });
    setCurrent(biz.id);
    setName("");
    setTaxId("");
    setCreating(false);
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-surface px-2.5 py-2 text-left hover:bg-surface-2"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-accent text-sm font-bold text-accent-fg">
            {initials(current.name)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-display text-sm font-semibold text-fg">
              {current.name}
            </span>
            <span className="block truncate text-xs text-fg-subtle">
              {current.slug}
            </span>
          </span>
          <CaretUpDownIcon size={16} className="shrink-0 text-fg-subtle" />
        </button>

        {open && (
          <>
            <div
              className="fixed inset-0 z-20"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <div className="absolute left-0 right-0 top-full z-30 mt-1.5 overflow-hidden rounded-lg border border-border bg-surface shadow-xl">
              <p className="px-3 pb-1 pt-2.5 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
                Negocios
              </p>
              <ul className="max-h-64 overflow-y-auto py-1">
                {businesses.map((b) => (
                  <li key={b.id}>
                    <button
                      onClick={() => {
                        setCurrent(b.id);
                        setOpen(false);
                      }}
                      className={cx(
                        "flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-surface-2",
                        b.id === currentId && "bg-surface-2"
                      )}
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-surface-2 text-xs font-bold text-fg-muted">
                        {initials(b.name)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">
                        {b.name}
                      </span>
                      {b.id === currentId && (
                        <CheckIcon size={16} className="text-accent" weight="bold" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => {
                  setOpen(false);
                  setCreating(true);
                }}
                className="flex w-full items-center gap-2 border-t border-border px-3 py-2.5 text-left text-sm font-semibold text-accent hover:bg-surface-2"
              >
                <PlusIcon size={16} weight="bold" />
                Agregar negocio
              </button>
            </div>
          </>
        )}
      </div>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Nuevo negocio"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCreating(false)}>
              Cancelar
            </Button>
            <Button onClick={create} disabled={!name.trim()}>
              Crear negocio
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 rounded-lg bg-accent-soft px-3 py-2.5 text-sm text-accent">
            <StorefrontIcon size={18} />
            Cada negocio tiene sus propios productos, ventas y caja.
          </div>
          <Field label="Nombre del negocio" htmlFor="biz-name" required>
            <Input
              id="biz-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Panadería La Espiga"
              autoFocus
            />
          </Field>
          <Field label="CUIT" htmlFor="biz-tax" hint="Opcional, para los comprobantes">
            <Input
              id="biz-tax"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              placeholder="30-12345678-9"
              inputMode="numeric"
            />
          </Field>
        </div>
      </Modal>
    </>
  );
}
