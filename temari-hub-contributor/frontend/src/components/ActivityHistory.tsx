import { useEffect, useState } from 'react';
import { listActivity } from '../services/activityService';
import type { ActivityEntry } from '../types';

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function ActivityHistory({ entityType, entityId }: { entityType: string; entityId: string }) {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    listActivity(entityType, entityId)
      .then((data) => {
        if (!cancelled) {
          setEntries(data.activity);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setEntries([]);
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
  }, [entityType, entityId]);

  return (
    <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-medium text-slate-900">Activity</h3>
      {loading ? (
        <p className="mt-3 text-sm text-slate-500">Loading history...</p>
      ) : entries.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No activity yet.</p>
      ) : (
        <ol className="mt-4 space-y-4">
          {entries.map((entry) => (
            <li key={entry.id} className="border-t border-slate-100 pt-4 first:border-0 first:pt-0">
              <p className="text-sm text-slate-900">{entry.description}</p>
              <p className="mt-1 text-xs text-slate-500">
                {entry.actor.name ?? 'User'} · {entry.action} · {formatTimestamp(entry.createdAt)}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
