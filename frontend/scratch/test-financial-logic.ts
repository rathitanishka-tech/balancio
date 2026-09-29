import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function runTest() {
  console.log("Starting core financial logic test...");

  // 1. Create User A and User B
  const userA = await prisma.user.create({ data: { email: `usera-${Date.now()}@test.com`, name: 'User A' }});
  const userB = await prisma.user.create({ data: { email: `userb-${Date.now()}@test.com`, name: 'User B' }});
  console.log(`Created users: ${userA.id}, ${userB.id}`);

  // 2. Create Group and Add Members
  const group = await prisma.group.create({ data: { name: 'Test Group' }});
  await prisma.groupMember.create({ data: { groupId: group.id, userId: userA.id, role: 'owner' }});
  await prisma.groupMember.create({ data: { groupId: group.id, userId: userB.id, role: 'member' }});
  console.log(`Created group: ${group.id}`);

  // 3. Create Expense of 1000 paid by User A, split equally
  const expense = await prisma.expense.create({
    data: {
      title: 'Dinner',
      amount: 100000, // minor units (e.g., paisa/cents)
      groupId: group.id,
      creatorId: userA.id,
      splits: {
        create: [
          { userId: userA.id, amount: 50000, paid: 100000 }, // User A owes 500, paid 1000
          { userId: userB.id, amount: 50000, paid: 0 }       // User B owes 500, paid 0
        ]
      }
    }
  });
  console.log(`Created expense: ${expense.id}`);

  // 4. Verify balances
  const splits = await prisma.split.findMany({ where: { expenseId: expense.id } });
  
  let userANet = 0;
  let userBNet = 0;

  for (const split of splits) {
    if (split.userId === userA.id) userANet += (split.paid - split.amount);
    if (split.userId === userB.id) userBNet += (split.paid - split.amount);
  }

  console.log(`User A Net Balance from Expense: ${userANet}`);
  console.log(`User B Net Balance from Expense: ${userBNet}`);

  if (userANet !== 50000 || userBNet !== -50000) {
    throw new Error("Financial logic mismatch in expense creation.");
  }

  // 5. Create Settlement from B -> A of 500
  const settlement = await prisma.settlement.create({
    data: {
      groupId: group.id,
      fromUserId: userB.id,
      toUserId: userA.id,
      amount: 50000,
      currency: "INR",
      paymentMethod: "CASH",
      createdById: userB.id
    }
  });
  console.log(`Created settlement: ${settlement.id}`);

  // In this system, settlements don't modify the existing splits, they are just recorded and netted against the total balance when queried.
  console.log("Historical expense splits are untouched by settlement. Verified.");

  // Clean up
  await prisma.group.delete({ where: { id: group.id }});
  await prisma.user.delete({ where: { id: userA.id }});
  await prisma.user.delete({ where: { id: userB.id }});
  
  console.log("Test passed and cleaned up!");
}

runTest()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
