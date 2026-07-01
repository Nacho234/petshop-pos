"use client";

import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button, Field, Input, Modal, Select } from "@/components/ui";
import { useBrands, useCreateBrand } from "@/commerce/brands/hooks";
import { useCategories, useCreateCategory } from "@/commerce/categories/hooks";
import { productInputSchema, type ProductDTO, type ProductInput } from "../schemas";
import { useCreateProduct, useUpdateProduct } from "../hooks";

// Valores del form (los numéricos como string; Zod los coerce al enviar).
type FormValues = {
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  categoryId?: string;
  brandId?: string;
  cost: string;
  price: string;
  taxRate: string;
  stock: string;
  minStock: string;
  active: boolean;
  imageUrl?: string;
  notes?: string;
};

const emptyValues: FormValues = {
  name: "",
  description: "",
  sku: "",
  barcode: "",
  categoryId: "",
  brandId: "",
  cost: "0",
  price: "0",
  taxRate: "21",
  stock: "0",
  minStock: "0",
  active: true,
  imageUrl: "",
  notes: "",
};

function toFormValues(p: ProductDTO): FormValues {
  return {
    name: p.name,
    description: p.description ?? "",
    sku: p.sku ?? "",
    barcode: p.barcode ?? "",
    categoryId: p.categoryId ?? "",
    brandId: p.brandId ?? "",
    cost: String(p.cost),
    price: String(p.price),
    taxRate: String(p.taxRate),
    stock: String(p.stock),
    minStock: String(p.minStock),
    active: p.active,
    imageUrl: p.imageUrl ?? "",
    notes: p.notes ?? "",
  };
}

const textareaClass =
  "w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none";

export function ProductFormModal({
  open,
  onClose,
  product,
}: {
  open: boolean;
  onClose: () => void;
  product: ProductDTO | null;
}) {
  const categories = useCategories();
  const brands = useBrands();
  const createCategory = useCreateCategory();
  const createBrand = useCreateBrand();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const [newCat, setNewCat] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues, unknown, ProductInput>({
    // El input del schema es "unknown" por z.coerce; el form usa strings.
    // El cast puentea ese desajuste; la salida sigue siendo ProductInput.
    resolver: zodResolver(productInputSchema) as unknown as Resolver<
      FormValues,
      unknown,
      ProductInput
    >,
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (open) reset(product ? toFormValues(product) : emptyValues);
  }, [open, product, reset]);

  // Reset de estado auxiliar al abrir, sin efecto: patrón "ajustar estado en
  // render" recomendado por React (evita setState dentro de useEffect).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setFormError(null);
      setNewCat("");
      setNewBrand("");
    }
  }

  const saving = createProduct.isPending || updateProduct.isPending;

  async function onSubmit(input: ProductInput) {
    setFormError(null);
    try {
      if (product) {
        await updateProduct.mutateAsync({ id: product.id, input });
      } else {
        await createProduct.mutateAsync(input);
      }
      onClose();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "No se pudo guardar.");
    }
  }

  async function quickCategory() {
    const name = newCat.trim();
    if (!name) return;
    const c = await createCategory.mutateAsync({ name });
    setValue("categoryId", c.id);
    setNewCat("");
  }

  async function quickBrand() {
    const name = newBrand.trim();
    if (!name) return;
    const b = await createBrand.mutateAsync({ name });
    setValue("brandId", b.id);
    setNewBrand("");
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={product ? "Editar producto" : "Nuevo producto"}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={saving}>
            {saving ? "Guardando…" : product ? "Guardar cambios" : "Crear producto"}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Field label="Nombre" htmlFor="p-name" error={errors.name?.message} required>
          <Input id="p-name" autoFocus placeholder="Ej. Alimento perro 3kg" {...register("name")} />
        </Field>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Precio" htmlFor="p-price" error={errors.price?.message} required>
            <Input id="p-price" inputMode="decimal" {...register("price")} />
          </Field>
          <Field label="Costo" htmlFor="p-cost" error={errors.cost?.message}>
            <Input id="p-cost" inputMode="decimal" {...register("cost")} />
          </Field>
          <Field label="IVA %" htmlFor="p-tax" error={errors.taxRate?.message}>
            <Input id="p-tax" inputMode="decimal" {...register("taxRate")} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="SKU" htmlFor="p-sku" error={errors.sku?.message}>
            <Input id="p-sku" placeholder="Opcional" {...register("sku")} />
          </Field>
          <Field label="Código de barras" htmlFor="p-barcode" error={errors.barcode?.message}>
            <Input id="p-barcode" placeholder="Opcional" {...register("barcode")} />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Categoría" htmlFor="p-cat">
            <Select id="p-cat" {...register("categoryId")}>
              <option value="">Sin categoría</option>
              {categories.data?.map((c) => (
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
                    quickCategory();
                  }
                }}
              />
              <Button variant="secondary" size="sm" onClick={quickCategory} disabled={!newCat.trim()}>
                Agregar
              </Button>
            </div>
          </Field>

          <Field label="Marca" htmlFor="p-brand">
            <Select id="p-brand" {...register("brandId")}>
              <option value="">Sin marca</option>
              {brands.data?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
            <div className="mt-2 flex gap-2">
              <Input
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                placeholder="Nueva marca…"
                className="h-10"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    quickBrand();
                  }
                }}
              />
              <Button variant="secondary" size="sm" onClick={quickBrand} disabled={!newBrand.trim()}>
                Agregar
              </Button>
            </div>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Stock actual" htmlFor="p-stock" error={errors.stock?.message} hint="Los cambios quedan registrados como movimiento">
            <Input id="p-stock" inputMode="numeric" {...register("stock")} />
          </Field>
          <Field label="Stock mínimo" htmlFor="p-min" error={errors.minStock?.message}>
            <Input id="p-min" inputMode="numeric" {...register("minStock")} />
          </Field>
        </div>

        <Field label="Imagen (URL)" htmlFor="p-img" error={errors.imageUrl?.message} hint="Opcional">
          <Input id="p-img" placeholder="https://…" {...register("imageUrl")} />
        </Field>

        <Field label="Descripción" htmlFor="p-desc">
          <textarea id="p-desc" rows={2} className={textareaClass} {...register("description")} />
        </Field>

        <Field label="Notas" htmlFor="p-notes">
          <textarea id="p-notes" rows={2} className={textareaClass} {...register("notes")} />
        </Field>

        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-surface-2 p-3">
          <span>
            <span className="block text-sm font-semibold text-fg">Activo</span>
            <span className="block text-xs text-fg-muted">Disponible para vender en el POS</span>
          </span>
          <input type="checkbox" className="h-5 w-5 accent-[var(--accent)]" {...register("active")} />
        </label>

        {formError && (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
            {formError}
          </p>
        )}
      </form>
    </Modal>
  );
}
