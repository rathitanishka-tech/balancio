export type NotificationType =
  | "INVITED"
  | "JOINED_GROUP"
  | "EXPENSE_CREATED"
  | "EXPENSE_UPDATED"
  | "EXPENSE_DELETED"
  | "YOU_OWE"
  | "YOU_ARE_OWED"
  | "SETTLEMENT_CREATED"
  | "SETTLEMENT_RECEIVED";

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedGroupId?: string;
  relatedExpenseId?: string;
  relatedSettlementId?: string;
  read: boolean;
  createdAt: string;
}
