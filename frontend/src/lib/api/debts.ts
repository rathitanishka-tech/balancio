import { apiRequest } from "@/lib/api/client";
import { getSimplifiedDebts } from "@/lib/actions/debts";
import type { DirectDebt, SimplifiedDebtsResult } from "@/types/debt";

export const debtsApi = {
  async getDirectDebts(groupId: string): Promise<DirectDebt[]> {
    return [];
  },

  async getSimplifiedDebts(groupId: string): Promise<SimplifiedDebtsResult> {
    const data = await getSimplifiedDebts(groupId);
    return data;
  }
};
