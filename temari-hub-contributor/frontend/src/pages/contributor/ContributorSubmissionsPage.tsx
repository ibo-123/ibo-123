import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { StatusBadge } from "../../components/StatusBadge";
import { Alert, EmptyState, LoadingState, PageHeader } from "../../components/ui";
import { submissionStatusLabel } from "../../constants/templates";
import { listMySubmissions } from "../../services/submissionService";
import type { Submission } from "../../types";

function formatTimestamp(value: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
    date,
  );
}

export function ContributorSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    let cancelled = false;

    listMySubmissions()
      .then((data) => {
        if (!cancelled) {
          setSubmissions(data.submissions);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load submissions");
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

  const filtered = useMemo(() => {
    return submissions.filter((sub) => {
      if (statusFilter !== "ALL" && sub.status !== statusFilter) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const title = (sub.topicResource?.resourceName || sub.job?.title || "").toLowerCase();
        const topic = (sub.topicResource?.topic || sub.job?.topic || "").toLowerCase();
        return title.includes(query) || topic.includes(query);
      }
      return true;
    });
  }, [submissions, statusFilter, search]);

  return (
    <div className="relative">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-sky-200/40 via-violet-200/40 to-amber-200/40 blur-3xl"
      />

      <PageHeader
        title="My Submissions"
        description="Track your submissions, respond to revision requests, and view approval status."
        action={
          <Link
            to="/contributor/submit-resource"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition"
          >
            + Submit Topic Resource
          </Link>
        }
      />

      {error ? <Alert>{error}</Alert> : null}

      {/* Filter and Search */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur-sm">
        <div className="flex flex-1 min-w-[220px]">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your submissions…"
            className="w-full rounded-xl border border-slate-200 bg-white/90 px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-xs font-medium text-slate-700 focus:border-slate-400 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="REVISION_REQUIRED">Revision Required</option>
            <option value="APPROVED">Approved</option>
            <option value="CONTENT_READY">Content Ready</option>
          </select>
        </div>
      </div>

      <section className="overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
        {loading ? (
          <LoadingState>Loading submissions…</LoadingState>
        ) : filtered.length === 0 ? (
          <EmptyState title="No submissions found">
            {search || statusFilter !== "ALL"
              ? "No submissions match your active filter."
              : "You have not submitted any items or topic resources yet."}
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Resource / Job</th>
                  <th className="px-5 py-3.5 font-medium">Type</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 font-medium">Processing</th>
                  <th className="px-5 py-3.5 font-medium">Updated</th>
                  <th className="px-5 py-3.5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((submission) => {
                  const isTopicResource = submission.submissionType === "TOPIC_RESOURCE";
                  const title =
                    submission.topicResource?.resourceName || submission.job?.title || "Submission";
                  const detailUrl = isTopicResource
                    ? `/contributor/resources/${submission.id}`
                    : `/contributor/jobs/${submission.job?.id || ""}/submission`;
                  const needsRevision = submission.status === "REVISION_REQUIRED";

                  return (
                    <tr
                      key={submission.id}
                      className={`group border-b border-slate-100/80 transition-colors last:border-0 hover:bg-slate-50/70 ${
                        needsRevision ? "bg-amber-50/20" : ""
                      }`}
                    >
                      <td className="px-5 py-4">
                        <Link
                          to={detailUrl}
                          className="font-medium text-slate-900 transition-colors group-hover:text-slate-950 hover:text-slate-700"
                        >
                          {title}
                        </Link>
                        {submission.topicResource?.topic && (
                          <div className="mt-0.5 text-xs text-slate-500">
                            {submission.topicResource.subject} · {submission.topicResource.topic}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                          {isTopicResource
                            ? `Topic Resource (${submission.topicResource?.inputType || "TEXT"})`
                            : submission.template?.name || "Template"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge label={submissionStatusLabel(submission.status)} />
                      </td>
                      <td className="px-5 py-4">
                        {isTopicResource && submission.topicResource ? (
                          <StatusBadge label={submission.topicResource.processingStatus} />
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                        {formatTimestamp(submission.updatedAt)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          to={detailUrl}
                          className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                            needsRevision
                              ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                              : submission.status === "DRAFT"
                              ? "bg-slate-900 text-white hover:bg-slate-800"
                              : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {needsRevision
                            ? "Revise →"
                            : submission.status === "DRAFT"
                            ? "Continue Draft →"
                            : "View"}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
