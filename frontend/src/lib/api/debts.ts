import { getDirectDebts, getSimplifiedDebts } from "@/lib/actions/debts";
import type { DirectDebt, SimplifiedDebtsResult } from "@/types/debt";

export const debtsApi = {
  async getDirectDebts(groupId: string): Promise<DirectDebt[]> {
    return await getDirectDebts(groupId);
  },

  async getSimplifiedDebts(groupId: string): Promise<SimplifiedDebtsResult> {
    return await getSimplifiedDebts(groupId);
  }
};
