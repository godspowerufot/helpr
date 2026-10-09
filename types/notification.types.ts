// Mirrors `AccountNotificationRead` from msflib-notifications (ADR 0021).
export type NotificationChannel = 'inapp' | 'email' | 'sms';

export type NotificationType = 'system' | 'admin';

export type NotificationRead = {
  id: number;
  title: string;
  message: string;
  channels: NotificationChannel[];
  sender_id: number | null;
  notification_type: NotificationType;
  scope: string;
  created_at: string;
  updated_at: string;
};

export type AccountNotification = {
  id: number;
  receiver_id: number;
  notification_id: number;
  is_read: boolean;
  notification: NotificationRead;
  created_at: string;
  updated_at: string;
};

export type NotificationQuery = {
  offset?: number;
  limit?: number;
};
