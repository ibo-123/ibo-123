import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, EmptyState, LoadingState, PageHeader } from "../components/ui";
import { secondaryButtonClass } from "../components/formStyles";
import {
  getNotificationPreferences,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationPreferences,
} from "../services/notificationService";
import type { NotificationItem, NotificationPreferences } from "../types";

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
    date,
  );
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [markingAll, setMarkingAll] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    inAppNotifications: true,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      listNotifications(),
      getNotificationPreferences().catch(() => ({ preferences: { emailNotifications: true, inAppNotifications: true } })),
    ])
      .then(([notifData, prefData]) => {
        if (!cancelled) {
          setNotifications(notifData.notifications);
          if (prefData?.preferences) {
            setPreferences(prefData.preferences);
          }
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load notifications");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function openNotification(notification: NotificationItem) {
    if (!notification.isRead) {
      try {
        await markNotificationRead(notification.id);
        setNotifications((current) =>
          current.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item)),
        );
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unable to update the notification");
        return;
      }
    }
    if (notification.link) {
      navigate(notification.link);
    }
  }

  async function handleMarkAll() {
    setError("");
    setNotice("");
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
      setNotice("All notifications marked as read.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to mark notifications as read");
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleTogglePref(key: keyof NotificationPreferences) {
    const updated = {
      ...preferences,
      [key]: !preferences[key],
    };
    setPreferences(updated);
    setSavingPrefs(true);
    setError("");
    setNotice("");

    try {
      const res = await updateNotificationPreferences(updated);
      setPreferences(res.preferences);
      setNotice("Notification preferences updated.");
    } catch (err: unknown) {
      // Revert on failure
      setPreferences(preferences);
      setError(err instanceof Error ? err.message : "Failed to update preferences");
    } finally {
      setSavingPrefs(false);
    }
  }

  const unread = notifications.filter((item) => !item.isRead).length;

  return (
    <div className="relative">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-200/40 via-sky-200/40 to-amber-200/40 blur-3xl"
      />

      <PageHeader
        title="Notifications"
        description="Assignments, submissions, revisions, approvals, and deadline reminders."
        action={
          <button
            type="button"
            onClick={handleMarkAll}
            disabled={markingAll || unread === 0}
            className={`${secondaryButtonClass} !rounded-full disabled:hover:translate-y-0 disabled:hover:shadow-none`}
          >
            {markingAll ? "Saving…" : "Mark all as read"}
          </button>
        }
      />

      {error ? <Alert>{error}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}

      {/* Preferences Section */}
      <section className="mb-6 rounded-3xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Delivery Channels</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Control where you want to receive alerts and important updates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
              <input
                type="checkbox"
                checked={preferences.inAppNotifications}
                disabled={savingPrefs}
                onChange={() => handleTogglePref("inAppNotifications")}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900/10 cursor-pointer"
              />
              In-App Alerts
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
              <input
                type="checkbox"
                checked={preferences.emailNotifications}
                disabled={savingPrefs}
                onChange={() => handleTogglePref("emailNotifications")}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900/10 cursor-pointer"
              />
              Email notifications
            </label>
          </div>
        </div>
      </section>

      {/* Unread summary */}
      {!loading && notifications.length > 0 ? (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              unread > 0
                ? "bg-slate-900 text-white shadow-[0_8px_24px_-12px_rgba(15,23,42,0.6)]"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full ${unread > 0 ? "bg-emerald-300" : "bg-slate-400"}`}
            />
            {unread > 0
              ? `${unread} unread ${unread === 1 ? "notification" : "notifications"}`
              : "All caught up"}
          </span>
          <span className="text-xs text-slate-400">{notifications.length} total</span>
        </div>
      ) : null}

      <section className="overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
        {loading ? (
          <LoadingState>Loading notifications…</LoadingState>
        ) : notifications.length === 0 ? (
          <EmptyState title="No notifications yet">
            They appear here when a job is assigned or your work is reviewed.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-slate-100/80">
            {notifications.map((notification) => (
              <li key={notification.id}>
                <button
                  type="button"
                  onClick={() => openNotification(notification)}
                  className={`group flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50/70 ${
                    notification.isRead ? "" : "bg-sky-50/40 hover:bg-sky-50/60"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`mt-2 h-2 w-2 shrink-0 rounded-full transition-transform duration-300 group-hover:scale-125 ${
                      notification.isRead
                        ? "bg-slate-300"
                        : "bg-slate-900 shadow-[0_0_0_4px_rgba(15,23,42,0.08)]"
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline gap-x-2">
                      <span
                        className={`text-sm ${
                          notification.isRead
                            ? "font-normal text-slate-700"
                            : "font-medium text-slate-900"
                        }`}
                      >
                        {notification.title}
                      </span>
                      {!notification.isRead ? (
                        <span className="inline-flex items-center rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
                          New
                        </span>
                      ) : null}
                      {notification.emailSent ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Email sent
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-slate-600">
                      {notification.message}
                    </span>
                    <span className="mt-1.5 block text-xs text-slate-400">
                      {formatTimestamp(notification.createdAt)}
                    </span>
                  </span>
                  {notification.link ? (
                    <span
                      aria-hidden="true"
                      className="mt-1 text-slate-300 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-slate-500 group-hover:opacity-100"
                    >
                      →
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
