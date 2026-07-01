import { getTenantId } from "@/core/organizations/tenant-context";
import { CategoryRepository } from "./repository";
import { categoryInputSchema, type CategoryDTO, type CategoryInput } from "./schemas";

async function repo() {
  return new CategoryRepository(await getTenantId());
}

export async function listCategories(): Promise<CategoryDTO[]> {
  const rows = await (await repo()).list();
  return rows.map((c) => ({ id: c.id, name: c.name }));
}

export async function createCategory(input: CategoryInput): Promise<CategoryDTO> {
  const data = categoryInputSchema.parse(input);
  const c = await (await repo()).create(data);
  return { id: c.id, name: c.name };
}

export async function updateCategory(
  id: string,
  input: CategoryInput
): Promise<CategoryDTO> {
  const data = categoryInputSchema.parse(input);
  const c = await (await repo()).update(id, data);
  if (!c) throw new Error("Categoría no encontrada");
  return { id: c.id, name: c.name };
}

export async function deleteCategory(id: string): Promise<void> {
  const r = await repo();
  const count = await r.countProducts(id);
  if (count > 0) {
    throw new Error(
      `No se puede eliminar: ${count} producto(s) usan esta categoría.`
    );
  }
  const ok = await r.remove(id);
  if (!ok) throw new Error("Categoría no encontrada");
}
