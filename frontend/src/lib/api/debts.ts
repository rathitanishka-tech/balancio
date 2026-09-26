import { apiRequest } from "@/lib/api/client";
import type { DirectDebt, SimplifiedDebtsResult } from "@/types/debt";

export const debtsApi = {
  async getDirectDebts(groupId: string): Promise<DirectDebt[]> {
    return apiRequest<DirectDebt[]>(`/groups/${groupId}/debts`);
  },

  async getSimplifiedDebts(groupId: string): Promise<SimplifiedDebtsResult> {
    return apiRequest<SimplifiedDebtsResult>(`/groups/${groupId}/debts/simplified`);
  }
};
