"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createBrandAction,
  deleteBrandAction,
  listBrandsAction,
  updateBrandAction,
} from "./actions";
import type { BrandInput } from "./schemas";

const KEY = ["brands"] as const;

export function useBrands() {
  return useQuery({ queryKey: KEY, queryFn: () => listBrandsAction() });
}

export function useCreateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BrandInput) => createBrandAction(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: BrandInput }) =>
      updateBrandAction(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBrandAction(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
