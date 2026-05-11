export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: Date;
}

export interface NotificationListResponse {
  notifications: NotificationItem[];
  unreadCount: number;
}

export interface ReadAllResponse {
  updated: number;
}

export interface VocabReminderParams {
  email: string;
  name: string;
  count: number;
}
