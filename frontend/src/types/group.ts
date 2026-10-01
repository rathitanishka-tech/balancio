export type GroupRole = "OWNER" | "ADMIN" | "MEMBER";

export interface Group {
  id: string;
  name: string;
  description?: string;
  image?: string;
  currency: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  userId: string;
  name: string;
  email: string;
  role: GroupRole;
  joinedAt: string;
}

export interface CreateGroupPayload {
  name: string;
  description?: string;
  currency?: string;
}

export interface UpdateGroupPayload {
  name?: string;
  description?: string;
  currency?: string;
}

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

export interface Activity {
  id: string;
  groupId: string;
  actorId: string;
  type: ActivityType;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

