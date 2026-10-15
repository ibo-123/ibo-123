import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StatusBadge } from "../../components/StatusBadge";
import { Alert, EmptyState, LoadingState, PageHeader } from "../../components/ui";
import { primaryButtonClass } from "../../components/formStyles";
import { subjectLabel } from "../../constants/contributors";
import {
  CANCEL_CONFIRMATION,
  canCancelJob,
  canEditJob,
  difficultyLabel,
  formatDeadline,
  jobStatusLabel,
} from "../../constants/jobs";
import { cancelJob, listJobs } from "../../services/jobService";
import type { Job } from "../../types";

function initialsFrom(name: string | undefined) {
  if (!name) {
    return "·";
  }
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    listJobs()
      .then((data) => {
        if (!cancelled) {
          setJobs(data.jobs);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load jobs");
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

  async function handleCancel(job: Job) {
    if (!window.confirm(CANCEL_CONFIRMATION)) {
      return;
    }

    setError("");
    setCancellingId(job.id);

    try {
      const data = await cancelJob(job.id);
      setJobs((current) => current.map((item) => (item.id === data.job.id ? data.job : item)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to cancel job");
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="relative">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-200/40 via-violet-200/40 to-sky-200/40 blur-3xl"
      />

      <PageHeader
        title="Jobs"
        description="Assign one contributor and one template. The template decides the fields they must submit."
        action={
          <Link
            to="/admin/jobs/new"
            className={`${primaryButtonClass} !rounded-full !shadow-[0_8px_24px_-8px_rgba(15,23,42,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-8px_rgba(15,23,42,0.6)]`}
          >
            Create job
          </Link>
        }
      />

      {error ? <Alert>{error}</Alert> : null}

      <section className="overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
        {loading ? (
          <LoadingState>Loading jobs…</LoadingState>
        ) : jobs.length === 0 ? (
          <EmptyState title="No jobs yet">
            Create a job when you are ready to assign work.
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Job</th>
                  <th className="px-5 py-3.5 font-medium">Contributor</th>
                  <th className="px-5 py-3.5 font-medium">Subject</th>
                  <th className="px-5 py-3.5 font-medium">Topic</th>
                  <th className="px-5 py-3.5 font-medium">Qty</th>
                  <th className="px-5 py-3.5 font-medium">Difficulty</th>
                  <th className="px-5 py-3.5 font-medium">Deadline</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr
                    key={job.id}
                    className="group border-b border-slate-100/80 transition-colors last:border-0 hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4">
                      <Link
                        to={`/admin/jobs/${job.id}`}
                        className="font-medium text-slate-900 transition-colors group-hover:text-slate-950 hover:text-slate-700"
                      >
                        {job.title}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      {job.contributor?.name ? (
                        <div className="flex items-center gap-3">
                          <span
                            aria-hidden="true"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-violet-100 text-[11px] font-semibold text-slate-700 ring-1 ring-white/60"
                          >
                            {initialsFrom(job.contributor.name)}
                          </span>
                          <span className="truncate text-slate-700">{job.contributor.name}</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        {subjectLabel(job.subject)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      <span className="line-clamp-1 max-w-[16rem]">{job.topic}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        {job.quantity}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge label={difficultyLabel(job.difficulty)} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                      {formatDeadline(job.deadline)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge label={jobStatusLabel(job.status)} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2 whitespace-nowrap">
                        <Link
                          to={`/admin/jobs/${job.id}`}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-900 hover:shadow-sm"
                        >
                          View
                        </Link>
                        {canEditJob(job.status) ? (
                          <Link
                            to={`/admin/jobs/${job.id}/edit`}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-900 hover:shadow-sm"
                          >
                            Edit
                          </Link>
                        ) : null}
                        {canCancelJob(job.status) ? (
                          <button
                            type="button"
                            disabled={cancellingId === job.id}
                            onClick={() => handleCancel(job)}
                            className="rounded-full border border-rose-200 bg-rose-50/60 px-3 py-1.5 text-xs font-medium text-rose-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {cancellingId === job.id ? "Cancelling…" : "Cancel"}
                          </button>
                        ) : null}
                      </div>
                    </td>
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
