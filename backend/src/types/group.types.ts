export type GroupRole = "OWNER" | "ADMIN" | "MEMBER";

export interface CreateGroupInput {
  name: string;
  description?: string;
  image?: string;
  currency?: string;
}

export interface UpdateGroupInput {
  name?: string;
  description?: string;
  image?: string;
  currency?: string;
}

export interface AddMemberInput {
  email: string;
  role?: GroupRole;
}
