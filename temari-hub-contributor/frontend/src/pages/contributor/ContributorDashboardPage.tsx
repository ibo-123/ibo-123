import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ApiRequestError, apiRequest } from "../../services/api";
import { Icon } from "../../components/Icons";
import { StatusBadge } from "../../components/StatusBadge";
import { ErrorState, LoadingState } from "../../components/ui";
import { formatDeadline, jobStatusLabel } from "../../constants/jobs";
import { subjectLabel } from "../../constants/contributors";
import type { ContributorDashboardData } from "../../types";

export function ContributorDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<ContributorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(() => {
    setLoading(true);
    setError(null);
    let cancelled = false;

    apiRequest<ContributorDashboardData>("/api/contributor/dashboard")
      .then((res) => {
        if (!cancelled) {
          setData(res);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiRequestError && (err.status === 401 || err.status === 403)) {
          logout();
          navigate("/login", { replace: true });
          return;
        }
        setError(err instanceof Error ? err.message : "Unable to load dashboard data");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [logout, navigate]);

  useEffect(() => {
    return fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/60 bg-white/70 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
        <LoadingState>Loading dashboard metrics…</LoadingState>
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error || "Could not load dashboard metrics"} onRetry={fetchDashboard} />;
  }

  const { metrics, upcomingDeadlines, recentActivity } = data;

  return (
    <div className="relative space-y-6">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-sky-200/40 via-violet-200/40 to-amber-200/40 blur-3xl"
      />

      {/* Header */}
      <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center rounded-full bg-slate-900/5 px-3 py-1 text-xs font-medium tracking-wide text-slate-600">
              Contributor Dashboard
            </span>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Welcome back, {user?.name}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Track your assigned jobs, continue drafts, review requested revisions, and submit topic resources.
            </p>
          </div>
          <Link
            to="/contributor/submit-resource"
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md"
          >
            <span>+</span> Submit Topic Resource
          </Link>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active Jobs */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Jobs</span>
            <Icon name="briefcase" className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{metrics.activeJobs}</p>
          <div className="mt-4 border-t border-slate-100 pt-3">
            <Link
              to="/contributor/jobs"
              className="inline-flex items-center text-xs font-semibold text-sky-600 transition hover:text-sky-700"
            >
              View Jobs →
            </Link>
          </div>
        </div>

        {/* Pending Submissions */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending Review</span>
            <Icon name="clock" className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{metrics.pendingSubmissions}</p>
          <div className="mt-4 border-t border-slate-100 pt-3">
            <Link
              to="/contributor/submissions"
              className="inline-flex items-center text-xs font-semibold text-sky-600 transition hover:text-sky-700"
            >
              View Submissions →
            </Link>
          </div>
        </div>

        {/* Submissions Requiring Revision */}
        <div
          className={`rounded-2xl border p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:shadow-md ${
            metrics.submissionsRequiringRevision > 0
              ? "border-amber-200 bg-amber-50/50"
              : "border-slate-100 bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                metrics.submissionsRequiringRevision > 0 ? "text-amber-800" : "text-slate-400"
              }`}
            >
              Needs Revision
            </span>
            <Icon
              name={metrics.submissionsRequiringRevision > 0 ? "alert" : "file"}
              className={`h-5 w-5 ${metrics.submissionsRequiringRevision > 0 ? "text-amber-700" : "text-slate-400"}`}
            />
          </div>
          <p
            className={`mt-3 text-3xl font-bold tracking-tight ${
              metrics.submissionsRequiringRevision > 0 ? "text-amber-900" : "text-slate-900"
            }`}
          >
            {metrics.submissionsRequiringRevision}
          </p>
          <div className="mt-4 border-t border-slate-100 pt-3">
            <Link
              to="/contributor/submissions"
              className={`inline-flex items-center text-xs font-semibold transition ${
                metrics.submissionsRequiringRevision > 0
                  ? "text-amber-900 hover:underline"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Review Feedback →
            </Link>
          </div>
        </div>

        {/* Approved Submissions */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Approved</span>
            <Icon name="check" className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-emerald-600">{metrics.approvedSubmissions}</p>
          <div className="mt-4 border-t border-slate-100 pt-3">
            <Link
              to="/contributor/submissions"
              className="inline-flex items-center text-xs font-semibold text-emerald-700 transition hover:text-emerald-800"
            >
              View Approved →
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Split: Upcoming Deadlines & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming Deadlines (2 cols) */}
        <section className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Upcoming Deadlines</h3>
              <p className="mt-0.5 text-xs text-slate-500">Your assigned and active work sorted by nearest due date.</p>
            </div>
            <Link
              to="/contributor/jobs"
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300 hover:text-slate-900"
            >
              View All Jobs
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {upcomingDeadlines.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                No upcoming deadlines. You are all caught up.
              </div>
            ) : (
              upcomingDeadlines.map((job) => (
                <div
                  key={job.id}
                  className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-sm sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900 hover:text-slate-700">
                        {job.title}
                      </span>
                      <StatusBadge label={jobStatusLabel(job.status)} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span>{subjectLabel(job.subject)}</span>
                      <span>•</span>
                      <span className="truncate max-w-[14rem]">{job.topic}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-slate-400">Deadline</p>
                      <p className="text-xs font-medium text-slate-700">{formatDeadline(job.deadline)}</p>
                    </div>
                    <Link
                      to={`/contributor/jobs/${job.id}`}
                      className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800"
                    >
                      Open Job
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Recent Activity (1 col) */}
        <section className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
            <p className="mt-0.5 text-xs text-slate-500">Latest updates on your contributions and reviews.</p>
          </div>

          <div className="mt-4 space-y-4">
            {recentActivity.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                No recent activity recorded yet.
              </div>
            ) : (
              recentActivity.map((act) => (
                <div key={act.id} className="flex gap-3 text-xs">
                  <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-sky-500 ring-4 ring-sky-100" />
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 leading-snug">{act.description}</p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {new Date(act.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
