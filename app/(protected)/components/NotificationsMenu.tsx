'use client';

import { useState, type MouseEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge, IconButton, Menu } from '@mui/material';
import NotificationsNoneOutlined from '@mui/icons-material/NotificationsNoneOutlined';
import {
  useMarkAllNotifications,
  useMarkNotification,
  useNotifications,
} from '@/hooks/notification.hooks';
import { formatDateTime } from '@/utils/date.utils';
import { notificationDestination } from '@/utils/notification.utils';

const SHOWN = 8;

// In-app inbox from msflib-notifications (ADR 0021); refreshes every 20 s.
export function NotificationsMenu() {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const { data = [], isLoading, isError, refetch } = useNotifications();
  const { mutate: mark } = useMarkNotification();
  const { mutate: markAll, isPending: markingAll } = useMarkAllNotifications();
  const unread = data.filter((n) => !n.is_read).length;

  return (
    <>
      <IconButton
        aria-label={
          unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'
        }
        aria-haspopup="true"
        aria-expanded={Boolean(anchorEl)}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{ width: 44, height: 44 }}
      >
        <Badge
          badgeContent={unread}
          max={99}
          sx={{
            '& .MuiBadge-badge': {
              backgroundColor: 'var(--primary)',
              color: 'var(--on-primary)',
              fontVariantNumeric: 'tabular-nums',
            },
          }}
        >
          <NotificationsNoneOutlined aria-hidden="true" />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              width: 'min(360px, calc(100vw - 32px))',
              borderRadius: 'var(--app-radius)',
              overscrollBehavior: 'contain',
            },
          },
          list: { 'aria-label': 'Notifications' },
        }}
      >
        <div className="flex items-center justify-between gap-3 border-b border-stroke-light px-4 pb-2">
          <p className="b2-m text-text">Notifications</p>
          {unread > 0 ? (
            <button
              type="button"
              onClick={() => markAll(true)}
              disabled={markingAll}
              className="f1-m min-h-11 text-primary-dark underline underline-offset-4 transition-colors duration-150 hover:text-text disabled:text-disabled"
            >
              {markingAll ? 'Marking…' : 'Mark All Read'}
            </button>
          ) : null}
        </div>
        <div aria-live="polite" className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <p className="b2-r px-4 py-3 text-text-light">Loading…</p>
          ) : isError ? (
            <p className="b2-r px-4 py-3 text-error">
              Notifications could not be loaded.{' '}
              <button
                type="button"
                onClick={() => refetch()}
                className="b2-m text-primary-dark underline underline-offset-4 transition-colors duration-150 hover:text-text"
              >
                Try Again
              </button>
            </p>
          ) : data.length === 0 ? (
            <p className="b2-r px-4 py-3 text-text-light">
              No notifications yet. Booking updates show up here.
            </p>
          ) : (
            <ul>
              {data.slice(0, SHOWN).map((item) => {
                const { text, href } = notificationDestination(
                  item.notification.message
                );
                const open = (event: MouseEvent) => {
                  if (!item.is_read) mark({ id: item.id, status: true });
                  setAnchorEl(null);
                  // Closing the menu unmounts this link before the browser follows it.
                  if (
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey ||
                    event.button !== 0
                  ) {
                    return;
                  }
                  event.preventDefault();
                  if (href) router.push(href);
                };
                const body = (
                  <>
                    <span
                      aria-hidden="true"
                      className={`mt-1.5 size-2 shrink-0 rounded-full ${item.is_read ? 'bg-transparent' : 'bg-primary'}`}
                    />
                    <span className="min-w-0">
                      <span className="b2-m block text-text">
                        {item.notification.title}
                        {item.is_read ? null : (
                          <span className="sr-only"> (unread)</span>
                        )}
                      </span>
                      <span className="b2-r block break-words text-text-light">
                        {text}
                      </span>
                      <span className="f1-r block tabular-nums text-text-light">
                        {formatDateTime(item.created_at)}
                      </span>
                    </span>
                  </>
                );
                const className =
                  'flex w-full gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-background-light focus-visible:bg-background-light motion-reduce:transition-none';
                return (
                  <li
                    key={item.id}
                    className="border-b border-stroke-light last:border-0"
                  >
                    {href ? (
                      <Link href={href} onClick={open} className={className}>
                        {body}
                      </Link>
                    ) : (
                      <button type="button" onClick={open} className={className}>
                        {body}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Menu>
    </>
  );
}
