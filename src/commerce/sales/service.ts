import { getSession } from "@/core/auth/session";
import { getTenantId } from "@/core/organizations/tenant-context";
import { SaleRepository, type SaleRow } from "./repository";
import { createSaleSchema, type CreateSaleInput, type PaymentMethod, type SaleDTO } from "./schemas";

function toDTO(row: SaleRow): SaleDTO {
  return {
    id: row.id,
    number: row.number,
    subtotal: Number(row.subtotal),
    discount: Number(row.discount),
    total: Number(row.total),
    createdAt: row.createdAt.toISOString(),
    items: row.items.map((i) => ({
      name: i.name,
      unitPrice: Number(i.unitPrice),
      qty: i.qty,
      subtotal: Number(i.subtotal),
    })),
    payments: row.payments.map((p) => ({
      method: p.method as PaymentMethod,
      amount: Number(p.amount),
    })),
  };
}

export async function createSale(input: CreateSaleInput): Promise<SaleDTO> {
  const parsed = createSaleSchema.parse(input);

  const session = await getSession();
  const employeeId = session?.user.id;
  if (!employeeId) throw new Error("Sesión no válida.");

  const repo = new SaleRepository(await getTenantId());
  const row = await repo.createSale({
    items: parsed.items,
    discount: parsed.discount,
    payments: parsed.payments,
    employeeId,
  });
  return toDTO(row);
}
