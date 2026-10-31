import Groq from "groq-sdk";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/formatters/currency";

export const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
export const MAX_MESSAGE_LENGTH = 1000;

// Deterministic casual queries that do NOT need database queries
export const CASUAL_PHRASES = new Set([
  "hey",
  "hi",
  "hello",
  "how are you",
  "how are you?",
  "how's it going",
  "hows it going",
  "thanks",
  "thank you",
  "thanks a lot",
  "what can you do",
  "what can you do?",
  "who are you",
  "who are you?",
  "help",
  "good morning",
  "good afternoon",
  "good evening",
  "bye",
  "goodbye",
]);

export function isCasualIntent(text: string): boolean {
  const normalized = text
    .toLowerCase()
    .trim()
    .replace(/[!.,?]+$/, "")
    .trim();

  if (CASUAL_PHRASES.has(normalized) || CASUAL_PHRASES.has(text.toLowerCase().trim())) {
    return true;
  }

  // Quick greetings
  if (/^(hi|hey|hello)\b/i.test(normalized) && normalized.split(/\s+/).length <= 3) {
    return true;
  }

  return false;
}

export async function buildFinancialContext(userId: string, question: string): Promise<string> {
  const q = question.toLowerCase();

  // 1. Fetch user's authorized groups
  const groupMemberships = await prisma.groupMember.findMany({
    where: { userId },
    include: {
      group: {
        select: { id: true, name: true }
      }
    }
  });
  const authorizedGroupIds = groupMemberships.map(m => m.group.id);
  const groupNames = groupMemberships.map(m => m.group.name);

  // 2. Fetch authorized expenses involving this user
  const expenses = await prisma.expense.findMany({
    where: {
      OR: [
        { creatorId: userId },
        { splits: { some: { userId } } }
      ]
    },
    orderBy: { date: "desc" },
    take: 30,
    include: {
      group: { select: { name: true } },
      splits: {
        where: { userId },
        select: { amount: true, paid: true }
      }
    }
  });

  // Calculate totals and category breakdown
  let totalSpent = 0;
  let userShare = 0;
  const categoryTotals: Record<string, number> = {};

  for (const exp of expenses) {
    const isCreator = exp.creatorId === userId;
    if (isCreator) {
      totalSpent += exp.amount;
    }
    const mySplit = exp.splits[0];
    if (mySplit) {
      userShare += mySplit.amount;
    }

    const cat = exp.categoryId || "General";
    const amountForCategory = mySplit ? mySplit.amount : (isCreator ? exp.amount : 0);
    categoryTotals[cat] = (categoryTotals[cat] || 0) + amountForCategory;
  }

  // 3. Balances calculation (who do I owe / who owes me)
  const youOwe: { name: string; amount: number }[] = [];
  const owedToYou: { name: string; amount: number }[] = [];
  let netBalance = 0;

  const isBalanceQuestion = /owe|debt|balance|settle/i.test(q);
  const isCategoryQuestion = /category|categories|food|groceries|travel|spend(ing)? on|where am i spending/i.test(q);
  const isTotalQuestion = /how much|total|all my money|spending too much/i.test(q);

  if (isBalanceQuestion || isTotalQuestion) {
    if (authorizedGroupIds.length > 0) {
      const allGroupExpenses = await prisma.expense.findMany({
        where: { groupId: { in: authorizedGroupIds } },
        include: { splits: true }
      });
      const allGroupSettlements = await prisma.settlement.findMany({
        where: { groupId: { in: authorizedGroupIds } }
      });

      const pairwiseMap = new Map<string, number>();

      for (const exp of allGroupExpenses) {
        if (exp.creatorId === userId) {
          for (const sp of exp.splits) {
            if (sp.userId !== userId) {
              pairwiseMap.set(sp.userId, (pairwiseMap.get(sp.userId) || 0) + sp.amount);
            }
          }
        } else {
          const mySplit = exp.splits.find(s => s.userId === userId);
          if (mySplit) {
            pairwiseMap.set(exp.creatorId, (pairwiseMap.get(exp.creatorId) || 0) - mySplit.amount);
          }
        }
      }

      for (const set of allGroupSettlements) {
        if (set.fromUserId === userId) {
          pairwiseMap.set(set.toUserId, (pairwiseMap.get(set.toUserId) || 0) + set.amount);
        } else if (set.toUserId === userId) {
          pairwiseMap.set(set.fromUserId, (pairwiseMap.get(set.fromUserId) || 0) - set.amount);
        }
      }

      const counterpartyIds = Array.from(pairwiseMap.keys()).filter(id => Math.abs(pairwiseMap.get(id) || 0) > 0.01);
      if (counterpartyIds.length > 0) {
        const users = await prisma.user.findMany({
          where: { id: { in: counterpartyIds } },
          select: { id: true, name: true }
        });
        const nameMap = new Map(users.map(u => [u.id, u.name]));

        for (const [otherId, net] of pairwiseMap.entries()) {
          const name = nameMap.get(otherId) || "Group member";
          if (net > 0.01) {
            owedToYou.push({ name, amount: Math.round(net) });
            netBalance += net;
          } else if (net < -0.01) {
            youOwe.push({ name, amount: Math.round(Math.abs(net)) });
            netBalance += net;
          }
        }
      }
    }
  }

  // Build compact structured context without any IDs, emails, or private data
  const compactContext: Record<string, any> = {};

  if (isTotalQuestion || (!isBalanceQuestion && !isCategoryQuestion)) {
    compactContext.totalSpent = formatMoney(totalSpent);
    compactContext.yourShareOfExpenses = formatMoney(userShare);
    compactContext.expenseCount = expenses.length;
  }

  if (isCategoryQuestion || isTotalQuestion) {
    compactContext.spendingByCategory = Object.fromEntries(
      Object.entries(categoryTotals).map(([cat, amt]) => [cat, formatMoney(amt)])
    );
  }

  if (isBalanceQuestion || isTotalQuestion) {
    compactContext.netBalance = formatMoney(netBalance);
    if (youOwe.length > 0) {
      compactContext.youOwe = youOwe.map(o => `${o.name}: ${formatMoney(o.amount)}`);
    } else {
      compactContext.youOwe = "Nobody (you are all settled up!)";
    }
    if (owedToYou.length > 0) {
      compactContext.owedToYou = owedToYou.map(o => `${o.name}: ${formatMoney(o.amount)}`);
    } else {
      compactContext.owedToYou = "Nobody owes you money.";
    }
  }

  if (expenses.length > 0) {
    compactContext.recentExpenses = expenses.slice(0, 5).map(e => ({
      title: e.title,
      category: e.categoryId || "General",
      totalAmount: formatMoney(e.amount),
      date: e.date.toISOString().split("T")[0],
      group: e.group?.name || "Non-group",
    }));
  }

  if (groupNames.length > 0) {
    compactContext.yourGroups = groupNames;
  }

  return JSON.stringify(compactContext, null, 2);
}

export function handleGroqError(err: any): string {
  const status = err?.status;
  const name = err?.name;
  const message = err?.message || "";

  if (status === 401 || err instanceof Groq.AuthenticationError || message.includes("401") || message.includes("invalid_api_key")) {
    console.error("Groq AI service error: Authentication failed (401)");
    return "AI service authentication failed. Please verify the Groq API key configuration.";
  }

  if (status === 429 || err instanceof Groq.RateLimitError || message.includes("429") || message.includes("rate_limit")) {
    console.warn("Groq AI service error: Rate limit reached (429)");
    return "The AI assistant is receiving high traffic right now. Please wait a moment and try again.";
  }

  if (name === "APIConnectionTimeoutError" || name === "TimeoutError" || message.includes("timeout") || message.includes("timed out")) {
    console.warn("Groq AI service error: Request timed out");
    return "The AI assistant took too long to respond. Please try again in a moment.";
  }

  console.error("Groq AI service error:", name || "Unknown error");
  return "Oops! Something went wrong communicating with the AI service. Please try again.";
}
