import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { StatusBadge } from "../../components/StatusBadge";
import { Alert, EmptyState, LoadingState, PageHeader } from "../../components/ui";
import { submissionStatusLabel } from "../../constants/templates";
import { listSubmissions } from "../../services/submissionService";
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

export function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "TOPIC_RESOURCE" | "TEMPLATE">("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    let cancelled = false;

    listSubmissions()
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

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      if (typeFilter === "TOPIC_RESOURCE" && sub.submissionType !== "TOPIC_RESOURCE") return false;
      if (typeFilter === "TEMPLATE" && sub.submissionType === "TOPIC_RESOURCE") return false;

      if (statusFilter !== "ALL" && sub.status !== statusFilter) return false;

      if (search.trim()) {
        const query = search.toLowerCase();
        const title = (sub.topicResource?.resourceName || sub.job?.title || "").toLowerCase();
        const contributorName = (sub.contributor?.name || "").toLowerCase();
        const topic = (sub.topicResource?.topic || sub.job?.topic || "").toLowerCase();
        const subject = (sub.topicResource?.subject || sub.job?.subject || "").toLowerCase();
        return (
          title.includes(query) ||
          contributorName.includes(query) ||
          topic.includes(query) ||
          subject.includes(query)
        );
      }
      return true;
    });
  }, [submissions, typeFilter, statusFilter, search]);

  return (
    <div className="relative">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-rose-200/40 via-amber-200/40 to-emerald-200/40 blur-3xl"
      />

      <PageHeader
        title="Submissions"
        description="Review incoming curriculum materials and structured job items, request revisions, or approve for content export."
      />

      {error ? <Alert>{error}</Alert> : null}

      {/* Filter and Search Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur-sm">
        <div className="flex flex-1 min-w-[240px] items-center gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, contributor, topic, subject…"
            className="w-full rounded-xl border border-slate-200 bg-white/90 px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as "ALL" | "TOPIC_RESOURCE" | "TEMPLATE")}
            className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-xs font-medium text-slate-700 focus:border-slate-400 focus:outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="TOPIC_RESOURCE">Topic Resources</option>
            <option value="TEMPLATE">Template Jobs</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-xs font-medium text-slate-700 focus:border-slate-400 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="REVISION_REQUIRED">Revision Required</option>
            <option value="APPROVED">Approved</option>
            <option value="CONTENT_READY">Content Ready</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      <section className="overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
        {loading ? (
          <LoadingState>Loading submissions…</LoadingState>
        ) : filteredSubmissions.length === 0 ? (
          <EmptyState title="No submissions found">
            {search || typeFilter !== "ALL" || statusFilter !== "ALL"
              ? "No submissions match your active filter criteria."
              : "They will appear here once contributors submit their work."}
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Resource / Job</th>
                  <th className="px-5 py-3.5 font-medium">Contributor</th>
                  <th className="px-5 py-3.5 font-medium">Type</th>
                  <th className="px-5 py-3.5 font-medium">Processing</th>
                  <th className="px-5 py-3.5 font-medium">Review Status</th>
                  <th className="px-5 py-3.5 font-medium">Submitted</th>
                  <th className="px-5 py-3.5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((submission) => {
                  const title =
                    submission.topicResource?.resourceName || submission.job?.title || "Submission";
                  const subject = submission.topicResource?.subject || submission.job?.subject;
                  const topic = submission.topicResource?.topic || submission.job?.topic;

                  return (
                    <tr
                      key={submission.id}
                      className="group border-b border-slate-100/80 transition-colors last:border-0 hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <Link
                          to={`/admin/submissions/${submission.id}`}
                          className="font-semibold text-slate-900 transition-colors group-hover:text-slate-950 hover:text-slate-700"
                        >
                          {title}
                        </Link>
                        {(subject || topic) && (
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                            {subject && (
                              <span className="font-medium text-slate-700">{subject}</span>
                            )}
                            {subject && topic && <span>•</span>}
                            {topic && <span className="truncate max-w-[200px]">{topic}</span>}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            aria-hidden="true"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-violet-100 text-[11px] font-semibold text-slate-700 ring-1 ring-white/60"
                          >
                            {initialsFrom(submission.contributor?.name)}
                          </span>
                          <span className="truncate text-slate-700">
                            {submission.contributor?.name ?? "Unknown"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                          {submission.submissionType === "TOPIC_RESOURCE"
                            ? `Topic Resource (${submission.topicResource?.inputType || "TEXT"})`
                            : submission.template?.name || "Template"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {submission.submissionType === "TOPIC_RESOURCE" && submission.topicResource ? (
                          <StatusBadge label={submission.topicResource.processingStatus} />
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge label={submissionStatusLabel(submission.status)} />
                      </td>
                      <td className="px-5 py-4 text-slate-500 whitespace-nowrap">
                        {formatTimestamp(submission.submittedAt)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/admin/submissions/${submission.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-900 hover:text-slate-700"
                        >
                          Review →
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
