import { apiRequest } from "@/lib/api/client";
import { getSettlements, createSettlement } from "@/lib/actions/settlements";
import type { CreateSettlementPayload, Settlement, SettlementFilters } from "@/types/settlement";
import type { PaginationMeta } from "@/types/api";

export interface SettlementListResult {
  items: Settlement[];
  pagination: PaginationMeta;
}

export const settlementsApi = {
  async list(filters: SettlementFilters = {}): Promise<SettlementListResult> {
    const data = await getSettlements(filters);
    return data as SettlementListResult;
  },

  async get(settlementId: string): Promise<Settlement> {
    throw new Error("Not implemented yet");
  },

  async create(payload: CreateSettlementPayload): Promise<Settlement> {
    const data = await createSettlement(payload);
    return data as Settlement;
  },

  async remove(settlementId: string): Promise<void> {
    await apiRequest<void>(`/settlements/${settlementId}`, { method: "DELETE" });
  }
};
