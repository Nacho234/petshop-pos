import { getSession } from "@/core/auth/session";
import { getTenantId } from "@/core/organizations/tenant-context";
import { prisma } from "@/shared/lib/prisma";
import { APP_CONFIG } from "@/shared/config/app";
import { SaleRepository, type SaleRow } from "./repository";
import { createSaleSchema, type CreateSaleInput, type PaymentMethod, type SaleDTO } from "./schemas";

export type TicketBusiness = {
  name: string;
  legalName: string | null;
  taxId: string | null;
  address: string | null;
  currency: string;
};

export type TicketData = { sale: SaleDTO; business: TicketBusiness };

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

// Ventas de los últimos `days` días (desde el inicio de ese día), para los
// reportes. Devuelve DTOs; la agregación (totales, series, top) se hace en la
// vista. `days` se acota a [1, 90].
export async function listSales(days: number): Promise<SaleDTO[]> {
  const d = Math.min(Math.max(Math.trunc(days) || 30, 1), 90);
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() - (d - 1));

  const repo = new SaleRepository(await getTenantId());
  const rows = await repo.listSince(from);
  return rows.map(toDTO);
}

// Venta + datos del negocio para el comprobante. Lee tablas existentes.
export async function getSaleForTicket(id: string): Promise<TicketData | null> {
  const orgId = await getTenantId();
  const repo = new SaleRepository(orgId);
  const row = await repo.getById(id);
  if (!row) return null;

  const settings = await prisma.settings.findUnique({
    where: { organizationId: orgId },
  });

  return {
    sale: toDTO(row),
    business: {
      name: settings?.businessName ?? APP_CONFIG.name,
      legalName: settings?.legalName ?? null,
      taxId: settings?.taxId ?? null,
      address: settings?.address ?? null,
      currency: settings?.currency ?? APP_CONFIG.defaultCurrency,
    },
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
