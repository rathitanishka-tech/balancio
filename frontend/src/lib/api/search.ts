import { searchAll } from "@/lib/actions/search";
import type { SearchResults } from "@/types/search";

export const searchApi = {
  async search(query: string): Promise<SearchResults> {
    return await searchAll(query);
  }
};
