"use client";

import { useMemo, useState } from "react";
import {
  ArchiveIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  PlusIcon,
  TagIcon,
} from "@phosphor-icons/react";
import { useStore } from "@/lib/store";
import { useCategories, useCurrency, useProducts } from "@/lib/selectors";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/lib/types";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  cx,
} from "@/components/ui";

const LOW_STOCK = 5;

interface FormState {
  name: string;
  sku: string;
  price: string;
  cost: string;
  stock: string;
  trackStock: boolean;
  categoryId: string;
}

const emptyForm: FormState = {
  name: "",
  sku: "",
  price: "",
  cost: "",
  stock: "0",
  trackStock: true,
  categoryId: "",
};

export default function ProductsPage() {
  const products = useProducts();
  const categories = useCategories();
  const currency = useCurrency();
  const addProduct = useStore((s) => s.addProduct);
  const updateProduct = useStore((s) => s.updateProduct);
  const archiveProduct = useStore((s) => s.archiveProduct);
  const addCategory = useStore((s) => s.addCategory);

  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [newCat, setNewCat] = useState("");
  const [archiving, setArchiving] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q)
    );
  }, [products, query]);

  const catName = (id?: string | null) =>
    categories.find((c) => c.id === id)?.name;

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setNewCat("");
    setOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      sku: p.sku ?? "",
      price: String(p.price),
      cost: p.cost != null ? String(p.cost) : "",
      stock: String(p.stock),
      trackStock: p.trackStock,
      categoryId: p.categoryId ?? "",
    });
    setNewCat("");
    setOpen(true);
  }

  function save() {
    const price = Number(form.price) || 0;
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim() || undefined,
      price,
      cost: form.cost ? Number(form.cost) : undefined,
      stock: Number(form.stock) || 0,
      trackStock: form.trackStock,
      categoryId: form.categoryId || null,
    };
    if (editing) {
      updateProduct(editing.id, payload);
    } else {
      addProduct(payload);
    }
    setOpen(false);
  }

  function createCategory() {
    const name = newCat.trim();
    if (!name) return;
    const cat = addCategory(name);
    setForm((f) => ({ ...f, categoryId: cat.id }));
    setNewCat("");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 lg:px-8 lg:py-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-fg">Productos</h1>
          <p className="text-sm text-fg-muted">
            {products.length} activos en este negocio
          </p>
        </div>
        <Button onClick={openNew}>
          <PlusIcon size={18} weight="bold" /> Nuevo producto
        </Button>
      </div>

      <div className="relative mb-4">
        <MagnifyingGlassIcon
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o código…"
          className="h-11 w-full rounded-lg border border-border-strong bg-surface pl-10 pr-3 text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<TagIcon size={34} />}
          title={query ? "Sin resultados" : "Todavía no hay productos"}
          description={
            query
              ? "Probá con otro nombre o código."
              : "Cargá tu primer producto para empezar a vender."
          }
          action={
            !query && (
              <Button onClick={openNew}>
                <PlusIcon size={18} weight="bold" /> Nuevo producto
              </Button>
            )
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          {/* Header (desktop) */}
          <div className="hidden grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-border px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-fg-subtle sm:grid">
            <span>Producto</span>
            <span className="w-24 text-right">Precio</span>
            <span className="w-20 text-right">Stock</span>
            <span className="w-16 text-right">Acciones</span>
          </div>
          <ul className="divide-y divide-border">
            {filtered.map((p) => {
              const out = p.trackStock && p.stock <= 0;
              const low = p.trackStock && p.stock > 0 && p.stock <= LOW_STOCK;
              return (
                <li
                  key={p.id}
                  className="flex items-center gap-4 px-4 py-3 sm:grid sm:grid-cols-[1fr_auto_auto_auto]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-fg">{p.name}</p>
                    <p className="flex items-center gap-2 text-xs text-fg-subtle">
                      {catName(p.categoryId) && <span>{catName(p.categoryId)}</span>}
                      {p.sku && <span className="tabular">· {p.sku}</span>}
                    </p>
                  </div>
                  <span className="tabular w-24 text-right font-semibold text-fg">
                    {formatMoney(p.price, currency)}
                  </span>
                  <span className="w-20 text-right">
                    {!p.trackStock ? (
                      <span className="text-xs text-fg-subtle">—</span>
                    ) : out ? (
                      <Badge tone="danger">Sin stock</Badge>
                    ) : low ? (
                      <Badge tone="warning">{p.stock}</Badge>
                    ) : (
                      <span className="tabular text-sm text-fg">{p.stock}</span>
                    )}
                  </span>
                  <span className="flex w-16 justify-end gap-1">
                    <button
                      onClick={() => openEdit(p)}
                      aria-label={`Editar ${p.name}`}
                      className="grid h-8 w-8 place-items-center rounded-md text-fg-muted hover:bg-surface-2 hover:text-fg"
                    >
                      <PencilSimpleIcon size={17} />
                    </button>
                    <button
                      onClick={() => setArchiving(p)}
                      aria-label={`Archivar ${p.name}`}
                      className="grid h-8 w-8 place-items-center rounded-md text-fg-muted hover:bg-danger-soft hover:text-danger"
                    >
                      <ArchiveIcon size={17} />
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Create / edit modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Editar producto" : "Nuevo producto"}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={!form.name.trim()}>
              {editing ? "Guardar cambios" : "Crear producto"}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Nombre" htmlFor="p-name" required>
            <Input
              id="p-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej. Coca-Cola 500ml"
              autoFocus
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Precio de venta" htmlFor="p-price" required>
              <Input
                id="p-price"
                inputMode="decimal"
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: e.target.value.replace(/[^\d.]/g, "") })
                }
                placeholder="0"
              />
            </Field>
            <Field label="Costo" htmlFor="p-cost" hint="Opcional">
              <Input
                id="p-cost"
                inputMode="decimal"
                value={form.cost}
                onChange={(e) =>
                  setForm({ ...form, cost: e.target.value.replace(/[^\d.]/g, "") })
                }
                placeholder="0"
              />
            </Field>
          </div>

          <Field label="Categoría" htmlFor="p-cat">
            <Select
              id="p-cat"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <div className="mt-2 flex gap-2">
              <Input
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                placeholder="Nueva categoría…"
                className="h-10"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    createCategory();
                  }
                }}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={createCategory}
                disabled={!newCat.trim()}
              >
                Agregar
              </Button>
            </div>
          </Field>

          <div className="rounded-lg border border-border bg-surface-2 p-3">
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <span>
                <span className="block text-sm font-semibold text-fg">
                  Controlar stock
                </span>
                <span className="block text-xs text-fg-muted">
                  Descontar unidades en cada venta
                </span>
              </span>
              <input
                type="checkbox"
                checked={form.trackStock}
                onChange={(e) => setForm({ ...form, trackStock: e.target.checked })}
                className="h-5 w-5 accent-[var(--accent)]"
              />
            </label>
            {form.trackStock && (
              <div className="mt-3">
                <Field label="Stock actual" htmlFor="p-stock">
                  <Input
                    id="p-stock"
                    inputMode="numeric"
                    value={form.stock}
                    onChange={(e) =>
                      setForm({ ...form, stock: e.target.value.replace(/[^\d-]/g, "") })
                    }
                    className="h-10"
                  />
                </Field>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Archive confirm */}
      <Modal
        open={!!archiving}
        onClose={() => setArchiving(null)}
        title="Archivar producto"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setArchiving(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (archiving) archiveProduct(archiving.id);
                setArchiving(null);
              }}
            >
              Archivar
            </Button>
          </div>
        }
      >
        <p className="text-sm text-fg-muted">
          ¿Archivar <span className="font-semibold text-fg">{archiving?.name}</span>? No
          aparecerá más en la pantalla de venta. Las ventas anteriores se conservan.
        </p>
      </Modal>
    </div>
  );
}
