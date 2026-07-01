"use client";

import { useState } from "react";
import { CheckCircleIcon } from "@phosphor-icons/react";

import { Button, Card, Field, Input } from "@/components/ui";
import { useSettings, useUpdateSettings } from "@/core/settings/hooks";
import type { SettingsDTO } from "@/core/settings/schemas";

export default function AjustesPage() {
  const settings = useSettings();

  return (
    <div className="mx-auto max-w-2xl px-4 py-5 lg:px-8 lg:py-8">
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold text-fg">Ajustes del negocio</h1>
        <p className="text-sm text-fg-muted">
          Estos datos aparecen en el comprobante de cada venta.
        </p>
      </div>

      {settings.isLoading ? (
        <p className="py-16 text-center text-sm text-fg-muted">Cargando…</p>
      ) : settings.data ? (
        <SettingsForm initial={settings.data} />
      ) : (
        <p className="text-sm text-danger">No se pudieron cargar los ajustes.</p>
      )}
    </div>
  );
}

function SettingsForm({ initial }: { initial: SettingsDTO }) {
  const update = useUpdateSettings();
  const [f, setF] = useState({
    businessName: initial.businessName,
    legalName: initial.legalName ?? "",
    taxId: initial.taxId ?? "",
    address: initial.address ?? "",
    phone: initial.phone ?? "",
    currency: initial.currency,
  });
  const [saved, setSaved] = useState(false);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setF((prev) => ({ ...prev, [k]: e.target.value }));
    setSaved(false);
  };

  const valid = f.businessName.trim() !== "" && f.currency.trim() !== "";

  function save() {
    if (!valid) return;
    update.mutate(f, { onSuccess: () => setSaved(true) });
  }

  return (
    <Card className="flex flex-col gap-4 px-5 py-5">
      <Field label="Nombre del negocio" htmlFor="s-name" required>
        <Input id="s-name" value={f.businessName} onChange={set("businessName")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Razón social" htmlFor="s-legal" hint="Opcional">
          <Input id="s-legal" value={f.legalName} onChange={set("legalName")} />
        </Field>
        <Field label="CUIT" htmlFor="s-tax" hint="Opcional">
          <Input id="s-tax" value={f.taxId} onChange={set("taxId")} />
        </Field>
      </div>
      <Field label="Dirección" htmlFor="s-addr" hint="Opcional">
        <Input id="s-addr" value={f.address} onChange={set("address")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Teléfono" htmlFor="s-phone" hint="Opcional">
          <Input id="s-phone" value={f.phone} onChange={set("phone")} />
        </Field>
        <Field label="Moneda" htmlFor="s-cur" hint="Código, ej. ARS">
          <Input id="s-cur" value={f.currency} onChange={set("currency")} />
        </Field>
      </div>

      {update.error && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {(update.error as Error).message}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        {saved && !update.isPending && (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-success">
            <CheckCircleIcon size={18} weight="fill" /> Guardado
          </span>
        )}
        <Button onClick={save} disabled={!valid || update.isPending}>
          {update.isPending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </Card>
  );
}
