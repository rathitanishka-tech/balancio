import { Schema, model, Document, Types } from "mongoose";

export type GroupRole = "OWNER" | "ADMIN" | "MEMBER";

export interface IGroupMember extends Document {
  _id: Types.ObjectId;
  groupId: Types.ObjectId;
  userId: Types.ObjectId;
  role: GroupRole;
  joinedAt: Date;
}

const GroupMemberSchema = new Schema<IGroupMember>({
  groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  role: { type: String, enum: ["OWNER", "ADMIN", "MEMBER"], default: "MEMBER" },
  joinedAt: { type: Date, default: () => new Date() }
});

// A user cannot be added to the same group twice.
GroupMemberSchema.index({ groupId: 1, userId: 1 }, { unique: true });

export const GroupMember = model<IGroupMember>("GroupMember", GroupMemberSchema);
