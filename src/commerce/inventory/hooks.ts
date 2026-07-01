"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  adjustStockAction,
  listLowStockAction,
  listMovementsAction,
  receiveStockAction,
} from "./actions";
import type { AdjustStockInput, ReceiveStockInput } from "./schemas";

const KEY = "inventory";

export function useLowStock() {
  return useQuery({
    queryKey: [KEY, "low-stock"],
    queryFn: () => listLowStockAction(),
  });
}

export function useMovements(productId?: string) {
  return useQuery({
    queryKey: [KEY, "movements", productId ?? "all"],
    queryFn: () => listMovementsAction(productId),
  });
}

function useStockMutation<T>(fn: (input: T) => Promise<number>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useReceiveStock() {
  return useStockMutation<ReceiveStockInput>((input) => receiveStockAction(input));
}

export function useAdjustStock() {
  return useStockMutation<AdjustStockInput>((input) => adjustStockAction(input));
}
