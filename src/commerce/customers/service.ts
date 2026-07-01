import { getTenantId } from "@/core/organizations/tenant-context";
import { CustomerRepository, type CustomerDetailRow } from "./repository";
import {
  customerInputSchema,
  customerListParamsSchema,
  type CustomerDetailDTO,
  type CustomerInput,
  type CustomerListParams,
  type CustomerListResult,
} from "./schemas";

async function repo() {
  return new CustomerRepository(await getTenantId());
}

const clean = (v?: string) => {
  const t = v?.trim();
  return t ? t : null;
};

function toDetailDTO(row: CustomerDetailRow): CustomerDetailDTO {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    notes: row.notes,
    points: row.points,
    petsCount: row._count.pets,
    pets: row.pets.map((p) => ({
      id: p.id,
      name: p.name,
      species: p.species,
      breed: p.breed,
      birthdate: p.birthdate ? p.birthdate.toISOString() : null,
      notes: p.notes,
    })),
  };
}

export async function listCustomers(
  params: CustomerListParams
): Promise<CustomerListResult> {
  const parsed = customerListParamsSchema.parse(params);
  const { items, total } = await (await repo()).list(parsed);
  return {
    items: items.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      notes: c.notes,
      points: c.points,
      petsCount: c._count.pets,
    })),
    total,
    page: parsed.page,
    pageSize: parsed.pageSize,
  };
}

export async function getCustomer(id: string): Promise<CustomerDetailDTO | null> {
  const row = await (await repo()).findById(id);
  return row ? toDetailDTO(row) : null;
}

export async function createCustomer(input: CustomerInput): Promise<CustomerDetailDTO> {
  const p = customerInputSchema.parse(input);
  const row = await (await repo()).create({
    name: p.name.trim(),
    phone: clean(p.phone),
    email: clean(p.email),
    notes: clean(p.notes),
  });
  return toDetailDTO(row);
}

export async function updateCustomer(
  id: string,
  input: CustomerInput
): Promise<CustomerDetailDTO> {
  const p = customerInputSchema.parse(input);
  const row = await (await repo()).update(id, {
    name: p.name.trim(),
    phone: clean(p.phone),
    email: clean(p.email),
    notes: clean(p.notes),
  });
  if (!row) throw new Error("Cliente no encontrado");
  return toDetailDTO(row);
}

export async function deleteCustomer(id: string): Promise<void> {
  const ok = await (await repo()).remove(id);
  if (!ok) throw new Error("Cliente no encontrado");
}
