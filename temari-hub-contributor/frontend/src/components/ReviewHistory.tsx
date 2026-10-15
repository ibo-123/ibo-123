import { submissionStatusLabel } from '../constants/templates';
import type { Submission, SubmissionReview } from '../types';
import { StatusBadge } from './StatusBadge';

function formatTimestamp(value: string | null) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function displayValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  return String(value);
}

export function ReviewHistory({ reviews }: { reviews?: SubmissionReview[] }) {
  if (!reviews?.length) {
    return null;
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-medium text-slate-900">Review history</h3>
      <ol className="mt-4 space-y-4">
        {[...reviews].reverse().map((review) => (
          <li key={review.id} className="border-t border-slate-100 pt-4 first:border-0 first:pt-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge label={submissionStatusLabel(review.decision)} />
              <span className="text-sm text-slate-600">Version {review.version}</span>
              <span className="text-sm text-slate-500">{review.reviewer.name ?? 'Reviewer'}</span>
              <span className="text-sm text-slate-500">{formatTimestamp(review.createdAt)}</span>
            </div>
            {review.feedback ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{review.feedback}</p> : null}
          </li>
        ))}
      </ol>
    </section>
  );
}

export function VersionHistory({ submission }: { submission: Submission }) {
  const versions = submission.versions ?? [];
  if (versions.length === 0) {
    return null;
  }

  const fields = submission.template?.fields
    ? [...submission.template.fields].sort((left, right) => left.order - right.order)
    : [];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-medium text-slate-900">Versions</h3>
      <div className="mt-4 space-y-3">
        {[...versions].reverse().map((version) => {
          const markers = [
            version.number === submission.currentVersion ? 'Current' : '',
            version.number === submission.approvedVersion ? 'Approved' : '',
          ].filter(Boolean);

          return (
            <details key={version.number} className="rounded-lg border border-slate-200 px-4 py-3">
              <summary className="cursor-pointer text-sm font-medium text-slate-900">
                Version {version.number}
                {markers.length > 0 ? <span className="ml-2 font-normal text-slate-500">{markers.join(' · ')}</span> : null}
                <span className="ml-2 font-normal text-slate-500">{formatTimestamp(version.submittedAt)}</span>
              </summary>
              <div className="mt-3 space-y-3">
                {version.topicResource ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-xs">
                    <div className="font-semibold text-slate-900">{version.topicResource.resourceName}</div>
                    <div className="mt-1 text-slate-600">
                      {version.topicResource.subject} · {version.topicResource.topic} · Pages {version.topicResource.pageFrom}–{version.topicResource.pageTo}
                    </div>
                    {version.topicResource.prerequisites && version.topicResource.prerequisites.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        <span className="text-slate-500 font-medium">Prerequisites:</span>
                        {version.topicResource.prerequisites.map((p) => (
                          <span key={p} className="rounded bg-white px-1.5 py-0.5 border border-slate-200 text-[11px] text-slate-700">
                            {p}
                          </span>
                        ))}
                      </div>
                    )}
                    {version.topicResource.normalizedContent && (
                      <div className="mt-2 text-slate-700 whitespace-pre-wrap font-mono text-[11px] bg-white rounded p-2 border border-slate-200 max-h-40 overflow-y-auto">
                        {version.topicResource.normalizedContent}
                      </div>
                    )}
                  </div>
                ) : null}

                {version.items && version.items.length > 0 ? (
                  version.items.map((item) => (
                    <div key={item.order} className="rounded-md bg-slate-50 px-3 py-2">
                      <p className="text-xs font-medium text-slate-500">Item {item.order}</p>
                      <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                        {fields.map((field) => (
                          <div key={field.name}>
                            <dt className="text-xs text-slate-500">{field.label}</dt>
                            <dd className="text-sm text-slate-900">{displayValue(item.values[field.name])}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ))
                ) : null}
                {version.notes ? <p className="text-sm text-slate-700">Notes: {version.notes}</p> : null}
                {version.files.length > 0 ? (
                  <p className="text-sm text-slate-600">
                    Files: {version.files.map((file) => file.originalName).join(', ')}
                  </p>
                ) : null}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}

