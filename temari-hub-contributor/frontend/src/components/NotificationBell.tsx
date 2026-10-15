import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from './Icons';
import { listNotifications, markNotificationRead } from '../services/notificationService';
import type { NotificationItem } from '../types';

function relativeTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  const absolute = Math.abs(seconds);
  const steps: { limit: number; unit: Intl.RelativeTimeFormatUnit; size: number }[] = [
    { limit: 60, unit: 'second', size: 1 },
    { limit: 3600, unit: 'minute', size: 60 },
    { limit: 86400, unit: 'hour', size: 3600 },
    { limit: 86400 * 7, unit: 'day', size: 86400 },
  ];

  for (const step of steps) {
    if (absolute < step.limit) {
      return formatter.format(Math.round(seconds / step.size), step.unit);
    }
  }

  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}

export function NotificationBell() {
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    function load() {
      listNotifications()
        .then((data) => {
          if (!cancelled) {
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setNotifications([]);
            setUnreadCount(0);
          }
        });
    }

    load();
    const timer = window.setInterval(load, 60000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  async function openNotification(notification: NotificationItem) {
    setOpen(false);
    if (!notification.isRead) {
      try {
        await markNotificationRead(notification.id);
        setNotifications((current) => current.map((item) => (
          item.id === notification.id ? { ...item, isRead: true } : item
        )));
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch {
        // The destination is still useful if marking read fails.
      }
    }
    if (notification.link) {
      navigate(notification.link);
    }
  }

  const recent = notifications.slice(0, 8);
  const label = unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications';

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        aria-label={label}
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50"
      >
        <Icon name="bell" className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-slate-900 px-1.5 text-[11px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-medium text-slate-900">Notifications</p>
            <Link to="/notifications" onClick={() => setOpen(false)} className="text-xs text-slate-600 underline">
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-500">No notifications yet.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {recent.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => openNotification(notification)}
                    className={`flex w-full gap-3 px-4 py-3 text-left hover:bg-slate-50 ${notification.isRead ? '' : 'bg-slate-50'}`}
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.isRead ? 'bg-slate-300' : 'bg-slate-900'}`}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-slate-900">{notification.title}</span>
                      <span className="mt-0.5 block text-sm text-slate-600">{notification.message}</span>
                      <span className="mt-1 block text-xs text-slate-500">{relativeTime(notification.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
