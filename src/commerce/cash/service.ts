import { getSession } from "@/core/auth/session";
import { getTenantId } from "@/core/organizations/tenant-context";
import { CashRepository, type CashSessionRow } from "./repository";
import {
  closeSessionSchema,
  openSessionSchema,
  type CashClosedSummaryDTO,
  type CashMetrics,
  type CashSessionDTO,
  type CloseSessionInput,
  type OpenSessionInput,
} from "./schemas";

async function ctx() {
  const session = await getSession();
  const userId = session?.user.id;
  if (!userId) throw new Error("Sesión no válida.");
  return { repo: new CashRepository(await getTenantId()), userId };
}

function computeMetrics(row: CashSessionRow, cashSales: number): CashMetrics {
  const openingAmount = Number(row.openingAmount);
  return {
    openingAmount,
    cashSales,
    expectedCash: openingAmount + cashSales,
  };
}

function toSessionDTO(row: CashSessionRow, cashSales: number): CashSessionDTO {
  return {
    id: row.id,
    status: row.status,
    openingAmount: Number(row.openingAmount),
    countedAmount: row.countedAmount == null ? null : Number(row.countedAmount),
    note: row.note,
    openedAt: row.openedAt.toISOString(),
    closedAt: row.closedAt?.toISOString() ?? null,
    metrics: computeMetrics(row, cashSales),
  };
}

// Turno abierto con su arqueo, o null si la caja está cerrada.
export async function getCurrentSession(): Promise<CashSessionDTO | null> {
  const { repo } = await ctx();
  const row = await repo.getOpenSession();
  if (!row) return null;
  const cashSales = await repo.cashSalesFor(row.id);
  return toSessionDTO(row, cashSales);
}

export async function openSession(input: OpenSessionInput): Promise<CashSessionDTO> {
  const parsed = openSessionSchema.parse(input);
  const { repo, userId } = await ctx();
  const row = await repo.openSession(userId, parsed.openingAmount);
  return toSessionDTO(row, 0);
}

export async function closeSession(input: CloseSessionInput): Promise<void> {
  const parsed = closeSessionSchema.parse(input);
  const { repo } = await ctx();
  await repo.closeSession(parsed.countedAmount, parsed.note?.trim() || null);
}

// Historial de turnos cerrados con la diferencia de arqueo (contado − esperado).
export async function listClosedSessions(limit = 10): Promise<CashClosedSummaryDTO[]> {
  const { repo } = await ctx();
  const rows = await repo.listClosed(limit);
  return Promise.all(
    rows.map(async (row) => {
      const cashSales = await repo.cashSalesFor(row.id);
      const { expectedCash } = computeMetrics(row, cashSales);
      const counted = row.countedAmount == null ? null : Number(row.countedAmount);
      return {
        id: row.id,
        openedAt: row.openedAt.toISOString(),
        closedAt: row.closedAt?.toISOString() ?? null,
        expectedCash,
        countedAmount: counted,
        difference: counted == null ? null : counted - expectedCash,
      };
    })
  );
}
