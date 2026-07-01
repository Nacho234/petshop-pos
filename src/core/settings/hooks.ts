"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getSettingsAction, updateSettingsAction } from "./actions";
import type { SettingsInput } from "./schemas";

const KEY = "settings";

export function useSettings() {
  return useQuery({
    queryKey: [KEY],
    queryFn: () => getSettingsAction(),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SettingsInput) => updateSettingsAction(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
