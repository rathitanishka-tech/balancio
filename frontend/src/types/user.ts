export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  expenseCreated: boolean;
  settlementCreated: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  currency: string;
  timezone: string;
  notificationPreferences?: NotificationPreferences;
  createdAt: string;
  updatedAt: string;
}

