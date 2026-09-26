import { apiRequest, apiRequestPaginated } from "@/lib/api/client";
import type { CreateSettlementPayload, Settlement, SettlementFilters } from "@/types/settlement";
import type { PaginationMeta } from "@/types/api";

export interface SettlementListResult {
  items: Settlement[];
  pagination: PaginationMeta;
}

export const settlementsApi = {
  async list(filters: SettlementFilters = {}): Promise<SettlementListResult> {
    const result = await apiRequestPaginated<Settlement>("/settlements", { query: { ...filters } });
    return { items: result.data, pagination: result.pagination };
  },

  async get(settlementId: string): Promise<Settlement> {
    const { settlement } = await apiRequest<{ settlement: Settlement }>(`/settlements/${settlementId}`);
    return settlement;
  },

  async create(payload: CreateSettlementPayload): Promise<Settlement> {
    const { settlement } = await apiRequest<{ settlement: Settlement }>("/settlements", {
      method: "POST",
      body: payload
    });
    return settlement;
  },

  async remove(settlementId: string): Promise<void> {
    await apiRequest<void>(`/settlements/${settlementId}`, { method: "DELETE" });
  }
};
