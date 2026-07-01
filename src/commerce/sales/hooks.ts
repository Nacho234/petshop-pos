"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createSaleAction } from "./actions";
import type { CreateSaleInput } from "./schemas";

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSaleInput) => createSaleAction(input),
    onSuccess: () => {
      // El stock cambió: invalidar productos.
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
