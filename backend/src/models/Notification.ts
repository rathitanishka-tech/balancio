import { Schema, model, Document, Types } from "mongoose";

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

export interface INotification extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  relatedGroupId?: Types.ObjectId;
  relatedExpenseId?: Types.ObjectId;
  relatedSettlementId?: Types.ObjectId;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: [
        "INVITED",
        "JOINED_GROUP",
        "EXPENSE_CREATED",
        "EXPENSE_UPDATED",
        "EXPENSE_DELETED",
        "YOU_OWE",
        "YOU_ARE_OWED",
        "SETTLEMENT_CREATED",
        "SETTLEMENT_RECEIVED"
      ],
      required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedGroupId: { type: Schema.Types.ObjectId, ref: "Group" },
    relatedExpenseId: { type: Schema.Types.ObjectId, ref: "Expense" },
    relatedSettlementId: { type: Schema.Types.ObjectId, ref: "Settlement" },
    read: { type: Boolean, default: false, index: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Notification = model<INotification>("Notification", NotificationSchema);
