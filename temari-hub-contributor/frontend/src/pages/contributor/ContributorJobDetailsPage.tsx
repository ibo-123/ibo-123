import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { JobDetails } from "../../components/JobDetails";
import { Alert, PageHeader } from "../../components/ui";
import { primaryButtonClass } from "../../components/formStyles";
import { deadlineHasPassed, formatDeadline, jobStatusLabel } from "../../constants/jobs";
import { submissionStatusLabel } from "../../constants/templates";
import { getMyJob } from "../../services/jobService";
import { getMySubmission } from "../../services/submissionService";
import type { ContributorJob, Submission } from "../../types";

function BackToJobs({ message }: { message: string }) {
  return (
    <section className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
      <p className="text-red-500">{message}</p>
      <Link
        to="/contributor/jobs"
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-slate-700 transition-colors hover:text-slate-900"
      >
        ← Back to my jobs
      </Link>
    </section>
  );
}

export function ContributorJobDetailsPage() {
  const { id } = useParams();
  const [job, setJob] = useState<ContributorJob | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      return;
    }

    let cancelled = false;

    getMyJob(id)
      .then(async (data) => {
        const submissionData = await getMySubmission(id);
        if (!cancelled) {
          setJob(data.job);
          setSubmission(submissionData.submission);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load job");
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
  }, [id]);

  if (!id) {
    return <BackToJobs message="Invalid job ID" />;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-3xl border border-white/60 bg-white/70 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
        <p className="text-sm text-slate-500">Loading job…</p>
      </div>
    );
  }

  if (error || !job) {
    return <BackToJobs message={error || "Job not found"} />;
  }

  const canStart =
    Boolean(job.template) &&
    !submission &&
    (job.status === "ASSIGNED" || job.status === "IN_PROGRESS");

  const submissionLabel = !job.template
    ? null
    : !submission
      ? canStart
        ? "Start submission"
        : null
      : submission.status === "DRAFT"
        ? "Continue submission"
        : submission.status === "REVISION_REQUIRED"
          ? "Revise submission"
          : "View submission";

  const deadlineWarning =
    job.template &&
    deadlineHasPassed(job.deadline) &&
    (!submission || submission.status === "DRAFT");

  return (
    <div className="relative">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-sky-200/40 via-violet-200/40 to-amber-200/40 blur-3xl"
      />

      <PageHeader
        eyebrow={
          <Link to="/contributor/jobs" className="transition-colors hover:text-slate-900">
            ← My jobs
          </Link>
        }
        title={job.title}
        description={
          job.template
            ? `${job.template.name} · ${job.quantity} items · due ${formatDeadline(job.deadline)}`
            : `Due ${formatDeadline(job.deadline)}`
        }
        action={
          submissionLabel ? (
            <Link
              to={`/contributor/jobs/${job.id}/submission`}
              className={`${primaryButtonClass} !rounded-full !shadow-[0_8px_24px_-8px_rgba(15,23,42,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-8px_rgba(15,23,42,0.6)]`}
            >
              {submissionLabel}
            </Link>
          ) : null
        }
      />

      {/* Warnings */}
      {!job.template ? (
        <Alert tone="warning">This job does not have a submission template yet.</Alert>
      ) : null}

      {deadlineWarning ? (
        <Alert tone="warning">
          The deadline has passed. A draft can still be opened, but it can no longer be submitted.
        </Alert>
      ) : null}

      {/* Status strip */}
      {submission ? (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-100 bg-white/60 px-4 py-3 backdrop-blur-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Submission
          </span>
          <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700">
            {submissionStatusLabel(submission.status)}
          </span>
          <span className="mx-1 text-slate-300">·</span>
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Job</span>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            {jobStatusLabel(job.status)}
          </span>
        </div>
      ) : null}

      <JobDetails job={job} />
    </div>
  );
}
