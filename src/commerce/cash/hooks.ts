"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  closeSessionAction,
  getCurrentSessionAction,
  listClosedSessionsAction,
  openSessionAction,
} from "./actions";
import type { CloseSessionInput, OpenSessionInput } from "./schemas";

const KEY = "cash";

export function useCashSession() {
  return useQuery({
    queryKey: [KEY, "current"],
    queryFn: () => getCurrentSessionAction(),
  });
}

export function useClosedSessions(limit = 10) {
  return useQuery({
    queryKey: [KEY, "closed", limit],
    queryFn: () => listClosedSessionsAction(limit),
  });
}

function useCashMutation<TInput, TResult>(fn: (input: TInput) => Promise<TResult>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useOpenCash() {
  return useCashMutation((input: OpenSessionInput) => openSessionAction(input));
}

export function useCloseCash() {
  return useCashMutation((input: CloseSessionInput) => closeSessionAction(input));
}
