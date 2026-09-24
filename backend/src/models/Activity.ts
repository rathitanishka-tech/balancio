import { Schema, model, Document, Types } from "mongoose";

export type ActivityType =
  | "expense_created"
  | "expense_updated"
  | "expense_deleted"
  | "member_added"
  | "member_removed"
  | "settlement_created"
  | "settlement_deleted"
  | "group_created"
  | "group_updated";

export interface IActivity extends Document {
  _id: Types.ObjectId;
  groupId: Types.ObjectId;
  actorId: Types.ObjectId;
  type: ActivityType;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: [
        "expense_created",
        "expense_updated",
        "expense_deleted",
        "member_added",
        "member_removed",
        "settlement_created",
        "settlement_deleted",
        "group_created",
        "group_updated"
      ],
      required: true
    },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Activity = model<IActivity>("Activity", ActivitySchema);
