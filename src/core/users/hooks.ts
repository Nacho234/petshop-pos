"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createUserAction,
  listUsersAction,
  setUserActiveAction,
} from "./actions";
import type { CreateUserInput } from "./schemas";

const KEY = "users";

export function useUsers() {
  return useQuery({
    queryKey: [KEY],
    queryFn: () => listUsersAction(),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) => createUserAction(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useSetUserActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setUserActiveAction(id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
