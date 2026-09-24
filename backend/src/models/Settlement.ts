import { Schema, model, Document, Types } from "mongoose";

export type PaymentMethod = "CASH" | "UPI" | "BANK_TRANSFER" | "OTHER";

export interface ISettlement extends Document {
  _id: Types.ObjectId;
  groupId: Types.ObjectId;
  fromUser: Types.ObjectId;
  toUser: Types.ObjectId;
  amount: number; // minor units, integer
  currency: string;
  paymentMethod: PaymentMethod;
  note?: string;
  date: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
}

const SettlementSchema = new Schema<ISettlement>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true, index: true },
    fromUser: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    toUser: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: {
      type: Number,
      required: true,
      validate: {
        validator: (v: number) => Number.isInteger(v) && v > 0,
        message: "amount must be a positive integer number of minor currency units"
      }
    },
    currency: { type: String, default: "INR" },
    paymentMethod: {
      type: String,
      enum: ["CASH", "UPI", "BANK_TRANSFER", "OTHER"],
      default: "CASH"
    },
    note: { type: String, maxlength: 500 },
    date: { type: Date, required: true, default: () => new Date() },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Settlement = model<ISettlement>("Settlement", SettlementSchema);
