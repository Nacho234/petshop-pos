"use server";

import { assertAccess } from "@/core/auth/session";
import * as service from "./service";
import type { CategoryInput } from "./schemas";

export async function listCategoriesAction() {
  await assertAccess("categorias");
  return service.listCategories();
}

export async function createCategoryAction(input: CategoryInput) {
  await assertAccess("categorias");
  return service.createCategory(input);
}

export async function updateCategoryAction(id: string, input: CategoryInput) {
  await assertAccess("categorias");
  return service.updateCategory(id, input);
}

export async function deleteCategoryAction(id: string) {
  await assertAccess("categorias");
  return service.deleteCategory(id);
}
