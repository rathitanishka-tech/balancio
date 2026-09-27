import { expenseRepository } from "../repositories/expense.repository";
import { groupRepository } from "../repositories/group.repository";

export function getAITools(userId?: string) {
  if (!userId) return [];
  return [
    {
      name: "getUserGroups",
      description: "Gets a list of all groups the user is a part of.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
      execute: async () => {
        const memberships = await groupRepository.listGroupsForUser(userId);
        const groups = [];
        for (const m of memberships) {
          const g = await groupRepository.findById(m.groupId.toString());
          if (g) groups.push({ id: g._id, name: g.name, currency: g.currency });
        }
        return groups;
      }
    },
    {
      name: "getUserExpenses",
      description: "Gets the recent expenses the user was involved in. Optionally filter by groupId or limit.",
      parameters: {
        type: "object",
        properties: {
          groupId: { type: "string", description: "Optional group ID to filter by" },
          limit: { type: "number", description: "Number of expenses to return, default 10, max 50" }
        },
      },
      execute: async ({ groupId, limit = 10 }: { groupId?: string, limit?: number }) => {
        let expenses: any[];
        if (groupId) {
          // ensure the user is actually in this group
          const membership = await groupRepository.findMembership(groupId, userId);
          if (!membership) {
            throw new Error("User does not have access to this group");
          }
          expenses = await expenseRepository.listByGroup(groupId);
        } else {
          expenses = (await expenseRepository.list({ participantUserId: userId }, 0, 100)).items;
        }
        
        // Sort by date descending and limit
        expenses.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const recent = expenses.slice(0, Math.min(limit, 50));
        
        return recent.map((e: any) => ({
          id: e._id,
          title: e.title,
          amountMinor: e.amount,
          date: e.date,
          category: e.category,
          paidBy: e.paidBy === userId ? "CURRENT_USER" : e.paidBy
        }));
      }
    },
    {
      name: "getUserBalances",
      description: "Gets the user's balances across all groups. This tells you if the user owes money or is owed money in a specific group.",
      parameters: { type: "object", properties: {}, required: [] },
      execute: async () => {
        const { balanceService } = await import("../services/balance.service");
        const memberships = await groupRepository.listGroupsForUser(userId);
        const results = [];
        for (const m of memberships) {
          const groupId = m.groupId.toString();
          const balances = await balanceService.calculateGroupBalances(groupId, userId);
          const userBalance = balances.find(b => b.userId === userId);
          if (userBalance) {
            const g = await groupRepository.findById(groupId);
            results.push({
              groupId,
              groupName: g?.name,
              balanceMinor: userBalance.netBalance
            });
          }
        }
        return results;
      }
    },
    {
      name: "getUserDebts",
      description: "Gets the user's specific simplified debts (who they owe and who owes them).",
      parameters: { type: "object", properties: {}, required: [] },
      execute: async () => {
        const { debtService } = await import("../services/debt.service");
        const memberships = await groupRepository.listGroupsForUser(userId);
        const allTransactions: any[] = [];
        for (const m of memberships) {
          const groupId = m.groupId.toString();
          const g = await groupRepository.findById(groupId);
          const { transactions } = await debtService.getSimplifiedDebts(groupId, userId);
          // Filter transactions involving this user
          const userTransactions = transactions.filter(t => t.from.id === userId || t.to.id === userId);
          userTransactions.forEach(t => allTransactions.push({ groupName: g?.name, ...t }));
        }
        return allTransactions;
      }
    }
  ];
}
