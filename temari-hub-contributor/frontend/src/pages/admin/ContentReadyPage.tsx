import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StatusBadge } from "../../components/StatusBadge";
import { Alert, EmptyState, LoadingState, PageHeader } from "../../components/ui";
import { subjectLabel, type Subject } from "../../constants/contributors";
import { submissionStatusLabel } from "../../constants/templates";
import { primaryButtonClass, secondaryButtonClass } from "../../components/formStyles";
import {
  downloadContentBundle,
  downloadSubmissionExport,
  listContentReady,
} from "../../services/submissionService";
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

export function ContentReadyPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    listContentReady()
      .then((data) => {
        if (!cancelled) {
          setSubmissions(data.submissions);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load content");
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

  async function handleBundle() {
    setError("");
    setExporting(true);

    try {
      await downloadContentBundle();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to export content");
    } finally {
      setExporting(false);
    }
  }

  async function handleOne(submission: Submission) {
    setError("");
    setDownloadingId(submission.id);

    try {
      await downloadSubmissionExport(
        submission.id,
        submission.approvedVersion ?? submission.currentVersion,
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to export submission");
    } finally {
      setDownloadingId(null);
    }
  }

  const subjects = [
    ...new Set(
      submissions
        .map((submission) => submission.topicResource?.subject ?? submission.job?.subject ?? submission.template?.subject)
        .filter((sub): sub is Subject => Boolean(sub)),
    ),
  ];

  return (
    <div className="relative">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-200/40 via-sky-200/40 to-violet-200/40 blur-3xl"
      />

      <PageHeader
        title="Content ready"
        description="Approved work that can be exported for the main Ethio Exam platform. Export is the handoff — it does not transfer the content by itself."
        action={
          <button
            type="button"
            onClick={handleBundle}
            disabled={exporting || submissions.length === 0}
            className={`${primaryButtonClass} !rounded-full !shadow-[0_8px_24px_-8px_rgba(15,23,42,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-8px_rgba(15,23,42,0.6)] disabled:hover:translate-y-0 disabled:hover:shadow-[0_8px_24px_-8px_rgba(15,23,42,0.5)]`}
          >
            {exporting ? "Exporting…" : "Export all"}
          </button>
        }
      />

      {error ? <Alert>{error}</Alert> : null}

      <section className="overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
        {loading ? (
          <LoadingState>Loading content-ready submissions…</LoadingState>
        ) : submissions.length === 0 ? (
          <EmptyState title="Nothing is content ready yet">
            Approve a submission, then mark the approved version as content ready.
          </EmptyState>
        ) : (
          <div className="divide-y divide-slate-100/80">
            {subjects.map((subject) => {
              const inSubject = submissions.filter(
                (submission) => (submission.topicResource?.subject ?? submission.job?.subject ?? submission.template?.subject) === subject,
              );
              const topics = [
                ...new Set(
                  inSubject.map((submission) => submission.topicResource?.topic || submission.job?.topic || "No topic"),
                ),
              ];

              return (
                <div key={subject} className="px-6 py-6">
                  {/* Subject header */}
                  <div className="mb-4 flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-sky-100 text-xs font-semibold text-slate-700 ring-1 ring-white/60"
                    >
                      {subjectLabel(subject).slice(0, 2).toUpperCase()}
                    </span>
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <h3 className="text-base font-medium tracking-tight text-slate-900">
                        {subjectLabel(subject)}
                      </h3>
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        {inSubject.length} {inSubject.length === 1 ? "item" : "items"}
                      </span>
                    </div>
                  </div>

                  {/* Topics */}
                  <div className="space-y-4">
                    {topics.map((topic) => {
                      const items = inSubject.filter(
                        (submission) => (submission.topicResource?.topic || submission.job?.topic || "No topic") === topic,
                      );

                      return (
                        <div key={topic}>
                          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                            {topic}
                          </p>
                          <ul className="space-y-2">
                            {items.map((submission) => (
                              <li
                                key={submission.id}
                                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white/60 px-4 py-3 text-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-[0_8px_24px_-12px_rgba(15,23,42,0.12)]"
                              >
                                <div className="min-w-0 flex-1">
                                  <Link
                                    to={`/admin/submissions/${submission.id}`}
                                    className="font-medium text-slate-900 transition-colors hover:text-slate-700"
                                  >
                                    {submission.topicResource?.resourceName || submission.job?.title || "Submission"}
                                  </Link>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {submission.contributor?.name ?? "Contributor"}
                                    <span className="mx-1.5 text-slate-300">·</span>
                                    Version{" "}
                                    {submission.approvedVersion ?? submission.currentVersion}
                                    <span className="mx-1.5 text-slate-300">·</span>
                                    {formatTimestamp(submission.contentReadyAt)}
                                  </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <StatusBadge label={submissionStatusLabel(submission.status)} />
                                  <button
                                    type="button"
                                    onClick={() => handleOne(submission)}
                                    disabled={downloadingId === submission.id}
                                    className={`${secondaryButtonClass} !rounded-full !px-3.5 !py-1.5 !text-xs`}
                                  >
                                    {downloadingId === submission.id ? "Downloading…" : "Download"}
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
