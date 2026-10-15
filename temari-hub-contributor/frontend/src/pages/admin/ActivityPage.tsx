import { useEffect, useState } from 'react';
import { Alert, EmptyState, LoadingState, PageHeader } from '../../components/ui';
import { listActivity } from '../../services/activityService';
import type { ActivityEntry } from '../../types';

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function ActivityPage() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    listActivity()
      .then((data) => {
        if (!cancelled) {
          setEntries(data.activity);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load activity');
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

  return (
    <div>
      <PageHeader
        title="Activity"
        description="A record of sign-ins, contributor changes, job assignments, submissions, revisions, and approvals."
      />
      {error ? <Alert>{error}</Alert> : null}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <LoadingState>Loading activity...</LoadingState>
        ) : entries.length === 0 ? (
          <EmptyState title="No activity yet">Workflow actions will appear here.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Actor</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 text-slate-900">{entry.actor.name ?? 'User'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{entry.action}</td>
                    <td className="px-4 py-3 text-slate-700">{entry.description}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatTimestamp(entry.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
