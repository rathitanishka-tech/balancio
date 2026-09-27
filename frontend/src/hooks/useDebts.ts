import { useQuery } from "@tanstack/react-query";
import { debtsApi } from "@/lib/api/debts";
import { queryKeys } from "@/lib/utils/query-keys";

export function useDirectDebts(groupId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.directDebts(groupId ?? ""),
    queryFn: () => debtsApi.getDirectDebts(groupId as string),
    enabled: Boolean(groupId)
  });
}

/**
 * `enabled: false` by default - simplification is a deliberate user action
 * ("Simplify debts" button), not something we fetch eagerly on page load.
 * The debts page calls `refetch()` when the button is pressed.
 */
export function useSimplifiedDebts(groupId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.simplifiedDebts(groupId ?? ""),
    queryFn: () => debtsApi.getSimplifiedDebts(groupId as string),
    enabled: false
  });
}
