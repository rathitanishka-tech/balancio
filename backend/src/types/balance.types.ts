export interface RawBalance {
  userId: string;
  /** Positive => the group owes this user money. Negative => user owes the group. Minor units. */
  balance: number;
}

export interface MemberBalance {
  userId: string;
  name: string;
  totalPaid: number; // minor units
  totalOwed: number; // minor units
  settlementsPaid: number; // minor units - settlements this user made (fromUser)
  settlementsReceived: number; // minor units - settlements this user received (toUser)
  netBalance: number; // minor units
}

export interface DirectDebt {
  from: string;
  to: string;
  amount: number; // minor units
}

export interface SimplifiedTransaction {
  from: string;
  to: string;
  amount: number; // minor units
}
