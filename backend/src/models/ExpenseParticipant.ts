import { Schema, model, Document, Types } from "mongoose";

export interface IExpenseParticipant extends Document {
  _id: Types.ObjectId;
  expenseId: Types.ObjectId;
  userId: Types.ObjectId;
  shareAmount: number; // minor units, integer - what this user owes for the expense
  percentage?: number; // only meaningful for PERCENTAGE splits
  createdAt: Date;
}

const ExpenseParticipantSchema = new Schema<IExpenseParticipant>(
  {
    expenseId: { type: Schema.Types.ObjectId, ref: "Expense", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    shareAmount: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: "shareAmount must be an integer number of minor currency units"
      }
    },
    percentage: { type: Number }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ExpenseParticipantSchema.index({ expenseId: 1, userId: 1 }, { unique: true });

export const ExpenseParticipant = model<IExpenseParticipant>(
  "ExpenseParticipant",
  ExpenseParticipantSchema
);
