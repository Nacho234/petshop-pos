import { getTenantId } from "@/core/organizations/tenant-context";
import { PetRepository, type PetData } from "./repository";
import { petInputSchema, type PetInput } from "./schemas";

async function repo() {
  return new PetRepository(await getTenantId());
}

const clean = (v?: string) => {
  const t = v?.trim();
  return t ? t : null;
};

function toData(input: PetInput): PetData {
  return {
    name: input.name.trim(),
    species: clean(input.species),
    breed: clean(input.breed),
    // Fecha a mediodía UTC para evitar corrimientos de zona horaria.
    birthdate: input.birthdate ? new Date(`${input.birthdate}T12:00:00Z`) : null,
    notes: clean(input.notes),
  };
}

export async function createPet(input: PetInput): Promise<void> {
  const p = petInputSchema.parse(input);
  await (await repo()).create(p.customerId, toData(p));
}

export async function updatePet(id: string, input: PetInput): Promise<void> {
  const p = petInputSchema.parse(input);
  const ok = await (await repo()).update(id, toData(p));
  if (!ok) throw new Error("Mascota no encontrada");
}

export async function deletePet(id: string): Promise<void> {
  const ok = await (await repo()).remove(id);
  if (!ok) throw new Error("Mascota no encontrada");
}
