import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ActivityHistory } from "../../components/ActivityHistory";
import { JobDetails, JobField } from "../../components/JobDetails";
import { CANCEL_CONFIRMATION, canCancelJob, canEditJob } from "../../constants/jobs";
import { cancelJob, getJob } from "../../services/jobService";
import type { Job } from "../../types";

function BackToJobs({ message }: { message: string }) {
  return (
    <section className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
      <p className="text-red-500">{message}</p>
      <Link
        to="/admin/jobs"
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-slate-700 transition-colors hover:text-slate-900"
      >
        ← Back to jobs
      </Link>
    </section>
  );
}

function initialsFrom(name: string | undefined) {
  if (!name) {
    return "?";
  }
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function JobDetailsPage() {
  const { id } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id) {
      return;
    }

    let cancelled = false;

    getJob(id)
      .then((data) => {
        if (!cancelled) {
          setJob(data.job);
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

  async function handleCancel() {
    if (!job || !window.confirm(CANCEL_CONFIRMATION)) {
      return;
    }

    setActionError("");
    setCancelling(true);

    try {
      const data = await cancelJob(job.id);
      setJob(data.job);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Unable to cancel job");
    } finally {
      setCancelling(false);
    }
  }

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

  return (
    <div className="relative">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-200/40 via-violet-200/40 to-sky-200/40 blur-3xl"
      />

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            to="/admin/jobs"
            className="inline-flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-slate-900"
          >
            ← Jobs
          </Link>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Job details
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEditJob(job.status) ? (
            <Link
              to={`/admin/jobs/${job.id}/edit`}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-[0_8px_24px_-8px_rgba(15,23,42,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-[0_12px_28px_-8px_rgba(15,23,42,0.6)] focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            >
              Edit job
            </Link>
          ) : null}
          {canCancelJob(job.status) ? (
            <button
              type="button"
              disabled={cancelling}
              onClick={handleCancel}
              className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50/60 px-5 py-2.5 text-sm font-medium text-rose-600 transition-all duration-300 hover:-translate-y-0.5 hover:bg-rose-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cancelling ? "Cancelling…" : "Cancel job"}
            </button>
          ) : null}
        </div>
      </div>

      {actionError ? (
        <div className="mb-4 rounded-2xl border border-rose-100 bg-rose-50/70 px-4 py-3 text-sm text-rose-600">
          {actionError}
        </div>
      ) : null}

      <JobDetails
        job={job}
        showCreated
        extra={
          <>
            <JobField label="Contributor">
              {job.contributor ? (
                <Link
                  to={`/admin/contributors/${job.contributor.id}`}
                  className="group inline-flex items-center gap-2 transition-colors"
                >
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-violet-100 text-[11px] font-semibold text-slate-700 ring-1 ring-white/60"
                  >
                    {initialsFrom(job.contributor.name)}
                  </span>
                  <span className="text-slate-900 underline-offset-2 transition-colors group-hover:text-slate-600 group-hover:underline">
                    {job.contributor.name}
                  </span>
                </Link>
              ) : (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                  Unassigned
                </span>
              )}
            </JobField>
            <JobField label="Created By">
              {job.createdBy?.name ? (
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-sky-100 text-[11px] font-semibold text-slate-700 ring-1 ring-white/60"
                  >
                    {initialsFrom(job.createdBy.name)}
                  </span>
                  <span className="text-slate-900">{job.createdBy.name}</span>
                </div>
              ) : (
                <span className="text-slate-500">Unknown</span>
              )}
            </JobField>
          </>
        }
      />

      <div className="mt-6">
        <ActivityHistory entityType="Job" entityId={job.id} />
      </div>
    </div>
  );
}
