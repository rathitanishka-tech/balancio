import { Schema, model, Document, Types } from "mongoose";

export interface IGroup extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  image?: string;
  currency: string;
  ownerId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new Schema<IGroup>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500 },
    image: { type: String },
    currency: { type: String, default: "INR" },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true }
  },
  { timestamps: true }
);

GroupSchema.index({ name: "text", description: "text" });

export const Group = model<IGroup>("Group", GroupSchema);
