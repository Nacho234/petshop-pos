"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createProductAction,
  listProductsAction,
  setProductActiveAction,
  updateProductAction,
} from "./actions";
import type { ProductInput, ProductListParams } from "./schemas";

const KEY = "products";

export function useProducts(params: ProductListParams) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => listProductsAction(params),
    placeholderData: keepPreviousData,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProductInput) => createProductAction(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProductInput }) =>
      updateProductAction(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useSetProductActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setProductActiveAction(id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
