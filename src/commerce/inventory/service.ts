import { getSession } from "@/core/auth/session";
import { getTenantId } from "@/core/organizations/tenant-context";
import { InventoryRepository, type MovementRow } from "./repository";
import {
  adjustStockSchema,
  receiveStockSchema,
  type AdjustStockInput,
  type LowStockDTO,
  type MovementDTO,
  type ReceiveStockInput,
} from "./schemas";

async function ctx() {
  const orgId = await getTenantId();
  const session = await getSession();
  return { repo: new InventoryRepository(orgId), userId: session?.user.id };
}

function toMovementDTO(row: MovementRow): MovementDTO {
  return {
    id: row.id,
    productId: row.productId,
    productName: row.product.name,
    type: row.type,
    quantity: row.quantity,
    reason: row.reason,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function receiveStock(input: ReceiveStockInput): Promise<number> {
  const parsed = receiveStockSchema.parse(input);
  const { repo, userId } = await ctx();
  return repo.receive({ ...parsed, userId });
}

export async function adjustStock(input: AdjustStockInput): Promise<number> {
  const parsed = adjustStockSchema.parse(input);
  const { repo, userId } = await ctx();
  return repo.adjust({ ...parsed, userId });
}

export async function listMovements(
  productId?: string,
  limit = 50
): Promise<MovementDTO[]> {
  const { repo } = await ctx();
  const rows = await repo.listMovements(productId, Math.min(Math.max(limit, 1), 200));
  return rows.map(toMovementDTO);
}

export async function listLowStock(): Promise<LowStockDTO[]> {
  const { repo } = await ctx();
  const rows = await repo.lowStock();
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    stock: Number(r.stock),
    minStock: Number(r.minStock),
  }));
}
