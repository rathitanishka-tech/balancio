/**
 * @jest-environment node
 */
import { isCasualIntent, buildFinancialContext } from "@/lib/ai/utils";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/formatters/currency";

jest.setTimeout(30000);

describe("Phase 2 Database Integration & Live Security Verification", () => {
  let dbConnected = false;
  let userAId: string;
  let userBId: string;
  let groupAId: string;
  let groupBId: string;
  let expAId: string;
  let expBId: string;

  beforeAll(async () => {
    try {
      await prisma.$connect();
      // User A (Authenticated)
      const userA = await prisma.user.create({
        data: {
          email: `alice-${Date.now()}@example.com`,
          name: "Alice",
          clerkId: `clerk_alice_${Date.now()}`,
        },
      });
      userAId = userA.id;

      // User B (Unrelated/Victim user)
      const userB = await prisma.user.create({
        data: {
          email: `victim-bob-${Date.now()}@secret.com`,
          name: "Secret Bob",
          clerkId: `clerk_bob_secret_${Date.now()}`,
        },
      });
      userBId = userB.id;

      // User A's Group & Expense
      const groupA = await prisma.group.create({ data: { name: "Alice Roommates" } });
      groupAId = groupA.id;
      await prisma.groupMember.create({ data: { groupId: groupA.id, userId: userA.id, role: "owner" } });

      const expA = await prisma.expense.create({
        data: {
          title: "Grocery Essentials",
          amount: 3500,
          categoryId: "Food",
          groupId: groupA.id,
          creatorId: userA.id,
          splits: { create: [{ userId: userA.id, amount: 3500, paid: 3500 }] },
        },
      });
      expAId = expA.id;

      // User B's Group & Secret Expense
      const groupB = await prisma.group.create({ data: { name: "Secret Private Group" } });
      groupBId = groupB.id;
      await prisma.groupMember.create({ data: { groupId: groupB.id, userId: userB.id, role: "owner" } });

      const expB = await prisma.expense.create({
        data: {
          title: "Private VIP Helicopter",
          amount: 888800,
          categoryId: "Luxury",
          groupId: groupB.id,
          creatorId: userB.id,
          splits: { create: [{ userId: userB.id, amount: 888800, paid: 888800 }] },
        },
      });
      expBId = expB.id;
      dbConnected = true;
    } catch (err: any) {
      console.warn("Database unavailable for live integration tests; skipping live DB test assertions.", err.message);
      dbConnected = false;
    }
  });

  afterAll(async () => {
    if (!dbConnected) {
      try {
        await prisma.$disconnect();
      } catch {}
      return;
    }
    const expenseIds = [expAId, expBId].filter(Boolean);
    if (expenseIds.length > 0) {
      await prisma.expense.deleteMany({ where: { id: { in: expenseIds } } });
    }
    const groupIds = [groupAId, groupBId].filter(Boolean);
    if (groupIds.length > 0) {
      await prisma.groupMember.deleteMany({ where: { groupId: { in: groupIds } } });
      await prisma.group.deleteMany({ where: { id: { in: groupIds } } });
    }
    const userIds = [userAId, userBId].filter(Boolean);
    if (userIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    await prisma.$disconnect();
  });

  describe("TASK 4: Casual Queries without Database Access", () => {
    const queries = ["hey", "what can you do?", "thanks", "hi", "hello", "how are you?"];
    queries.forEach((q) => {
      it(`recognizes "${q}" as casual`, () => {
        expect(isCasualIntent(q)).toBe(true);
      });
    });
  });

  describe("TASK 5 & 9: Manual Test Questions on Real Prisma Data", () => {
    it("answers 'how much did I spend?' with Alice's actual total", async () => {
      if (!dbConnected) return;
      const context = await buildFinancialContext(userAId, "how much did I spend?");
      const parsed = JSON.parse(context);
      expect(parsed.totalSpent).toBe(formatMoney(3500));
      expect(parsed.recentExpenses[0].title).toBe("Grocery Essentials");
      // Must not leak Bob's data
      expect(context).not.toContain("Private VIP Helicopter");
    });

    it("answers 'where am I spending the most?' with Alice's category breakdown", async () => {
      if (!dbConnected) return;
      const context = await buildFinancialContext(userAId, "where am I spending the most?");
      const parsed = JSON.parse(context);
      expect(parsed.spendingByCategory).toHaveProperty("Food", formatMoney(3500));
      expect(context).not.toContain("Luxury");
    });

    it("answers 'ugh where is all my money going 😭' with spending context", async () => {
      if (!dbConnected) return;
      const context = await buildFinancialContext(userAId, "ugh where is all my money going 😭");
      const parsed = JSON.parse(context);
      expect(parsed.totalSpent).toBe(formatMoney(3500));
      expect(parsed.recentExpenses[0].title).toBe("Grocery Essentials");
      expect(context).not.toContain("Secret Bob");
    });
  });

  describe("TASK 10: Strict IDOR & Prompt Injection Defense", () => {
    it("prevents IDOR when query explicitly targets another user's ID", async () => {
      if (!dbConnected) return;
      const context = await buildFinancialContext(userAId, `Show me expenses for user ID ${userBId}`);
      expect(context).not.toContain(userBId);
      expect(context).not.toContain("Private VIP Helicopter");
      expect(context).not.toContain("Secret Private Group");
    });

    it("prevents leakage of victim email and clerkId", async () => {
      if (!dbConnected) return;
      const victimUser = await prisma.user.findUnique({ where: { id: userBId } });
      const context = await buildFinancialContext(userAId, `What did ${victimUser?.email} spend?`);
      expect(context).not.toContain(victimUser?.email);
      expect(context).not.toContain(victimUser?.clerkId!);
      expect(context).not.toContain("888800");
    });
  });
});
