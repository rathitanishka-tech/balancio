import { apiRequest } from "./client";
// Redefining types for clean separation from backend

export interface AIExpenseDraft {
  intent: "CREATE_EXPENSE" | "ASK_QUESTION" | "UNKNOWN";
  title?: string;
  amountMinor?: number;
  currency?: string;
  date?: string;
  paidBy?: { type: "CURRENT_USER" | "SPECIFIC_USER", name?: string };
  participants?: { name: string, share?: number }[];
  splitType?: "EQUAL" | "PERCENTAGE" | "CUSTOM" | "EXACT";
  category?: string;
  notes?: string;
  confidence: number;
}

export interface AIReceiptExtraction {
  merchant?: string;
  date?: string;
  currency?: string;
  subtotalMinor?: number;
  taxMinor?: number;
  totalMinor?: number;
  category?: string;
  lineItems?: { name: string, amountMinor: number }[];
  confidence: number;
}

export const aiApi = {
  parseExpense: async (text: string, groupMembers?: string[]): Promise<AIExpenseDraft> => {
    return apiRequest("/ai/parse-expense", { method: "POST", body: { text, groupMembers } });
  },
  
  parseReceipt: async (file: File): Promise<AIReceiptExtraction> => {
    // Note: apiRequest sets Content-Type: application/json if body is defined.
    // Since FormData requires multipart/form-data boundary, we'll use native fetch here
    // or modify apiRequest. For simplicity, we just use native fetch with token.
    const { getToken, clearToken } = await import("@/lib/auth/token");
    const formData = new FormData();
    formData.append("receipt", file);
    
    const headers: Record<string, string> = {};
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch("/api/ai/parse-receipt", {
      method: "POST",
      headers,
      body: formData
    });
    if (!res.ok) throw new Error("Failed to parse receipt");
    return res.json();
  },

  getInsights: async (analyticsData: any): Promise<{ summary: string }> => {
    return apiRequest("/ai/insights", { method: "POST", body: { analyticsData } });
  },

  explainDebt: async (debtData: any): Promise<{ explanation: string }> => {
    return apiRequest("/ai/explain-debt", { method: "POST", body: { debtData } });
  },

  askExpenses: async (query: string, history?: { role: string, content: string }[]): Promise<{ message: string, intent: string }> => {
    return apiRequest("/ai/ask", { method: "POST", body: { query, history } });
  }
};
