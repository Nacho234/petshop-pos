"use server";

import { assertAccess } from "@/core/auth/session";
import * as service from "./service";
import type { PetInput } from "./schemas";

export async function createPetAction(input: PetInput) {
  await assertAccess("clientes");
  return service.createPet(input);
}

export async function updatePetAction(id: string, input: PetInput) {
  await assertAccess("clientes");
  return service.updatePet(id, input);
}

export async function deletePetAction(id: string) {
  await assertAccess("clientes");
  return service.deletePet(id);
}
