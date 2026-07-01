"use client";

import { useState } from "react";
import { PencilSimpleIcon, TrashIcon, CheckIcon, XIcon } from "@phosphor-icons/react";

import { Button, Input, Modal } from "@/components/ui";
import {
  useBrands,
  useCreateBrand,
  useDeleteBrand,
  useUpdateBrand,
} from "@/commerce/brands/hooks";
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "@/commerce/categories/hooks";

type Item = { id: string; name: string };

function TaxonomyList({
  title,
  items,
  onCreate,
  onRename,
  onDelete,
}: {
  title: string;
  items: Item[];
  onCreate: (name: string) => Promise<unknown>;
  onRename: (id: string, name: string) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
}) {
  const [name, setName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<unknown>) {
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-fg">{title}</h3>

      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`Nueva ${title.toLowerCase()}…`}
          className="h-10"
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) {
              e.preventDefault();
              run(() => onCreate(name.trim())).then(() => setName(""));
            }
          }}
        />
        <Button
          variant="secondary"
          size="sm"
          disabled={!name.trim()}
          onClick={() => run(() => onCreate(name.trim())).then(() => setName(""))}
        >
          Agregar
        </Button>
      </div>

      {error && <p className="text-xs font-medium text-danger">{error}</p>}

      <ul className="divide-y divide-border rounded-lg border border-border">
        {items.length === 0 && (
          <li className="px-3 py-2 text-sm text-fg-subtle">Sin elementos</li>
        )}
        {items.map((it) => (
          <li key={it.id} className="flex items-center gap-2 px-3 py-2">
            {editId === it.id ? (
              <>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-9"
                  autoFocus
                />
                <button
                  aria-label="Guardar"
                  className="grid h-8 w-8 place-items-center rounded-md text-success hover:bg-success-soft"
                  onClick={() =>
                    run(() => onRename(it.id, editName.trim())).then(() => setEditId(null))
                  }
                >
                  <CheckIcon size={17} />
                </button>
                <button
                  aria-label="Cancelar"
                  className="grid h-8 w-8 place-items-center rounded-md text-fg-muted hover:bg-surface-2"
                  onClick={() => setEditId(null)}
                >
                  <XIcon size={17} />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 truncate text-sm text-fg">{it.name}</span>
                <button
                  aria-label={`Editar ${it.name}`}
                  className="grid h-8 w-8 place-items-center rounded-md text-fg-muted hover:bg-surface-2 hover:text-fg"
                  onClick={() => {
                    setEditId(it.id);
                    setEditName(it.name);
                  }}
                >
                  <PencilSimpleIcon size={16} />
                </button>
                <button
                  aria-label={`Eliminar ${it.name}`}
                  className="grid h-8 w-8 place-items-center rounded-md text-fg-muted hover:bg-danger-soft hover:text-danger"
                  onClick={() => run(() => onDelete(it.id))}
                >
                  <TrashIcon size={16} />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TaxonomyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const categories = useCategories();
  const brands = useBrands();
  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory();
  const deleteCat = useDeleteCategory();
  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();
  const deleteBrand = useDeleteBrand();

  return (
    <Modal open={open} onClose={onClose} title="Categorías y marcas" size="lg">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <TaxonomyList
          title="Categorías"
          items={categories.data ?? []}
          onCreate={(name) => createCat.mutateAsync({ name })}
          onRename={(id, name) => updateCat.mutateAsync({ id, input: { name } })}
          onDelete={(id) => deleteCat.mutateAsync(id)}
        />
        <TaxonomyList
          title="Marcas"
          items={brands.data ?? []}
          onCreate={(name) => createBrand.mutateAsync({ name })}
          onRename={(id, name) => updateBrand.mutateAsync({ id, input: { name } })}
          onDelete={(id) => deleteBrand.mutateAsync(id)}
        />
      </div>
    </Modal>
  );
}
