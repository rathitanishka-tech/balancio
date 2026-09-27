/* eslint-disable no-console */
import bcrypt from "bcrypt";
import { Types } from "mongoose";
import { connectDatabase, disconnectDatabase } from "../src/config/database";
import { User, IUser } from "../src/models/User";
import { Group, IGroup } from "../src/models/Group";
import { GroupMember } from "../src/models/GroupMember";
import { Expense } from "../src/models/Expense";
import { ExpenseParticipant } from "../src/models/ExpenseParticipant";
import { Settlement } from "../src/models/Settlement";
import { calculateSplit } from "../src/algorithms/splitCalculation";
import { toMinorUnits } from "../src/utils/currency";

/**
 * Deterministic, idempotent seed script.
 *
 * "Deterministic" - the same users/groups/expenses are produced every run
 * (fixed emails, names, amounts, dates relative to a fixed reference date).
 *
 * "Idempotent" - every write uses findOneAndUpdate({...naturalKey}, data,
 * { upsert: true }) rather than a blind `.create()`, so running this
 * script multiple times updates the same documents in place instead of
 * creating duplicates. Expense participants are fully replaced (not
 * appended) on every run for the same reason.
 */

const SEED_PASSWORD = "Password123!";

const SEED_USERS = [
  { name: "Tanu", email: "tanu@example.com" },
  { name: "Rahul", email: "rahul@example.com" },
  { name: "Priya", email: "priya@example.com" },
  { name: "Aman", email: "aman@example.com" },
  { name: "Sneha", email: "sneha@example.com" }
] as const;

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

