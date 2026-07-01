"use client";

import { useState } from "react";
import { GearSixIcon } from "@phosphor-icons/react";
import { useStore } from "@/lib/store";
import { useBusiness } from "@/lib/selectors";
import { Button, Field, Input, Modal } from "./ui";

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "PS"
  );
}

export function BusinessBadge() {
  const business = useBusiness();
  const updateBusiness = useStore((s) => s.updateBusiness);
  const [open, setOpen] = useState(false);

  const [name, setName] = useState(business.name);
  const [legalName, setLegalName] = useState(business.legalName ?? "");
  const [taxId, setTaxId] = useState(business.taxId ?? "");
  const [address, setAddress] = useState(business.address ?? "");
  const [phone, setPhone] = useState(business.phone ?? "");

  function openModal() {
    setName(business.name);
    setLegalName(business.legalName ?? "");
    setTaxId(business.taxId ?? "");
    setAddress(business.address ?? "");
    setPhone(business.phone ?? "");
    setOpen(true);
  }

  function save() {
    if (!name.trim()) return;
    updateBusiness({
      name: name.trim(),
      legalName: legalName.trim() || undefined,
      taxId: taxId.trim() || undefined,
      address: address.trim() || undefined,
      phone: phone.trim() || undefined,
    });
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={openModal}
        title="Ajustes del negocio"
        className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-surface px-2.5 py-2 text-left hover:bg-surface-2"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-accent text-sm font-bold text-accent-fg">
          {initials(business.name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-sm font-semibold text-fg">
            {business.name}
          </span>
          <span className="block truncate text-xs text-fg-subtle">
            {business.taxId ? `CUIT ${business.taxId}` : "Tocá para configurar"}
          </span>
        </span>
        <GearSixIcon size={17} className="shrink-0 text-fg-subtle" />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Ajustes del negocio"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={!name.trim()}>
              Guardar
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-fg-muted">
            Estos datos aparecen en el ticket de venta.
          </p>
          <Field label="Nombre del negocio" htmlFor="b-name" required>
            <Input
              id="b-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Pet Shop Huellitas"
              autoFocus
            />
          </Field>
          <Field label="Razón social" htmlFor="b-legal" hint="Opcional">
            <Input
              id="b-legal"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              placeholder="Ej. Huellitas SRL"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="CUIT" htmlFor="b-tax" hint="Opcional">
              <Input
                id="b-tax"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="30-12345678-9"
                inputMode="numeric"
              />
            </Field>
            <Field label="Teléfono" htmlFor="b-phone" hint="Opcional">
              <Input
                id="b-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="341 555 0000"
                inputMode="tel"
              />
            </Field>
          </div>
          <Field label="Dirección" htmlFor="b-addr" hint="Opcional">
            <Input
              id="b-addr"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Calle 123, Ciudad"
            />
          </Field>
        </div>
      </Modal>
    </>
  );
}
