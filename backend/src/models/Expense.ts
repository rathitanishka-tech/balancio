import { Schema, model, Document, Types } from "mongoose";

export type SplitType = "EQUAL" | "PERCENTAGE" | "CUSTOM";

export interface IExpense extends Document {
  _id: Types.ObjectId;
  groupId: Types.ObjectId;
  title: string;
  description?: string;
  amount: number; // minor units, integer
  currency: string;
  category: string;
  paidBy: Types.ObjectId;
  splitType: SplitType;
  date: Date;
  createdBy: Types.ObjectId;
  receipt?: string;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 1000 },
    amount: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: "amount must be an integer number of minor currency units"
      }
    },
    currency: { type: String, default: "INR" },
    category: { type: String, default: "General", index: true },
    paidBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    splitType: { type: String, enum: ["EQUAL", "PERCENTAGE", "CUSTOM"], required: true },
    date: { type: Date, required: true, default: () => new Date(), index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receipt: { type: String },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

ExpenseSchema.index({ title: "text", description: "text" });

export const Expense = model<IExpense>("Expense", ExpenseSchema);
