import { Schema, model, Document, Types } from "mongoose";

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  expenseCreated: boolean;
  settlementCreated: boolean;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  avatar?: string;
  currency: string;
  timezone: string;
  notificationPreferences: NotificationPreferences;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationPreferencesSchema = new Schema<NotificationPreferences>(
  {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    expenseCreated: { type: Boolean, default: true },
    settlementCreated: { type: Boolean, default: true }
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    passwordHash: { type: String, required: true, select: false },
    avatar: { type: String },
    currency: { type: String, default: "INR" },
    timezone: { type: String, default: "Asia/Kolkata" },
    notificationPreferences: {
      type: NotificationPreferencesSchema,
      default: () => ({})
    }
  },
  { timestamps: true }
);

// Never leak the password hash even if a stray query forgets to .select("-passwordHash").
UserSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete (ret as { passwordHash?: string }).passwordHash;
    return ret;
  }
});

export const User = model<IUser>("User", UserSchema);
