import Groq from "groq-sdk";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/formatters/currency";

export const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
export const MAX_MESSAGE_LENGTH = 1000;
export const MAX_COMPLETION_TOKENS = 350;

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
  "hey there",
  "hello there",
  "hi there",
  "what's up",
  "whats up",
  "sup",
  "howdy",
  "good day",
  "what is balancio",
  "can you help me",
  "thank you so much",
  "appreciate it",
  "cool",
  "awesome",
  "great"
]);

/**
 * Checks if a user message is purely conversational or greeting.
 * Fast deterministic check taking < 0.1 ms.
 */
export function isCasualIntent(text: string): boolean {
  const normalized = text
    .toLowerCase()
    .trim()
    .replace(/[!.,?]+$/, "")
    .trim();

  if (CASUAL_PHRASES.has(normalized) || CASUAL_PHRASES.has(text.toLowerCase().trim())) {
    return true;
  }

  // Quick greetings under 3 words (e.g. "hi there", "hey friend")
  if (/^(hi|hey|hello|howdy|sup)\b/i.test(normalized) && normalized.split(/\s+/).length <= 3) {
    return true;
  }

  // Quick capabilities or gratitude inquiries
  if (/^(who are you|what can you do|how do you work|can you help)\b/i.test(normalized)) {
    return true;
  }

  return false;
}

/**
 * Checks if a user message is definitely asking about financial data.
 * Avoids redundant LLM classification roundtrips.
 */
export function isFinancialIntent(text: string): boolean {
  const q = text.toLowerCase();
  return /\b(spend|spent|spending|owe|owed|owing|debt|debts|balance|balances|cost|costs|paid|pay|expense|expenses|split|splits|settle|settlement|money|food|travel|budget|share|shares|groceries|dining)\b|[\$₹€£]/.test(q);
}

// ---------------------------------------------------------------------------
// Groq Client Singleton (reusable across requests for HTTP keep-alive)
// ---------------------------------------------------------------------------
let cachedGroqClient: Groq | null = null;
let cachedApiKey: string | null = null;

