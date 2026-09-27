import { groupRepository } from "../repositories/group.repository";
import { expenseRepository } from "../repositories/expense.repository";
import { userRepository } from "../repositories/user.repository";
import { Settlement } from "../models/Settlement";
import { Group } from "../models/Group";

export interface SearchResults {
  groups: { id: string; name: string; description?: string }[];
  expenses: { id: string; title: string; amount: number; groupId: string; date: Date }[];
  users: { id: string; name: string; email: string }[];
  settlements: { id: string; amount: number; groupId: string; note?: string; date: Date }[];
}

/**
 * Global search, scoped strictly to data the authenticated user is
 * authorized to see:
 *  - groups: only groups the user is a member of
 *  - expenses/settlements: only within those same groups
 *  - users: only users who share at least one group with the requester
 *    (prevents using search to enumerate the entire user base)
 */
export async function search(userId: string, query: string): Promise<SearchResults> {
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return { groups: [], expenses: [], users: [], settlements: [] };
  }

  const memberships = await groupRepository.listGroupsForUser(userId);
  const groupIds = memberships.map((m) => m.groupId.toString());

  if (groupIds.length === 0) {
    return { groups: [], expenses: [], users: [], settlements: [] };
  }

  const regex = new RegExp(escapeRegex(trimmed), "i");

  const [groups, expenses, settlements, memberIdLists] = await Promise.all([
    Group.find({ _id: { $in: groupIds }, $or: [{ name: regex }, { description: regex }] }).limit(10),
    expenseRepository.searchByText(trimmed, groupIds, 10),
    Settlement.find({ groupId: { $in: groupIds }, note: regex }).limit(10),
    Promise.all(groupIds.map((id) => groupRepository.listMemberIds(id)))
  ]);

  // Co-members: everyone who shares a group with the requester, matched by name/email.
  const coMemberIds = Array.from(new Set(memberIdLists.flat())).filter((id) => id !== userId);
  const candidateUsers = await userRepository.findByIds(coMemberIds);
  const matchedUsers = candidateUsers.filter((u) => regex.test(u.name) || regex.test(u.email));

  return {
    groups: groups.map((g) => ({ id: g._id.toString(), name: g.name, description: g.description })),
    expenses: expenses.map((e) => ({
      id: e._id.toString(),
      title: e.title,
      amount: e.amount,
      groupId: e.groupId.toString(),
      date: e.date
    })),
    users: matchedUsers.slice(0, 10).map((u) => ({ id: u._id.toString(), name: u.name, email: u.email })),
    settlements: settlements.map((s) => ({
      id: s._id.toString(),
      amount: s.amount,
      groupId: s.groupId.toString(),
      note: s.note,
      date: s.date
    }))
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const searchService = { search };
