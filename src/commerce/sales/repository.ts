import type { Prisma } from "@prisma/client";

import { prisma } from "@/shared/lib/prisma";
import { BaseRepository } from "@/shared/lib/repository/base-repository";

const SALE_INCLUDE = {
  items: true,
  payments: true,
} satisfies Prisma.SaleInclude;

export type SaleRow = Prisma.SaleGetPayload<{ include: typeof SALE_INCLUDE }>;

export type SaleItemData = { productId: string; qty: number; unitPrice: number };
export type PaymentData = { method: Prisma.PaymentCreateManyInput["method"]; amount: number };

export class SaleRepository extends BaseRepository {
  // Ventas del tenant desde una fecha (inclusive), con detalle y pagos.
  // Ordenadas por fecha ascendente para armar series diarias en reportes.
  async listSince(from: Date): Promise<SaleRow[]> {
    return prisma.sale.findMany({
      where: this.scope({ createdAt: { gte: from } }),
      include: SALE_INCLUDE,
      orderBy: { createdAt: "asc" },
    });
  }

  // Una venta del tenant por id (para el comprobante/ticket).
  getById(id: string): Promise<SaleRow | null> {
    return prisma.sale.findFirst({
      where: { organizationId: this.organizationId, id },
      include: SALE_INCLUDE,
    });
  }

  // Crea la venta completa en una sola transacción:
  //  - valida existencia/actividad/stock de cada producto (del tenant),
  //  - asigna el número correlativo,
  //  - graba encabezado + detalle (con snapshots) + pagos,
  //  - descuenta stock y registra un InventoryMovement SALE por ítem.
  async createSale(input: {
    items: SaleItemData[];
    discount: number;
    payments: PaymentData[];
    employeeId: string;
  }): Promise<SaleRow> {
    const org = this.organizationId;

    return prisma.$transaction(async (tx) => {
      const ids = input.items.map((i) => i.productId);
      const products = await tx.product.findMany({
        where: { organizationId: org, id: { in: ids } },
      });
      const byId = new Map(products.map((p) => [p.id, p]));

      // Validaciones
      for (const item of input.items) {
        const p = byId.get(item.productId);
        if (!p) throw new Error("Un producto de la venta no existe.");
        if (!p.active) throw new Error(`"${p.name}" está inactivo.`);
        if (item.qty > p.stock) {
          throw new Error(`Stock insuficiente de "${p.name}" (hay ${p.stock}).`);
        }
      }

      const subtotal = input.items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
      const total = subtotal - input.discount;
      if (input.discount > subtotal) throw new Error("El descuento supera el subtotal.");

      const paid = input.payments.reduce((s, p) => s + p.amount, 0);
      if (Math.abs(paid - total) > 0.01) {
        throw new Error("El total pagado no coincide con el total de la venta.");
      }

      // Número correlativo por organización.
      const last = await tx.sale.findFirst({
        where: { organizationId: org },
        orderBy: { number: "desc" },
        select: { number: true },
      });
      const number = (last?.number ?? 0) + 1;

      // Exige caja abierta: no se puede vender con la caja cerrada.
      const openCash = await tx.cashSession.findFirst({
        where: { organizationId: org, status: "OPEN" },
        select: { id: true },
      });
      if (!openCash) {
        throw new Error("La caja está cerrada. Abrí la caja antes de registrar ventas.");
      }

      const sale = await tx.sale.create({
        data: {
          organizationId: org,
          number,
          employeeId: input.employeeId,
          cashSessionId: openCash.id,
          subtotal,
          discount: input.discount,
          total,
          items: {
            create: input.items.map((i) => {
              const p = byId.get(i.productId)!;
              return {
                productId: i.productId,
                name: p.name,
                unitPrice: i.unitPrice,
                qty: i.qty,
                subtotal: i.unitPrice * i.qty,
              };
            }),
          },
          payments: {
            create: input.payments.map((p) => ({ method: p.method, amount: p.amount })),
          },
        },
        include: SALE_INCLUDE,
      });

      // Descuento de stock + movimiento por ítem.
      for (const item of input.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.qty } },
        });
        await tx.inventoryMovement.create({
          data: {
            organizationId: org,
            productId: item.productId,
            type: "SALE",
            quantity: -item.qty,
            reason: `Venta #${number}`,
            saleId: sale.id,
            userId: input.employeeId,
          },
        });
      }

      return sale;
    });
  }
}
