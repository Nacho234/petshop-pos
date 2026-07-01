import type { Prisma } from "@prisma/client";

import { prisma } from "@/shared/lib/prisma";
import { BaseRepository } from "@/shared/lib/repository/base-repository";

const MOVEMENT_INCLUDE = {
  product: { select: { name: true } },
} satisfies Prisma.InventoryMovementInclude;

export type MovementRow = Prisma.InventoryMovementGetPayload<{
  include: typeof MOVEMENT_INCLUDE;
}>;

export class InventoryRepository extends BaseRepository {
  private assertProduct(id: string) {
    return prisma.product.findFirst({ where: this.scope({ id }) });
  }

  // Ingreso de mercadería: suma stock + movimiento PURCHASE, en transacción.
  async receive(input: { productId: string; quantity: number; reason?: string; userId?: string }) {
    const product = await this.assertProduct(input.productId);
    if (!product) throw new Error("Producto no encontrado");

    return prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id: input.productId },
        data: { stock: { increment: input.quantity } },
      });
      await tx.inventoryMovement.create({
        data: {
          organizationId: this.organizationId,
          productId: input.productId,
          type: "PURCHASE",
          quantity: input.quantity,
          reason: input.reason?.trim() || "Ingreso de mercadería",
          userId: input.userId ?? null,
        },
      });
      return updated.stock;
    });
  }

  // Ajuste por recuento: fija el stock real + movimiento ADJUSTMENT (delta).
  async adjust(input: { productId: string; newStock: number; reason: string; userId?: string }) {
    const product = await this.assertProduct(input.productId);
    if (!product) throw new Error("Producto no encontrado");

    const delta = input.newStock - product.stock;
    if (delta === 0) return product.stock;

    return prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id: input.productId },
        data: { stock: input.newStock },
      });
      await tx.inventoryMovement.create({
        data: {
          organizationId: this.organizationId,
          productId: input.productId,
          type: "ADJUSTMENT",
          quantity: delta,
          reason: input.reason.trim(),
          userId: input.userId ?? null,
        },
      });
      return updated.stock;
    });
  }

  listMovements(productId: string | undefined, limit: number): Promise<MovementRow[]> {
    return prisma.inventoryMovement.findMany({
      where: this.scope(productId ? { productId } : {}),
      include: MOVEMENT_INCLUDE,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  // Productos activos cuyo stock está en o por debajo del mínimo (incluye sin
  // stock). Comparación columna-a-columna → SQL crudo (scoped por tenant).
  lowStock() {
    return prisma.$queryRaw<
      { id: string; name: string; stock: number; minStock: number }[]
    >`
      SELECT id, name, stock, "minStock"
      FROM "Product"
      WHERE "organizationId" = ${this.organizationId}
        AND active = true
        AND stock <= "minStock"
      ORDER BY stock ASC, name ASC
    `;
  }
}
