import { parseExpenseAction, parseReceiptAction, getInsightsAction, explainDebtAction } from "../actions/ai-actions";

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
    return parseExpenseAction(text, groupMembers) as Promise<AIExpenseDraft>;
  },
  
  parseReceipt: async (file: File): Promise<AIReceiptExtraction> => {
    const formData = new FormData();
    formData.append("receipt", file);
    return parseReceiptAction(formData) as Promise<AIReceiptExtraction>;
  },

  getInsights: async (analyticsData: any): Promise<{ summary: string }> => {
    return getInsightsAction(analyticsData);
  },

  explainDebt: async (debtData: any): Promise<{ explanation: string }> => {
    return explainDebtAction(debtData);
  },

  askExpenses: async (query: string, history?: { role: string, content: string }[]): Promise<{ message: string, intent: string }> => {
    // Moved to Vercel AI SDK useChat in AIChatPanel
    throw new Error("askExpenses is deprecated. Use useChat hook.");
  }
};