export function getGroqApiKey(): string | undefined {
  const rawApiKey = process.env.GROQ_API_KEY;
  return rawApiKey ? rawApiKey.trim().replace(/^["']|["']$/g, "") : undefined;
}

export function getGroqClient(customKey?: string): Groq {
  const apiKey = customKey || getGroqApiKey();
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  // In test environments, recreate if mock has changed
  if (process.env.NODE_ENV === "test") {
    return new Groq({ apiKey, timeout: 15000 });
  }

  if (cachedGroqClient && cachedApiKey === apiKey) {
    return cachedGroqClient;
  }

  cachedGroqClient = new Groq({
    apiKey,
    timeout: 15000,
  });
  cachedApiKey = apiKey;
  return cachedGroqClient;
}

// ---------------------------------------------------------------------------
// Server-side Non-sensitive Performance Instrumentation
// ---------------------------------------------------------------------------
export class AiRequestTimer {
  private startTime: number;
  private marks: Record<string, number> = {};

  constructor() {
    this.startTime = performance.now();
    this.marks["received"] = 0;
    console.log(`[AI Perf] Request received at ${new Date().toISOString()}`);
  }

  mark(name: string, extra?: Record<string, any>): number {
    const elapsed = performance.now() - this.startTime;
    this.marks[name] = elapsed;
    const extraStr = extra ? ` (${Object.entries(extra).map(([k, v]) => `${k}=${v}`).join(", ")})` : "";
    console.log(`[AI Perf] ${name}: ${elapsed.toFixed(1)} ms${extraStr}`);
    return elapsed;
  }

  getDuration(name?: string): number {
    if (name && this.marks[name] !== undefined) {
      return this.marks[name];
    }
    return performance.now() - this.startTime;
  }
}

// ---------------------------------------------------------------------------
// Optimized Financial Context Retrieval
// ---------------------------------------------------------------------------
// Optimized Financial Context Retrieval
// ---------------------------------------------------------------------------
export async function buildFinancialContext(
  userId: string,
  question: string,
  reqId?: string
): Promise<string> {
  const prefix = reqId ? `[AI DB][${reqId}]` : `[AI DB]`;
  const tTotalStart = performance.now();
  const q = question.toLowerCase();

  const isBalanceQuestion = /\b(owe|owed|owing|debt|debts|balance|balances|settle|settlement)\b/i.test(q);
  const isCategoryQuestion = /\b(category|categories|food|groceries|travel|dining|shopping|entertainment|bills|utilities|spend(ing)? on|where am i spending)\b/i.test(q);
  const isTotalQuestion = /\b(how much|total|spent|spend|spending|cost|all my money|spending too much)\b/i.test(q);

  // 1 & 2. Run group memberships and user expenses in parallel.
  // Group names are mapped in-memory from groupMemberships, eliminating duplicate group lookups on expenses.
  const tBaseStart = performance.now();
  let tGroupsDone = 0;
  let tExpensesDone = 0;

  const [groupMemberships, expenses] = await Promise.all([
    prisma.groupMember.findMany({
      where: { userId },
      select: {
        groupId: true,
        group: { select: { id: true, name: true } }
      }
    }).then(res => {
      tGroupsDone = performance.now();
      return res;
    }),
    prisma.expense.findMany({
      where: {
        OR: [
          { creatorId: userId },
          { splits: { some: { userId } } }
        ]
      },
      orderBy: { date: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        amount: true,
        date: true,
        categoryId: true,
        groupId: true,
        creatorId: true,
        splits: {
          where: { userId },
          select: { amount: true, paid: true }
        }
      }
    }).then(res => {
      tExpensesDone = performance.now();
      return res;
    })
  ]);

  const baseDuration = performance.now() - tBaseStart;
  console.log(`${prefix} GroupMemberships query: ${(tGroupsDone - tBaseStart).toFixed(1)} ms (${groupMemberships.length} rows), User Expenses query: ${(tExpensesDone - tBaseStart).toFixed(1)} ms (${expenses.length} rows) (Base total: ${baseDuration.toFixed(1)} ms)`);

  const groupNameMap = new Map<string, string>();
  const authorizedGroupIds: string[] = [];
  const groupNames: string[] = [];

  for (const m of groupMemberships) {
    if (m.group) {
      authorizedGroupIds.push(m.group.id);
      groupNames.push(m.group.name);
      groupNameMap.set(m.group.id, m.group.name);
    }
  }

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

  // 3. Balances calculation - ONLY if this is actually a debt/balance question!
  // Pure spending queries (e.g. "How much did I spend?") do not fetch group settlements or counterparty debts.
  const youOwe: { name: string; amount: number }[] = [];
  const owedToYou: { name: string; amount: number }[] = [];
  let netBalance = 0;

  if (isBalanceQuestion && authorizedGroupIds.length > 0) {
    const tBalStart = performance.now();
    const [allGroupExpenses, allGroupSettlements] = await Promise.all([
      prisma.expense.findMany({
        where: { groupId: { in: authorizedGroupIds } },
        select: {
          id: true,
          creatorId: true,
          amount: true,
          splits: { select: { userId: true, amount: true } }
        }
      }),
      prisma.settlement.findMany({
        where: { groupId: { in: authorizedGroupIds } },
        select: { fromUserId: true, toUserId: true, amount: true }
      })
    ]);

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
    console.log(`${prefix} Balance & settlement queries: ${(performance.now() - tBalStart).toFixed(1)} ms`);
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

  if (isBalanceQuestion) {
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
      group: (e.groupId && groupNameMap.get(e.groupId)) || "Non-group",
    }));
  }

  if (groupNames.length > 0) {
    compactContext.yourGroups = groupNames;
  }

  const totalDuration = performance.now() - tTotalStart;
  console.log(`${prefix} Financial context retrieval completed in ${totalDuration.toFixed(1)} ms`);

  return JSON.stringify(compactContext, null, 2);
}

// ---------------------------------------------------------------------------
// Error Handling
// ---------------------------------------------------------------------------
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
