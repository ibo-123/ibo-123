import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { StatusBadge } from "../../components/StatusBadge";
import { JobCard } from "../../components/JobCard";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "../../components/ui";
import { SUBJECTS, subjectLabel } from "../../constants/contributors";
import { difficultyLabel, formatDeadline, jobStatusLabel } from "../../constants/jobs";
import { listMyJobs } from "../../services/jobService";
import type { ContributorJob } from "../../types";

export function MyJobsPage() {
  const [jobs, setJobs] = useState<ContributorJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [subjectFilter, setSubjectFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchJobs = useCallback(() => {
    setLoading(true);
    setError(null);
    let cancelled = false;

    listMyJobs()
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

  useEffect(() => {
    return fetchJobs();
  }, [fetchJobs]);

  const filteredJobs = jobs.filter((job) => {
    if (subjectFilter !== "ALL" && job.subject !== subjectFilter) {
      return false;
    }
    if (statusFilter !== "ALL" && job.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = job.title.toLowerCase().includes(q);
      const matchTopic = job.topic.toLowerCase().includes(q);
      if (!matchTitle && !matchTopic) return false;
    }
    return true;
  });

  return (
    <div className="relative space-y-6">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-sky-200/40 via-violet-200/40 to-amber-200/40 blur-3xl"
      />

      <PageHeader
        title="My Jobs"
        description="Assigned curriculum jobs with target quantities, deadlines, and current submission progress."
        action={
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  viewMode === "cards" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Cards
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  viewMode === "table" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Table
              </button>
            </div>
            <Link
              to="/contributor/submit-resource"
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-slate-800"
            >
              + Submit Topic Resource
            </Link>
          </div>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={fetchJobs} />
      ) : null}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] backdrop-blur-sm">
        <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[16rem]">
          <input
            type="text"
            placeholder="Search by title or topic…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none"
          />

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-slate-400 focus:outline-none"
          >
            <option value="ALL">All Subjects</option>
            {SUBJECTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-slate-400 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        <p className="text-xs text-slate-500 font-medium">
          Showing {filteredJobs.length} {filteredJobs.length === 1 ? "job" : "jobs"}
        </p>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-white/60 bg-white/70 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
          <LoadingState>Loading assigned jobs…</LoadingState>
        </div>
      ) : filteredJobs.length === 0 ? (
        <section className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
          <EmptyState title="No jobs found">
            {jobs.length === 0
              ? "You do not have any assigned jobs right now. When an admin assigns you work, it will appear here."
              : "No jobs match the selected filter criteria."}
          </EmptyState>
        </section>
      ) : viewMode === "cards" ? (
        /* Card Grid View */
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        /* Table View with responsive scrolling */
        <section className="overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50/70 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Job Title</th>
                  <th className="px-5 py-3.5 font-medium">Subject</th>
                  <th className="px-5 py-3.5 font-medium">Topic</th>
                  <th className="px-5 py-3.5 font-medium">Progress</th>
                  <th className="px-5 py-3.5 font-medium">Difficulty</th>
                  <th className="px-5 py-3.5 font-medium">Deadline</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredJobs.map((job) => {
                  const progress = job.submissionProgress;
                  const submitted = progress?.submitted ?? 0;
                  const req = progress?.required ?? job.quantity ?? 1;

                  return (
                    <tr
                      key={job.id}
                      className="group transition-colors hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <Link
                          to={`/contributor/jobs/${job.id}`}
                          className="font-semibold text-slate-900 transition-colors group-hover:text-sky-700"
                        >
                          {job.title}
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                          {subjectLabel(job.subject)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        <span className="line-clamp-1 max-w-[14rem]">{job.topic}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
                          {submitted} / {req}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge label={difficultyLabel(job.difficulty)} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-500 text-xs">
                        {formatDeadline(job.deadline)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge label={jobStatusLabel(job.status)} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/contributor/jobs/${job.id}`}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-900 hover:text-white"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
