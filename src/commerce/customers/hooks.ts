"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createCustomerAction,
  deleteCustomerAction,
  getCustomerAction,
  listCustomersAction,
  updateCustomerAction,
} from "./actions";
import type { CustomerInput, CustomerListParams } from "./schemas";

const KEY = "customers";

export function useCustomers(params: CustomerListParams) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => listCustomersAction(params),
    placeholderData: keepPreviousData,
  });
}

export function useCustomer(id: string | null) {
  return useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => getCustomerAction(id!),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CustomerInput) => createCustomerAction(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CustomerInput }) =>
      updateCustomerAction(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCustomerAction(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
