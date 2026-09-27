import { useQuery } from "@tanstack/react-query";
import { balancesApi } from "@/lib/api/balances";
import { queryKeys } from "@/lib/utils/query-keys";

export function useBalances(groupId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.balances(groupId ?? ""),
    queryFn: () => balancesApi.getGroupBalances(groupId as string),
    enabled: Boolean(groupId)
  });
}
