import { apiRequest } from "@/lib/api/client";
import type { MemberBalance } from "@/types/balance";

export const balancesApi = {
  async getGroupBalances(groupId: string): Promise<MemberBalance[]> {
    const { balances } = await apiRequest<{ groupId: string; balances: MemberBalance[] }>(
      `/groups/${groupId}/balances`
    );
    return balances;
  }
};
