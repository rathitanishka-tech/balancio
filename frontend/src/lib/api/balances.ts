import { getGroupBalances } from "@/lib/actions/balances";
import type { MemberBalance } from "@/types/balance";

export const balancesApi = {
  async getGroupBalances(groupId: string): Promise<MemberBalance[]> {
    return await getGroupBalances(groupId);
  }
};
