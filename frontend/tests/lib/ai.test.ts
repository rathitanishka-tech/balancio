import { askAi } from "@/lib/actions/ai";
import { isCasualIntent, handleGroqError, buildFinancialContext } from "@/lib/ai/utils";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import Groq from "groq-sdk";

jest.mock("@/lib/auth/session", () => ({
  requireAuth: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    groupMember: {
      findMany: jest.fn(),
    },
    expense: {
      findMany: jest.fn(),
    },
    settlement: {
      findMany: jest.fn(),
    },
  },
}));

const mockCreate = jest.fn();

jest.mock("groq-sdk", () => {
  const MockGroq = jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));
  (MockGroq as any).AuthenticationError = class AuthenticationError extends Error {
    status = 401;
  };
  (MockGroq as any).RateLimitError = class RateLimitError extends Error {
    status = 429;
  };
  (MockGroq as any).APIConnectionTimeoutError = class APIConnectionTimeoutError extends Error {
    name = "APIConnectionTimeoutError";
  };
  return MockGroq;
});

describe("AI Assistant Verification & Security Suite", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, GROQ_API_KEY: "gsk_mock_test_key_12345" };
    (requireAuth as jest.Mock).mockResolvedValue({ userId: "auth-user-1", clerkAuth: true });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("TASK 1: Authentication & Client Contract", () => {
    it("rejects unauthenticated requests without calling Groq or Prisma", async () => {
      (requireAuth as jest.Mock).mockRejectedValueOnce(new Error("Unauthorized"));

      const res = await askAi("How much did I spend?");
      expect(res).toBe("You must be signed in to use the AI assistant.");
      expect(mockCreate).not.toHaveBeenCalled();
      expect(prisma.expense.findMany).not.toHaveBeenCalled();
    });

    it("derives user identity solely from session and ignores any spoofed identity in message", async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: "You spent $50." } }],
      });
      (prisma.groupMember.findMany as jest.Mock).mockResolvedValueOnce([]);
      (prisma.expense.findMany as jest.Mock).mockResolvedValueOnce([]);

      // Attacker tries to pass another user's ID inside the question text
      await askAi("What did userId 'victim-999' or clerkId 'user_victim' spend?");

      // Prisma must be queried ONLY for the authenticated user 'auth-user-1'
      expect(prisma.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { creatorId: "auth-user-1" },
              { splits: { some: { userId: "auth-user-1" } } },
            ],
          },
        })
      );
    });
  });

  describe("TASK 2 & 3: Data Isolation & Context Minimization", () => {
    it("builds compact financial context with NO database IDs, emails, clerkIds, or passwords", async () => {
      (prisma.groupMember.findMany as jest.Mock).mockResolvedValueOnce([
        { group: { id: "grp-1", name: "Apartment Roommates" } },
      ]);
      (prisma.expense.findMany as jest.Mock).mockResolvedValueOnce([
        {
          id: "exp-private-cuid-1",
          title: "Groceries",
          amount: 8000,
          categoryId: "Groceries",
          creatorId: "auth-user-1",
          date: new Date("2026-10-10"),
          group: { name: "Apartment Roommates" },
          splits: [{ amount: 4000, paid: 8000 }],
        },
      ]);

      const contextJson = await buildFinancialContext("auth-user-1", "where am I spending the most?");
      const parsed = JSON.parse(contextJson);

      // Verify minimized structure
      expect(parsed).toHaveProperty("spendingByCategory");
      expect(parsed).toHaveProperty("recentExpenses");
      expect(parsed.recentExpenses[0].title).toBe("Groceries");

      // Verify ABSENCE of sensitive leaks
      expect(contextJson).not.toContain("exp-private-cuid-1");
      expect(contextJson).not.toContain("password");
      expect(contextJson).not.toContain("clerkId");
      expect(contextJson).not.toContain("@");
    });

    it("calculates accurate owe/owed balances strictly within authorized groups", async () => {
      (prisma.groupMember.findMany as jest.Mock).mockResolvedValueOnce([
        { group: { id: "grp-1", name: "Trip" } },
      ]);
      (prisma.expense.findMany as jest.Mock)
        .mockResolvedValueOnce([]) // for recent expenses
        .mockResolvedValueOnce([   // for group balance calculation
          {
            creatorId: "other-user-2",
            amount: 6000,
            splits: [
              { userId: "auth-user-1", amount: 3000 },
              { userId: "other-user-2", amount: 3000 },
            ],
          },
        ]);
      (prisma.settlement.findMany as jest.Mock).mockResolvedValueOnce([]);
      (prisma.user.findMany as jest.Mock).mockResolvedValueOnce([
        { id: "other-user-2", name: "Bob" },
      ]);

      const contextJson = await buildFinancialContext("auth-user-1", "who do I owe?");
      const parsed = JSON.parse(contextJson);

      expect(parsed.youOwe).toEqual(expect.arrayContaining([expect.stringContaining("Bob")]));
      expect(parsed.netBalance).toBeDefined();
    });
  });

  describe("TASK 4: Casual Intent Detection", () => {
    const casualQueries = [
      "hey",
      "hi",
      "hello",
      "how are you?",
      "thanks",
      "what can you do?",
      "What can you do",
      "Hello there",
    ];

    casualQueries.forEach((query) => {
      it(`does NOT trigger Prisma financial queries for casual query: "${query}"`, async () => {
        expect(isCasualIntent(query)).toBe(true);

        mockCreate.mockResolvedValueOnce({
          choices: [{ message: { content: "Hey there! How can I help you today?" } }],
        });

        const reply = await askAi(query);
        expect(reply).toBe("Hey there! How can I help you today?");

        // VERIFY ZERO PRISMA CALLS
        expect(prisma.expense.findMany).not.toHaveBeenCalled();
        expect(prisma.groupMember.findMany).not.toHaveBeenCalled();
        expect(prisma.settlement.findMany).not.toHaveBeenCalled();
      });
    });
  });

  describe("TASK 5: Financial Intent Routing", () => {
    const financialQueries = [
      "how much did I spend?",
      "who do I owe?",
      "where am I spending the most?",
      "what did I spend on food?",
      "am I spending too much?",
      "ugh where is all my money going 😭",
    ];

    financialQueries.forEach((query) => {
      it(`triggers financial data retrieval for query: "${query}"`, async () => {
        // Classifier mock returns FINANCIAL
        mockCreate.mockResolvedValueOnce({
          choices: [{ message: { content: "FINANCIAL" } }],
        });
        // Database mocks
        (prisma.groupMember.findMany as jest.Mock).mockResolvedValueOnce([]);
        (prisma.expense.findMany as jest.Mock).mockResolvedValueOnce([]);

        // Final answer completion mock
        mockCreate.mockResolvedValueOnce({
          choices: [{ message: { content: "Here is your financial breakdown." } }],
        });

        const reply = await askAi(query);
        expect(reply).toBe("Here is your financial breakdown.");

        // Verified that prisma was consulted for financial information
        expect(prisma.expense.findMany).toHaveBeenCalled();
      });
    });
  });

  describe("TASK 6: Error Handling", () => {
    it("handles missing GROQ_API_KEY gracefully", async () => {
      delete process.env.GROQ_API_KEY;

      const reply = await askAi("how much did I spend?");
      expect(reply).toContain("API key is not configured");
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it("handles empty user message gracefully", async () => {
      const reply1 = await askAi("");
      const reply2 = await askAi("   ");
      expect(reply1).toBe("Please enter a message.");
      expect(reply2).toBe("Please enter a message.");
    });

    it("handles excessively long message (> 1000 chars) gracefully", async () => {
      const longMsg = "a".repeat(1005);
      const reply = await askAi(longMsg);
      expect(reply).toContain("Your message is too long");
    });

    it("handles Groq 401 Unauthorized gracefully without leaking key", async () => {
      mockCreate.mockRejectedValueOnce({
        status: 401,
        message: "Invalid API Key",
      });

      const reply = await askAi("hey");
      expect(reply).toContain("AI service authentication failed");
      expect(reply).not.toContain("gsk_");
    });

    it("handles Groq 429 Rate Limit gracefully", async () => {
      mockCreate.mockRejectedValueOnce({
        status: 429,
        message: "Rate limit reached",
      });

      const reply = await askAi("hey");
      expect(reply).toContain("high traffic right now");
    });

    it("handles Groq timeout gracefully", async () => {
      mockCreate.mockRejectedValueOnce({
        name: "APIConnectionTimeoutError",
        message: "Request timed out",
      });

      const reply = await askAi("hey");
      expect(reply).toContain("took too long to respond");
    });

    it("handles malformed Groq response without throwing", async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [],
      });

      const reply = await askAi("hey");
      expect(reply).toBe("I was unable to process your request. Please try again.");
    });
  });
});
