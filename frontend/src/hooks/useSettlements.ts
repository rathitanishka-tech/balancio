import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settlementsApi } from "@/lib/api/settlements";
import { queryKeys } from "@/lib/utils/query-keys";
import type { CreateSettlementPayload, SettlementFilters } from "@/types/settlement";

export function useSettlements(filters: SettlementFilters = {}) {
  return useQuery({
    queryKey: queryKeys.settlements(filters as Record<string, unknown>),
    queryFn: () => settlementsApi.list(filters)
  });
}

export function useSettlement(settlementId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.settlement(settlementId ?? ""),
    queryFn: () => settlementsApi.get(settlementId as string),
    enabled: Boolean(settlementId)
  });
}

/**
 * Mirrors the "critical settlement UX" flow from the spec: after a
 * settlement is recorded, balances, debts, settlements, the dashboard
 * (analytics) and notifications must all refresh.
 */
export function useCreateSettlement(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSettlementPayload) => settlementsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settlements"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.balances(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.directDebts(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.simplifiedDebts(groupId) });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
    }
  });
}

export function useDeleteSettlement(groupId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settlementId: string) => settlementsApi.remove(settlementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settlements"] });
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.balances(groupId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.directDebts(groupId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.simplifiedDebts(groupId) });
      }
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    }
  });
}
