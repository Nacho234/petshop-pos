import type { CashSession, Prisma } from "@prisma/client";

import { prisma } from "@/shared/lib/prisma";
import { BaseRepository } from "@/shared/lib/repository/base-repository";

export type CashSessionRow = CashSession;

export class CashRepository extends BaseRepository {
  // Turno abierto de la organización (o null). Único por diseño.
  getOpenSession(): Promise<CashSessionRow | null> {
    return prisma.cashSession.findFirst({
      where: this.scope<Prisma.CashSessionWhereInput>({ status: "OPEN" }),
    });
  }

  // Abre un turno. Falla si ya hay uno abierto (un solo turno a la vez).
  async openSession(userId: string, openingAmount: number): Promise<CashSessionRow> {
    const existing = await prisma.cashSession.findFirst({
      where: this.scope<Prisma.CashSessionWhereInput>({ status: "OPEN" }),
      select: { id: true },
    });
    if (existing) throw new Error("Ya hay una caja abierta.");

    return prisma.cashSession.create({
      data: this.withOrg({ userId, openingAmount }),
    });
  }

  // Cierra el turno abierto con el efectivo contado y una nota opcional.
  async closeSession(countedAmount: number, note: string | null): Promise<CashSessionRow> {
    const session = await prisma.cashSession.findFirst({
      where: this.scope<Prisma.CashSessionWhereInput>({ status: "OPEN" }),
      select: { id: true },
    });
    if (!session) throw new Error("No hay una caja abierta para cerrar.");

    return prisma.cashSession.update({
      where: { id: session.id },
      data: { status: "CLOSED", countedAmount, note, closedAt: new Date() },
    });
  }

  // Suma de los pagos en EFECTIVO de las ventas asociadas a un turno.
  async cashSalesFor(cashSessionId: string): Promise<number> {
    const res = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        method: "EFECTIVO",
        sale: { organizationId: this.organizationId, cashSessionId, status: "COMPLETED" },
      },
    });
    return Number(res._sum.amount ?? 0);
  }

  // Últimos turnos cerrados, para el historial.
  listClosed(limit: number): Promise<CashSessionRow[]> {
    return prisma.cashSession.findMany({
      where: this.scope<Prisma.CashSessionWhereInput>({ status: "CLOSED" }),
      orderBy: { closedAt: "desc" },
      take: limit,
    });
  }
}
