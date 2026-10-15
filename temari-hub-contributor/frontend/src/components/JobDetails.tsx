import type { ReactNode } from 'react';
import { StatusBadge } from './StatusBadge';
import { subjectLabel } from '../constants/contributors';
import { difficultyLabel, formatDeadline, jobStatusLabel } from '../constants/jobs';
import { templateTypeLabel } from '../constants/templates';
import type { ContributorJob } from '../types';

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-slate-900">{children}</dd>
    </div>
  );
}

// Shared by the Admin and Contributor job pages. `extra` holds fields only the Admin sees.
export function JobDetails({
  job,
  extra,
  showCreated,
}: {
  job: ContributorJob;
  extra?: ReactNode;
  showCreated?: boolean;
}) {
  return (
    <section className="max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <dl className="grid gap-5 sm:grid-cols-2">
        <Field label="Title" wide>
          {job.title}
        </Field>
        <Field label="Description" wide>
          {job.description}
        </Field>
        <Field label="Requirements" wide>
          {job.requirements || 'None specified'}
        </Field>
        <Field label="Subject">{subjectLabel(job.subject)}</Field>
        <Field label="Topic">{job.topic}</Field>
        <Field label="Quantity">{job.quantity}</Field>
        <Field label="Difficulty">
          <StatusBadge label={difficultyLabel(job.difficulty)} />
        </Field>
        <Field label="Deadline">{formatDeadline(job.deadline)}</Field>
        <Field label="Status">
          <StatusBadge label={jobStatusLabel(job.status)} />
        </Field>
        <Field label="Template" wide>
          {job.template
            ? `${job.template.name} (${templateTypeLabel(job.template.type)})`
            : 'None'}
        </Field>
        <Field label="Instructions" wide>
          {job.instructions}
        </Field>
        {extra}
        {showCreated ? <Field label="Created">{formatTimestamp(job.createdAt)}</Field> : null}
      </dl>
    </section>
  );
}

export { Field as JobField };
