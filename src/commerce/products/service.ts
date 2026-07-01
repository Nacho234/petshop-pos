import { Prisma } from "@prisma/client";

import { getTenantId } from "@/core/organizations/tenant-context";
import { ProductRepository, type ProductData, type ProductRow } from "./repository";
import {
  productInputSchema,
  productListParamsSchema,
  type ProductDTO,
  type ProductInput,
  type ProductListParams,
  type ProductListResult,
} from "./schemas";

async function repo() {
  return new ProductRepository(await getTenantId());
}

function toDTO(row: ProductRow): ProductDTO {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    sku: row.sku,
    barcode: row.barcode,
    categoryId: row.categoryId,
    categoryName: row.category?.name ?? null,
    brandId: row.brandId,
    brandName: row.brand?.name ?? null,
    cost: Number(row.cost),
    price: Number(row.price),
    taxRate: Number(row.taxRate),
    stock: row.stock,
    minStock: row.minStock,
    active: row.active,
    imageUrl: row.imageUrl,
    notes: row.notes,
  };
}

const clean = (v?: string) => {
  const t = v?.trim();
  return t ? t : null;
};

// Separa los campos escalares del producto del stock (que va por movimiento).
function toData(input: ProductInput): { data: ProductData; stock: number } {
  return {
    data: {
      name: input.name.trim(),
      description: clean(input.description),
      sku: clean(input.sku),
      barcode: clean(input.barcode),
      categoryId: clean(input.categoryId),
      brandId: clean(input.brandId),
      cost: input.cost,
      price: input.price,
      taxRate: input.taxRate,
      minStock: input.minStock,
      active: input.active,
      imageUrl: clean(input.imageUrl),
      notes: clean(input.notes),
    },
    stock: input.stock,
  };
}

function mapUniqueError(e: unknown): never {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    const target = (e.meta?.target as string[] | undefined)?.join(", ") ?? "";
    if (target.includes("sku")) throw new Error("Ya existe un producto con ese SKU.");
    if (target.includes("barcode"))
      throw new Error("Ya existe un producto con ese código de barras.");
    throw new Error("Valor duplicado.");
  }
  throw e;
}

export async function listProducts(
  params: ProductListParams
): Promise<ProductListResult> {
  const parsed = productListParamsSchema.parse(params);
  const { items, total } = await (await repo()).list(parsed);
  return {
    items: items.map(toDTO),
    total,
    page: parsed.page,
    pageSize: parsed.pageSize,
  };
}

export async function createProduct(input: ProductInput): Promise<ProductDTO> {
  const parsed = productInputSchema.parse(input);
  const { data, stock } = toData(parsed);
  try {
    const row = await (await repo()).create(data, stock);
    return toDTO(row);
  } catch (e) {
    mapUniqueError(e);
  }
}

export async function updateProduct(
  id: string,
  input: ProductInput
): Promise<ProductDTO> {
  const parsed = productInputSchema.parse(input);
  const { data, stock } = toData(parsed);
  try {
    const row = await (await repo()).update(id, data, stock);
    if (!row) throw new Error("Producto no encontrado");
    return toDTO(row);
  } catch (e) {
    mapUniqueError(e);
  }
}

export async function setProductActive(id: string, active: boolean): Promise<void> {
  const ok = await (await repo()).setActive(id, active);
  if (!ok) throw new Error("Producto no encontrado");
}

// Búsqueda liviana para el POS: sólo productos activos.
export async function searchProducts(q: string): Promise<ProductDTO[]> {
  const res = await listProducts({
    q: q.trim() || undefined,
    active: true,
    page: 1,
    pageSize: 20,
    sort: "name",
  });
  return res.items;
}
