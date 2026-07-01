"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createPetAction, deletePetAction, updatePetAction } from "./actions";
import type { PetInput } from "./schemas";

function usePetMutation<T>(fn: (arg: T) => Promise<void>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    // Refresca el detalle del cliente (incluye sus mascotas).
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useCreatePet() {
  return usePetMutation<PetInput>((input) => createPetAction(input));
}

export function useUpdatePet() {
  return usePetMutation<{ id: string; input: PetInput }>(({ id, input }) =>
    updatePetAction(id, input)
  );
}

export function useDeletePet() {
  return usePetMutation<string>((id) => deletePetAction(id));
}
