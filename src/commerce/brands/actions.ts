"use server";

import { assertAccess } from "@/core/auth/session";
import * as service from "./service";
import type { BrandInput } from "./schemas";

export async function listBrandsAction() {
  await assertAccess("marcas");
  return service.listBrands();
}

export async function createBrandAction(input: BrandInput) {
  await assertAccess("marcas");
  return service.createBrand(input);
}

export async function updateBrandAction(id: string, input: BrandInput) {
  await assertAccess("marcas");
  return service.updateBrand(id, input);
}

export async function deleteBrandAction(id: string) {
  await assertAccess("marcas");
  return service.deleteBrand(id);
}
