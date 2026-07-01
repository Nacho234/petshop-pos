import { getTenantId } from "@/core/organizations/tenant-context";
import { BrandRepository } from "./repository";
import { brandInputSchema, type BrandDTO, type BrandInput } from "./schemas";

async function repo() {
  return new BrandRepository(await getTenantId());
}

export async function listBrands(): Promise<BrandDTO[]> {
  const rows = await (await repo()).list();
  return rows.map((b) => ({ id: b.id, name: b.name }));
}

export async function createBrand(input: BrandInput): Promise<BrandDTO> {
  const data = brandInputSchema.parse(input);
  const b = await (await repo()).create(data);
  return { id: b.id, name: b.name };
}

export async function updateBrand(id: string, input: BrandInput): Promise<BrandDTO> {
  const data = brandInputSchema.parse(input);
  const b = await (await repo()).update(id, data);
  if (!b) throw new Error("Marca no encontrada");
  return { id: b.id, name: b.name };
}

export async function deleteBrand(id: string): Promise<void> {
  const r = await repo();
  const count = await r.countProducts(id);
  if (count > 0) {
    throw new Error(`No se puede eliminar: ${count} producto(s) usan esta marca.`);
  }
  const ok = await r.remove(id);
  if (!ok) throw new Error("Marca no encontrada");
}
