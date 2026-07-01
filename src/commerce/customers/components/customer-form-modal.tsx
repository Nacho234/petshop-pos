"use client";

import { useEffect, useState } from "react";

import { Button, Field, Input, Modal } from "@/components/ui";
import { useCreateCustomer, useUpdateCustomer } from "../hooks";
import type { CustomerDTO } from "../schemas";

const textareaClass =
  "w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none";

export function CustomerFormModal({
  open,
  onClose,
  customer,
}: {
  open: boolean;
  onClose: () => void;
  customer: CustomerDTO | null;
}) {
  const create = useCreateCustomer();
  const update = useUpdateCustomer();
  const saving = create.isPending || update.isPending;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(customer?.name ?? "");
      setPhone(customer?.phone ?? "");
      setEmail(customer?.email ?? "");
      setNotes(customer?.notes ?? "");
      setError(null);
    }
  }, [open, customer]);

  async function onSave() {
    setError(null);
    const input = { name, phone, email, notes };
    try {
      if (customer) await update.mutateAsync({ id: customer.id, input });
      else await create.mutateAsync(input);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={customer ? "Editar cliente" : "Nuevo cliente"}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onSave} disabled={!name.trim() || saving}>
            {saving ? "Guardando…" : customer ? "Guardar" : "Crear"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Nombre" htmlFor="c-name" required>
          <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Teléfono" htmlFor="c-phone">
            <Input id="c-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Opcional" />
          </Field>
          <Field label="Email" htmlFor="c-email">
            <Input id="c-email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Opcional" />
          </Field>
        </div>
        <Field label="Notas" htmlFor="c-notes">
          <textarea id="c-notes" rows={2} className={textareaClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        {error && (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">{error}</p>
        )}
      </div>
    </Modal>
  );
}
