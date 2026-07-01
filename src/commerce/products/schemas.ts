import { z } from "zod";

// Entrada del formulario. Los números se coercen (vienen como string del form).
export const productInputSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  sku: z.string().trim().max(60).optional().or(z.literal("")),
  barcode: z.string().trim().max(60).optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
  brandId: z.string().optional().or(z.literal("")),
  cost: z.coerce.number().min(0, "No puede ser negativo").default(0),
  price: z.coerce.number().min(0, "No puede ser negativo").default(0),
  taxRate: z.coerce.number().min(0).max(100).default(21),
  stock: z.coerce.number().int().default(0),
  minStock: z.coerce.number().int().min(0).default(0),
  active: z.boolean().default(true),
  imageUrl: z.string().trim().url("URL inválida").optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type ProductInput = z.infer<typeof productInputSchema>;

export const productSortSchema = z
  .enum(["name", "price", "stock", "recent"])
  .default("name");
export type ProductSort = z.infer<typeof productSortSchema>;

export const productListParamsSchema = z.object({
  q: z.string().trim().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  active: z.boolean().optional(),
  sort: productSortSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ProductListParams = z.infer<typeof productListParamsSchema>;

export type ProductDTO = {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  barcode: string | null;
  categoryId: string | null;
  categoryName: string | null;
  brandId: string | null;
  brandName: string | null;
  cost: number;
  price: number;
  taxRate: number;
  stock: number;
  minStock: number;
  active: boolean;
  imageUrl: string | null;
  notes: string | null;
};

export type ProductListResult = {
  items: ProductDTO[];
  total: number;
  page: number;
  pageSize: number;
};
