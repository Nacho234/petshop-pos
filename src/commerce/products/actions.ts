"use server";

import { assertAccess } from "@/core/auth/session";
import * as service from "./service";
import type { ProductInput, ProductListParams } from "./schemas";

export async function listProductsAction(params: ProductListParams) {
  await assertAccess("productos");
  return service.listProducts(params);
}

export async function createProductAction(input: ProductInput) {
  await assertAccess("productos");
  return service.createProduct(input);
}

export async function updateProductAction(id: string, input: ProductInput) {
  await assertAccess("productos");
  return service.updateProduct(id, input);
}

export async function setProductActiveAction(id: string, active: boolean) {
  await assertAccess("productos");
  return service.setProductActive(id, active);
}