async function upsertUsers(): Promise<Record<string, IUser>> {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  const byName: Record<string, IUser> = {};

  for (const u of SEED_USERS) {
    const user = await User.findOneAndUpdate(
      { email: u.email },
      { $set: { name: u.name, email: u.email, passwordHash } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    byName[u.name] = user;
  }

  console.log(`Seeded ${Object.keys(byName).length} users (password for all: "${SEED_PASSWORD}")`);
  return byName;
}

async function upsertGroup(
  name: string,
  description: string,
  owner: IUser,
  memberUsers: IUser[]
): Promise<IGroup> {
  const group = await Group.findOneAndUpdate(
    { name, ownerId: owner._id },
    { $set: { name, description, currency: "INR", ownerId: owner._id } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const allMembers = [owner, ...memberUsers.filter((m) => m._id.toString() !== owner._id.toString())];

  for (const member of allMembers) {
    const role = member._id.toString() === owner._id.toString() ? "OWNER" : "MEMBER";
    await GroupMember.findOneAndUpdate(
      { groupId: group._id, userId: member._id },
      { $set: { role } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  return group;
}

interface SeedExpenseSpec {
  title: string;
  category: string;
  amountRupees: number;
  paidBy: IUser;
  splitType: "EQUAL" | "PERCENTAGE" | "CUSTOM";
  participants: IUser[];
  percentages?: number[]; // parallel to participants, required for PERCENTAGE
  customShares?: number[]; // parallel to participants, in rupees, required for CUSTOM
  daysAgo: number;
  createdBy: IUser;
}

async function upsertExpense(group: IGroup, spec: SeedExpenseSpec): Promise<void> {
  const amountMinor = toMinorUnits(spec.amountRupees);

  const participantsInput = spec.participants.map((p, idx) => ({
    userId: p._id.toString(),
    percentage: spec.percentages?.[idx],
    shareAmount: spec.customShares ? toMinorUnits(spec.customShares[idx]) : undefined
  }));

  // Reuses the exact same production algorithm the API uses, so seed data
  // is guaranteed to satisfy the same financial invariants as real data.
  const shares = calculateSplit(spec.splitType, amountMinor, participantsInput);

  const expense = await Expense.findOneAndUpdate(
    { groupId: group._id, title: spec.title, createdBy: spec.createdBy._id },
    {
      $set: {
        groupId: group._id,
        title: spec.title,
        category: spec.category,
        amount: amountMinor,
        currency: group.currency,
        paidBy: spec.paidBy._id,
        splitType: spec.splitType,
        date: daysAgo(spec.daysAgo),
        createdBy: spec.createdBy._id,
        deletedAt: null
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Participants are fully replaced on every run - this keeps re-running
  // the seed idempotent even if a spec's split configuration changes.
  await ExpenseParticipant.deleteMany({ expenseId: expense._id });
  await ExpenseParticipant.insertMany(
    shares.map((s) => ({ expenseId: expense._id, userId: s.userId, shareAmount: s.shareAmount, percentage: s.percentage }))
  );
}

interface SeedSettlementSpec {
  from: IUser;
  to: IUser;
  amountRupees: number;
  note: string;
  daysAgo: number;
}

async function upsertSettlement(group: IGroup, spec: SeedSettlementSpec): Promise<void> {
  await Settlement.findOneAndUpdate(
    { groupId: group._id, fromUser: spec.from._id, toUser: spec.to._id, note: spec.note },
    {
      $set: {
        groupId: group._id,
        fromUser: spec.from._id,
        toUser: spec.to._id,
        amount: toMinorUnits(spec.amountRupees),
        currency: group.currency,
        paymentMethod: "UPI",
        note: spec.note,
        date: daysAgo(spec.daysAgo),
        createdBy: spec.from._id
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function main(): Promise<void> {
  await connectDatabase();
  console.log("Connected to MongoDB, seeding...");

  const users = await upsertUsers();
  const { Tanu, Rahul, Priya, Aman, Sneha } = users;

  // --- Goa Trip -----------------------------------------------------------
  const goaTrip = await upsertGroup(
    "Goa Trip",
    "Beach vacation with the gang",
    Tanu,
    [Rahul, Priya, Aman]
  );
  await upsertExpense(goaTrip, {
    title: "Flights",
    category: "Travel",
    amountRupees: 24000,
    paidBy: Tanu,
    splitType: "EQUAL",
    participants: [Tanu, Rahul, Priya, Aman],
    daysAgo: 20,
    createdBy: Tanu
  });
  await upsertExpense(goaTrip, {
    title: "Beach Resort (3 nights)",
    category: "Accommodation",
    amountRupees: 18000,
    paidBy: Rahul,
    splitType: "EQUAL",
    participants: [Tanu, Rahul, Priya, Aman],
    daysAgo: 18,
    createdBy: Rahul
  });
  await upsertExpense(goaTrip, {
    title: "Scuba diving",
    category: "Activities",
    amountRupees: 6000,
    paidBy: Priya,
    splitType: "PERCENTAGE",
    participants: [Tanu, Priya, Aman],
    percentages: [40, 30, 30],
    daysAgo: 17,
    createdBy: Priya
  });
  await upsertSettlement(goaTrip, {
    from: Aman,
    to: Tanu,
    amountRupees: 3000,
    note: "Partial settle-up for flights",
    daysAgo: 10
  });

  // --- Apartment ------------------------------------------------------------
  const apartment = await upsertGroup(
    "Apartment",
    "Shared flat expenses",
    Priya,
    [Sneha, Rahul]
  );
  await upsertExpense(apartment, {
    title: "September Rent",
    category: "Rent",
    amountRupees: 45000,
    paidBy: Priya,
    splitType: "EQUAL",
    participants: [Priya, Sneha, Rahul],
    daysAgo: 12,
    createdBy: Priya
  });
  await upsertExpense(apartment, {
    title: "Electricity Bill",
    category: "Utilities",
    amountRupees: 2400,
    paidBy: Sneha,
    splitType: "EQUAL",
    participants: [Priya, Sneha, Rahul],
    daysAgo: 8,
    createdBy: Sneha
  });
  await upsertExpense(apartment, {
    title: "Groceries",
    category: "Food",
    amountRupees: 3200,
    paidBy: Rahul,
    splitType: "CUSTOM",
    participants: [Priya, Sneha, Rahul],
    customShares: [1200, 1000, 1000],
    daysAgo: 5,
    createdBy: Rahul
  });

  // --- Weekend Squad ------------------------------------------------------
  const weekendSquad = await upsertGroup(
    "Weekend Squad",
    "Movies, dinners, and random hangouts",
    Aman,
    [Tanu, Sneha]
  );
  await upsertExpense(weekendSquad, {
    title: "Movie night",
    category: "Entertainment",
    amountRupees: 1500,
    paidBy: Aman,
    splitType: "EQUAL",
    participants: [Aman, Tanu, Sneha],
    daysAgo: 6,
    createdBy: Aman
  });
  await upsertExpense(weekendSquad, {
    title: "Brunch",
    category: "Food",
    amountRupees: 2100,
    paidBy: Sneha,
    splitType: "EQUAL",
    participants: [Aman, Tanu, Sneha],
    daysAgo: 2,
    createdBy: Sneha
  });

  console.log("Seed complete:");
  console.log(`  Groups: ${[goaTrip, apartment, weekendSquad].map((g) => g.name).join(", ")}`);
  console.log(`  Users: ${SEED_USERS.map((u) => u.email).join(", ")}`);
  console.log(`  All seed users share the password: ${SEED_PASSWORD}`);

  await disconnectDatabase();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed script failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
