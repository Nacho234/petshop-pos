import type { Prisma } from "@prisma/client";

import { prisma } from "@/shared/lib/prisma";
import { BaseRepository } from "@/shared/lib/repository/base-repository";
import type { ProductListParams } from "./schemas";

const PRODUCT_INCLUDE = {
  category: { select: { name: true } },
  brand: { select: { name: true } },
} satisfies Prisma.ProductInclude;

export type ProductRow = Prisma.ProductGetPayload<{
  include: typeof PRODUCT_INCLUDE;
}>;

// Campos escalares creables/editables (sin stock, que se maneja por movimiento).
export type ProductData = Omit<
  Prisma.ProductUncheckedCreateInput,
  "id" | "organizationId" | "stock" | "createdAt" | "updatedAt"
>;

export class ProductRepository extends BaseRepository {
  async list(params: ProductListParams): Promise<{ items: ProductRow[]; total: number }> {
    const { q, categoryId, brandId, active, sort = "name", page, pageSize } = params;

    const where: Prisma.ProductWhereInput = this.scope();
    if (categoryId) where.categoryId = categoryId;
    if (brandId) where.brandId = brandId;
    if (active !== undefined) where.active = active;
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { barcode: { contains: q, mode: "insensitive" } },
      ];
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sort === "price"
        ? { price: "asc" }
        : sort === "stock"
          ? { stock: "asc" }
          : sort === "recent"
            ? { createdAt: "desc" }
            : { name: "asc" };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: PRODUCT_INCLUDE,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    return { items, total };
  }

  findById(id: string) {
    return prisma.product.findFirst({
      where: this.scope({ id }),
      include: PRODUCT_INCLUDE,
    });
  }

  // Crea el producto y, si arranca con stock, registra el movimiento INITIAL,
  // todo en una transacción.
  async create(data: ProductData, initialStock: number): Promise<ProductRow> {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: { ...data, organizationId: this.organizationId, stock: initialStock },
        include: PRODUCT_INCLUDE,
      });
      if (initialStock !== 0) {
        await tx.inventoryMovement.create({
          data: {
            organizationId: this.organizationId,
            productId: product.id,
            type: "INITIAL",
            quantity: initialStock,
            reason: "Stock inicial",
          },
        });
      }
      return product;
    });
  }

  // Actualiza campos y, si cambió el stock, registra un ADJUSTMENT con el delta.
  async update(
    id: string,
    data: ProductData,
    newStock: number
  ): Promise<ProductRow | null> {
    const current = await prisma.product.findFirst({ where: this.scope({ id }) });
    if (!current) return null;

    const delta = newStock - current.stock;

    return prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id },
        data: { ...data, stock: newStock },
        include: PRODUCT_INCLUDE,
      });
      if (delta !== 0) {
        await tx.inventoryMovement.create({
          data: {
            organizationId: this.organizationId,
            productId: id,
            type: "ADJUSTMENT",
            quantity: delta,
            reason: "Ajuste manual",
          },
        });
      }
      return product;
    });
  }

  async setActive(id: string, active: boolean): Promise<boolean> {
    const res = await prisma.product.updateMany({
      where: this.scope({ id }),
      data: { active },
    });
    return res.count > 0;
  }
}
