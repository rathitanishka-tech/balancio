import { apiRequest } from "@/lib/api/client";
import type { SearchResults } from "@/types/search";

export const searchApi = {
  async search(query: string): Promise<SearchResults> {
    return apiRequest<SearchResults>("/search", { query: { q: query } });
  }
};
