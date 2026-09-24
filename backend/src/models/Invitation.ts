import { Schema, model, Document, Types } from "mongoose";
import crypto from "crypto";

export type InvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";

export interface IInvitation extends Document {
  _id: Types.ObjectId;
  groupId: Types.ObjectId;
  invitedBy: Types.ObjectId;
  email: string;
  token: string;
  status: InvitationStatus;
  expiresAt: Date;
  createdAt: Date;
}

const InvitationSchema = new Schema<IInvitation>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true, index: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    token: {
      type: String,
      required: true,
      unique: true,
      // Securely generated, unguessable, URL-safe token.
      default: () => crypto.randomBytes(32).toString("hex")
    },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "DECLINED", "EXPIRED"],
      default: "PENDING"
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Invitation = model<IInvitation>("Invitation", InvitationSchema);
