import { AccountNotification } from '@/types/notification.types';
import { notificationMessage } from '@/utils/notification.utils';

export const MOCK_ACCOUNT_ID = 2;

const item = (
  id: number,
  title: string,
  message: string,
  href: string,
  createdAt: string,
  isRead: boolean
): AccountNotification => ({
  id,
  receiver_id: MOCK_ACCOUNT_ID,
  notification_id: id,
  is_read: isRead,
  notification: {
    id,
    title,
    message: notificationMessage(message, href),
    channels: ['inapp'],
    sender_id: null,
    notification_type: 'system',
    scope: 'account',
    created_at: createdAt,
    updated_at: createdAt,
  },
  created_at: createdAt,
  updated_at: createdAt,
});

export const MOCK_NOTIFICATIONS: AccountNotification[] = [
  item(
    1,
    'New review',
    'Chiamaka E. rated “Deep Clean, 3-Bedroom Apartment” 5/5.',
    '/provider/bookings/view?id=304&workspace=sparkle-home',
    '2026-10-02T15:20:00Z',
    true
  ),
  item(
    2,
    'New booking request',
    'Bola A. requested “Deep Clean, 3-Bedroom Apartment” for Sat 11 Oct.',
    '/provider/bookings/view?id=301&workspace=sparkle-home',
    '2026-10-08T09:05:00Z',
    false
  ),
  item(
    3,
    'Booking accepted. Pay to confirm',
    'Tunde Plumbing accepted “Leak Repair and Fixture Check”.',
    '/bookings/view?id=202',
    '2026-10-08T17:40:00Z',
    false
  ),
];
