export interface DirectDebt {
  from: string;
  to: string;
  amount: number;
}

export interface SimplifiedDebtParty {
  id: string;
  name: string;
}

export interface SimplifiedTransaction {
  from: SimplifiedDebtParty;
  to: SimplifiedDebtParty;
  amount: number;
}

export interface SimplifiedDebtsResult {
  transactions: SimplifiedTransaction[];
  transactionCount: number;
}
