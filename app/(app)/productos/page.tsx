"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArchiveIcon,
  ArrowCounterClockwiseIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  PlusIcon,
  SlidersHorizontalIcon,
  TagIcon,
} from "@phosphor-icons/react";

import { Badge, Button, EmptyState, Select } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { useCategories } from "@/commerce/categories/hooks";
import { useBrands } from "@/commerce/brands/hooks";
import { useProducts, useSetProductActive } from "@/commerce/products/hooks";
import type { ProductDTO, ProductSort } from "@/commerce/products/schemas";
import { ProductFormModal } from "@/commerce/products/components/product-form-modal";
import { TaxonomyModal } from "@/commerce/products/components/taxonomy-modal";

const PAGE_SIZE = 20;

export default function ProductsPage() {
  const [rawQuery, setRawQuery] = useState("");
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [sort, setSort] = useState<ProductSort>("name");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProductDTO | null>(null);
  const [taxonomyOpen, setTaxonomyOpen] = useState(false);

  // Debounce de la búsqueda.
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(rawQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [rawQuery]);

  const categories = useCategories();
  const brands = useBrands();

  const params = useMemo(
    () => ({
      q: query || undefined,
      categoryId: categoryId || undefined,
      brandId: brandId || undefined,
      sort,
      page,
      pageSize: PAGE_SIZE,
    }),
    [query, categoryId, brandId, sort, page]
  );

  const products = useProducts(params);
  const setActive = useSetProductActive();
  const items = products.data?.items ?? [];
  const total = products.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(p: ProductDTO) {
    setEditing(p);
    setFormOpen(true);
  }

  function toggleActive(p: ProductDTO) {
    const msg = p.active
      ? `¿Archivar "${p.name}"? No va a aparecer más para vender en el POS (podés reactivarlo después).`
      : `¿Reactivar "${p.name}"? Va a volver a estar disponible para vender.`;
    if (!window.confirm(msg)) return;
    setActive.mutate({ id: p.id, active: !p.active });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 lg:px-8 lg:py-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-fg">Productos</h1>
          <p className="text-sm text-fg-muted">{total} en total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setTaxonomyOpen(true)}>
            <SlidersHorizontalIcon size={18} /> Categorías y marcas
          </Button>
          <Button onClick={openNew}>
            <PlusIcon size={18} weight="bold" /> Nuevo producto
          </Button>
        </div>
      </div>

      {/* Búsqueda + filtros */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <MagnifyingGlassIcon
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle"
          />
          <input
            value={rawQuery}
            onChange={(e) => setRawQuery(e.target.value)}
            placeholder="Buscar por nombre, SKU o código de barras…"
            className="h-11 w-full rounded-lg border border-border-strong bg-surface pl-10 pr-3 text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
          />
        </div>
        <Select
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setPage(1);
          }}
          className="sm:w-44"
        >
          <option value="">Todas las categorías</option>
          {categories.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select
          value={brandId}
          onChange={(e) => {
            setBrandId(e.target.value);
            setPage(1);
          }}
          className="sm:w-40"
        >
          <option value="">Todas las marcas</option>
          {brands.data?.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
        <Select
          value={sort}
          onChange={(e) => setSort(e.target.value as ProductSort)}
          className="sm:w-36"
        >
          <option value="name">Nombre</option>
          <option value="price">Precio</option>
          <option value="stock">Stock</option>
          <option value="recent">Recientes</option>
        </Select>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<TagIcon size={34} />}
          title={query || categoryId || brandId ? "Sin resultados" : "Todavía no hay productos"}
          description={
            query || categoryId || brandId
              ? "Probá con otros filtros."
              : "Cargá tu primer producto para empezar a vender."
          }
          action={
            !(query || categoryId || brandId) && (
              <Button onClick={openNew}>
                <PlusIcon size={18} weight="bold" /> Nuevo producto
              </Button>
            )
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="hidden grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-border px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-fg-subtle sm:grid">
            <span>Producto</span>
            <span className="w-24 text-right">Precio</span>
            <span className="w-24 text-right">Stock</span>
            <span className="w-20 text-right">Acciones</span>
          </div>
          <ul className="divide-y divide-border">
            {items.map((p) => {
              const out = p.stock <= 0;
              const low = p.minStock > 0 && p.stock > 0 && p.stock <= p.minStock;
              return (
                <li
                  key={p.id}
                  className="flex items-center gap-4 px-4 py-3 sm:grid sm:grid-cols-[1fr_auto_auto_auto]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate font-semibold text-fg">
                      {p.name}
                      {!p.active && <Badge tone="neutral">Inactivo</Badge>}
                    </p>
                    <p className="flex flex-wrap items-center gap-x-2 text-xs text-fg-subtle">
                      {p.categoryName && <span>{p.categoryName}</span>}
                      {p.brandName && <span>· {p.brandName}</span>}
                      {p.sku && <span>· {p.sku}</span>}
                    </p>
                  </div>
                  <span className="tabular w-24 text-right font-semibold text-fg">
                    {formatMoney(p.price, "ARS")}
                  </span>
                  <span className="w-24 text-right">
                    {out ? (
                      <Badge tone="danger">Sin stock</Badge>
                    ) : low ? (
                      <Badge tone="warning">Bajo · {p.stock}</Badge>
                    ) : (
                      <span className="tabular text-sm text-fg">{p.stock}</span>
                    )}
                  </span>
                  <span className="flex w-20 justify-end gap-1">
                    <button
                      onClick={() => openEdit(p)}
                      aria-label={`Editar ${p.name}`}
                      className="grid h-8 w-8 place-items-center rounded-md text-fg-muted hover:bg-surface-2 hover:text-fg"
                    >
                      <PencilSimpleIcon size={17} />
                    </button>
                    <button
                      onClick={() => toggleActive(p)}
                      disabled={setActive.isPending}
                      aria-label={p.active ? `Archivar ${p.name}` : `Reactivar ${p.name}`}
                      title={p.active ? "Archivar" : "Reactivar"}
                      className="grid h-8 w-8 place-items-center rounded-md text-fg-muted hover:bg-surface-2 hover:text-fg disabled:opacity-40"
                    >
                      {p.active ? (
                        <ArchiveIcon size={17} />
                      ) : (
                        <ArrowCounterClockwiseIcon size={17} />
                      )}
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-fg-muted">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      <ProductFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        product={editing}
      />
      <TaxonomyModal open={taxonomyOpen} onClose={() => setTaxonomyOpen(false)} />
    </div>
  );
}
