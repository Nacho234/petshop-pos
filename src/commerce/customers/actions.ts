"use server";

import { assertAccess } from "@/core/auth/session";
import * as service from "./service";
import type { CustomerInput, CustomerListParams } from "./schemas";

export async function listCustomersAction(params: CustomerListParams) {
  await assertAccess("clientes");
  return service.listCustomers(params);
}

export async function getCustomerAction(id: string) {
  await assertAccess("clientes");
  return service.getCustomer(id);
}

export async function createCustomerAction(input: CustomerInput) {
  await assertAccess("clientes");
  return service.createCustomer(input);
}

export async function updateCustomerAction(id: string, input: CustomerInput) {
  await assertAccess("clientes");
  return service.updateCustomer(id, input);
}

export async function deleteCustomerAction(id: string) {
  await assertAccess("clientes");
  return service.deleteCustomer(id);
}
