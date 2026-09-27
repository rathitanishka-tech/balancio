export interface SearchResults {
  groups: { id: string; name: string; description?: string }[];
  expenses: { id: string; title: string; amount: number; groupId: string; date: string }[];
  users: { id: string; name: string; email: string }[];
  settlements: { id: string; amount: number; groupId: string; note?: string; date: string }[];
}
