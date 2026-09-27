export interface MemberBalance {
  userId: string;
  name: string;
  totalPaid: number;
  totalOwed: number;
  settlementsPaid: number;
  settlementsReceived: number;
  netBalance: number;
}

export interface GroupBalances {
  groupId: string;
  balances: MemberBalance[];
}
