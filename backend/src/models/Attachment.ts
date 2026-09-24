import { Schema, model, Document, Types } from "mongoose";

export interface IAttachment extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  expenseId?: Types.ObjectId;
  filename: string;
  mimeType: string;
  size: number;
  path: string;
  createdAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    expenseId: { type: Schema.Types.ObjectId, ref: "Expense", index: true },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Attachment = model<IAttachment>("Attachment", AttachmentSchema);
