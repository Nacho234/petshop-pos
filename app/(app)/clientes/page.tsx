"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AddressBookIcon,
  MagnifyingGlassIcon,
  PawPrintIcon,
  PlusIcon,
} from "@phosphor-icons/react";

import { Badge, Button, EmptyState } from "@/components/ui";
import { useCustomers } from "@/commerce/customers/hooks";
import type { CustomerDTO } from "@/commerce/customers/schemas";
import { CustomerFormModal } from "@/commerce/customers/components/customer-form-modal";
import { CustomerDetailModal } from "@/commerce/customers/components/customer-detail-modal";

const PAGE_SIZE = 20;

export default function CustomersPage() {
  const [rawQuery, setRawQuery] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerDTO | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(rawQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [rawQuery]);

  const params = useMemo(
    () => ({ q: query || undefined, page, pageSize: PAGE_SIZE }),
    [query, page]
  );
  const customers = useCustomers(params);
  const items = customers.data?.items ?? [];
  const total = customers.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }
  function editFromDetail() {
    const c = items.find((x) => x.id === detailId) ?? null;
    setEditing(c);
    setDetailId(null);
    setFormOpen(true);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 lg:px-8 lg:py-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-fg">Clientes</h1>
          <p className="text-sm text-fg-muted">{total} en total</p>
        </div>
        <Button onClick={openNew}>
          <PlusIcon size={18} weight="bold" /> Nuevo cliente
        </Button>
      </div>

      <div className="relative mb-4">
        <MagnifyingGlassIcon
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle"
        />
        <input
          value={rawQuery}
          onChange={(e) => setRawQuery(e.target.value)}
          placeholder="Buscar por nombre, teléfono o email…"
          className="h-11 w-full rounded-lg border border-border-strong bg-surface pl-10 pr-3 text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
        />
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<AddressBookIcon size={34} />}
          title={query ? "Sin resultados" : "Todavía no hay clientes"}
          description={
            query ? "Probá con otro dato." : "Cargá tu primer cliente para empezar a fidelizar."
          }
          action={
            !query && (
              <Button onClick={openNew}>
                <PlusIcon size={18} weight="bold" /> Nuevo cliente
              </Button>
            )
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <ul className="divide-y divide-border">
            {items.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setDetailId(c.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-fg">{c.name}</p>
                    <p className="truncate text-xs text-fg-subtle">
                      {c.phone ?? c.email ?? "Sin contacto"}
                    </p>
                  </div>
                  {c.petsCount > 0 && (
                    <span className="flex items-center gap-1 text-xs text-fg-subtle">
                      <PawPrintIcon size={14} weight="fill" /> {c.petsCount}
                    </span>
                  )}
                  <Badge tone="accent">{c.points} pts</Badge>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-fg-muted">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Siguiente
            </Button>
          </div>
        </div>
      )}

      <CustomerFormModal open={formOpen} onClose={() => setFormOpen(false)} customer={editing} />
      <CustomerDetailModal
        customerId={detailId}
        onClose={() => setDetailId(null)}
        onEdit={editFromDetail}
      />
    </div>
  );
}
