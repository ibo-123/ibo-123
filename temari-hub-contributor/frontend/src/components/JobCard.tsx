import { Link } from 'react-router-dom';
import { StatusBadge } from './StatusBadge';
import { subjectLabel } from '../constants/contributors';
import { difficultyLabel, formatDeadline, jobStatusLabel } from '../constants/jobs';
import { submissionStatusLabel, templateTypeLabel } from '../constants/templates';
import type { ContributorJob } from '../types';

export function JobCard({ job }: { job: ContributorJob }) {
  const progress = job.submissionProgress;
  const submitted = progress?.submitted ?? 0;
  const required = progress?.required ?? job.quantity ?? 1;
  const percentage = progress?.percentage ?? Math.min(100, Math.round((submitted / required) * 100));
  const submissionStatus = progress?.submissionStatus;

  // Determine displayed status (submission status takes precedence for contributor clarity)
  const displayStatus = submissionStatus ? submissionStatusLabel(submissionStatus) : jobStatusLabel(job.status);

  // Determine primary action
  let actionLabel = 'View Job';
  let actionLink = `/contributor/jobs/${job.id}`;
  let actionTone = 'default';

  if (job.status === 'CANCELLED') {
    actionLabel = 'Cancelled';
  } else if (job.status === 'COMPLETED' || submissionStatus === 'APPROVED' || submissionStatus === 'CONTENT_READY') {
    actionLabel = 'View Submission';
    actionLink = `/contributor/jobs/${job.id}/submission`;
    actionTone = 'success';
  } else if (submissionStatus === 'REVISION_REQUIRED') {
    actionLabel = 'Revise Submission';
    actionLink = `/contributor/jobs/${job.id}/submission`;
    actionTone = 'warning';
  } else if (submissionStatus === 'SUBMITTED' || submissionStatus === 'UNDER_REVIEW') {
    actionLabel = 'View Status';
    actionLink = `/contributor/jobs/${job.id}/submission`;
    actionTone = 'info';
  } else if (submissionStatus === 'DRAFT' || job.status === 'IN_PROGRESS') {
    actionLabel = 'Continue';
    actionLink = `/contributor/jobs/${job.id}/submission`;
    actionTone = 'primary';
  } else if (job.template && job.status === 'ASSIGNED') {
    actionLabel = 'Start Work';
    actionLink = `/contributor/jobs/${job.id}/submission`;
    actionTone = 'primary';
  }

  const assignedDate = job.assignedDate || job.createdAt;
  const formattedAssigned = assignedDate
    ? new Date(assignedDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

  return (
    <div className="flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-1 hover:border-slate-200 hover:shadow-lg">
      <div>
        {/* Top badges */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
              {subjectLabel(job.subject)}
            </span>
            <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700">
              {templateTypeLabel(job.jobType || job.template?.type || 'RESOURCE')}
            </span>
            <StatusBadge label={difficultyLabel(job.difficulty)} />
          </div>
          <StatusBadge label={displayStatus} />
        </div>

        {/* Title */}
        <h3 className="mt-3 text-lg font-semibold tracking-tight text-slate-900 line-clamp-1">
          <Link to={`/contributor/jobs/${job.id}`} className="hover:text-sky-700 transition-colors">
            {job.title}
          </Link>
        </h3>

        {/* Topic */}
        <div className="mt-2 text-xs text-slate-500">
          <span className="font-medium text-slate-700">Topic: </span>
          <span className="font-semibold text-slate-900">{job.topic}</span>
        </div>

        {/* Requirements & Submission Progress */}
        <div className="mt-4 rounded-2xl bg-slate-50/80 p-3.5 border border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Required: {required} items</span>
            <span className="font-bold text-slate-900">
              Submitted: {submitted} / {required}
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200/80">
            <div
              className={`h-full transition-all duration-300 ${
                percentage === 100
                  ? 'bg-emerald-500'
                  : submissionStatus === 'REVISION_REQUIRED'
                  ? 'bg-amber-500'
                  : 'bg-sky-600'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Dates Meta */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-3 text-slate-500">
          <div>
            <span className="block text-[11px] uppercase tracking-wide text-slate-400">Assigned</span>
            <span className="font-medium text-slate-700">{formattedAssigned}</span>
          </div>
          <div className="text-right">
            <span className="block text-[11px] uppercase tracking-wide text-slate-400">Deadline</span>
            <span className="font-medium text-slate-700">{formatDeadline(job.deadline)}</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
        <Link
          to={`/contributor/jobs/${job.id}`}
          className="text-xs font-medium text-slate-500 hover:text-slate-800 transition"
        >
          Details
        </Link>
        {job.status === 'CANCELLED' ? (
          <span className="text-xs font-semibold text-slate-400">Cancelled</span>
        ) : (
          <Link
            to={actionLink}
            className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-150 ${
              actionTone === 'warning'
                ? 'bg-amber-500 text-white shadow-sm hover:bg-amber-600'
                : actionTone === 'success'
                ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                : actionTone === 'primary'
                ? 'bg-slate-900 text-white shadow-sm hover:bg-slate-800 hover:-translate-y-0.5'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {actionLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
