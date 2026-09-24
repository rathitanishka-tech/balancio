import { Request, Response } from "express";
import { aiService } from "../ai/ai.service";

export const parseExpense = async (req: Request, res: Response) => {
  try {
    const { text, groupMembers } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const draft = await aiService.parseExpense(text, { groupMembers });
    res.status(200).json(draft);
  } catch (error: any) {
    console.error("AI parse expense error:", error);
    res.status(500).json({ error: "Failed to parse expense using AI", details: error.message });
  }
};

export const parseReceipt = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Receipt image is required" });
    }

    const draft = await aiService.parseReceipt(req.file.buffer, req.file.mimetype);
    res.status(200).json(draft);
  } catch (error: any) {
    console.error("AI parse receipt error:", error);
    res.status(500).json({ error: "Failed to parse receipt using AI", details: error.message });
  }
};

export const generateInsights = async (req: Request, res: Response) => {
  try {
    const { analyticsData } = req.body;
    if (!analyticsData) {
      return res.status(400).json({ error: "Analytics data is required" });
    }

    const summary = await aiService.generateInsights(analyticsData);
    res.status(200).json({ summary });
  } catch (error: any) {
    console.error("AI generate insights error:", error);
    res.status(500).json({ error: "Failed to generate AI insights", details: error.message });
  }
};

export const explainDebt = async (req: Request, res: Response) => {
  try {
    const { debtData } = req.body;
    if (!debtData) {
      return res.status(400).json({ error: "Debt context data is required" });
    }

    const explanation = await aiService.explainDebt(debtData);
    res.status(200).json({ explanation });
  } catch (error: any) {
    console.error("AI explain debt error:", error);
    res.status(500).json({ error: "Failed to explain debt", details: error.message });
  }
};

  export const askExpenses = async (req: Request, res: Response) => {
    try {
      const { query, history } = req.body;
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }
  
      const userId = req.user?.id; // Optional now
  
      const result = await aiService.ask(query, userId, history);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
    console.error("AI ask expenses error:", error);
    
    if (error.status === 429) {
      // DETERMINISTIC FALLBACK FOR FINANCIAL QUESTIONS
      try {
        const queryLower = req.body.query?.toLowerCase() || "";
        const userId = req.user?.id;
        
        // Intent: GREETING_QUERY ("hey", "hello", "hi", "how are you")
        const isGreetingQuery = /^(hey|hello|hi|how are you|how are you doing|good morning|good evening)\b/i.test(queryLower);
        
        if (isGreetingQuery) {
            return res.status(200).json({ success: true, data: { intent: "FALLBACK", message: "Hello! The AI provider is temporarily rate-limited right now, but I'm still here! Please log in to check your balances, debts, and expenses!" } });
        }

        if (userId) {
          // Intent: DEBT_QUERY or BALANCE_QUERY ("what do I owe", "who owes me", "my balance")
          const isDebtQuery = /what.*owe|who.*owe|my.*balance|how much.*owe/i.test(queryLower);
          
          if (isDebtQuery) {
            const { getAITools } = await import("../ai/ai.tools");
            const tools = getAITools(userId);
            const debtsTool = tools.find(t => t.name === "getUserDebts");
            if (debtsTool) {
              const debts = await debtsTool.execute({});
              if (debts.length === 0) {
                return res.status(200).json({ success: true, data: { intent: "FALLBACK", message: "The AI assistant is temporarily unavailable, but looking at your accounts: You are all settled up! You have no outstanding debts." } });
              }
              let message = "The AI assistant is temporarily unavailable, but here is your current debt summary:\n\n";
              (debts as any[]).forEach(d => {
                const amount = (d.amount / 100).toFixed(2);
                if (d.from.id === userId) {
                  message += `• You owe ${d.to.name} ₹${amount} (in ${d.groupName})\n`;
                } else {
                  message += `• ${d.from.name} owes you ₹${amount} (in ${d.groupName})\n`;
                }
              });
              return res.status(200).json({ success: true, data: { intent: "FALLBACK", message: message.trim() } });
            }
          }
          
          // Intent: SPENDING_QUERY or RECENT_EXPENSES_QUERY ("what did I spend", "recent expenses")
          const isSpendingQuery = /spend|spent|expense|how much did i/i.test(queryLower) && !/spend too much time/i.test(queryLower);
          
          if (isSpendingQuery) {
            const { getAITools } = await import("../ai/ai.tools");
            const tools = getAITools(userId);
            const expensesTool = tools.find(t => t.name === "getUserExpenses");
            if (expensesTool) {
              const expenses = await expensesTool.execute({ limit: 5 });
              if (expenses.length === 0) {
                return res.status(200).json({ success: true, data: { intent: "FALLBACK", message: "The AI assistant is temporarily unavailable, but looking at your accounts: You have no recent expenses." } });
              }
              let message = "The AI assistant is temporarily unavailable, but here are your 5 most recent expenses:\n\n";
              (expenses as any[]).forEach(e => {
                const amount = (e.amountMinor / 100).toFixed(2);
                message += `• ${e.title} - ₹${amount} (${new Date(e.date).toLocaleDateString()})\n`;
              });
              return res.status(200).json({ success: true, data: { intent: "FALLBACK", message: message.trim() } });
            }
          }
        }
      } catch (fallbackError) {
        // Silently fall through to standard 429 response if fallback fails
      }

      // If no fallback applied or if fallback failed, return 429
      if (error.retryAfter) {
        res.setHeader('Retry-After', error.retryAfter);
      }
      return res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMITED",
          message: error.message
        }
      });
    }

    res.status(500).json({ error: "Failed to answer query", details: error.message });
  }
};
