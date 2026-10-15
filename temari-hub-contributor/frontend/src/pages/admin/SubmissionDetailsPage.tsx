import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ActivityHistory } from "../../components/ActivityHistory";
import { ReviewHistory, VersionHistory } from "../../components/ReviewHistory";
import { StatusBadge } from "../../components/StatusBadge";
import { SubmissionContent } from "../../components/SubmissionContent";
import { Alert, PageHeader } from "../../components/ui";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "../../components/formStyles";
import type { ReviewDecision } from "../../constants/templates";
import { submissionStatusLabel } from "../../constants/templates";
import {
  downloadSubmissionExport,
  downloadSubmissionFile,
  getSubmission,
  markContentReady,
  reviewSubmission,
  startReview,
} from "../../services/submissionService";
import type { Submission, SubmissionFile } from "../../types";

function BackToSubmissions({ message }: { message: string }) {
  return (
    <section className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
      <p className="text-red-500">{message}</p>
      <Link
        to="/admin/submissions"
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-slate-700 transition-colors hover:text-slate-900"
      >
        ← Back to submissions
      </Link>
    </section>
  );
}

function ActionCard({
  title,
  description,
  tone = "neutral",
  children,
}: {
  title: string;
  description: string;
  tone?: "neutral" | "rose" | "emerald" | "sky";
  children: React.ReactNode;
}) {
  const tint = {
    neutral: "from-slate-50/80 to-white/40 border-slate-100",
    rose: "from-rose-50/70 to-white/40 border-rose-100",
    emerald: "from-emerald-50/70 to-white/40 border-emerald-100",
    sky: "from-sky-50/70 to-white/40 border-sky-100",
  }[tone];

  return (
    <section
      className={`relative mb-4 overflow-hidden rounded-3xl border bg-gradient-to-br ${tint} p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm`}
    >
      <h3 className="text-base font-medium tracking-tight text-slate-900">{title}</h3>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-5 flex flex-wrap items-center gap-3">{children}</div>
    </section>
  );
}

export function SubmissionDetailsPage() {
  const { id } = useParams();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }

    let cancelled = false;

    getSubmission(id)
      .then((data) => {
        if (!cancelled) {
          setSubmission(data.submission);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load submission");
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

  async function run(action: string, task: () => Promise<Submission>, message: string) {
    setError("");
    setNotice("");
    setBusy(action);

    try {
      setSubmission(await task());
      setNotice(message);
      if (action !== "APPROVED") {
        setFeedback("");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to update the review");
    } finally {
      setBusy("");
    }
  }

  async function handleDownload(file: SubmissionFile) {
    if (!submission) {
      return;
    }

    setDownloadingId(file.id);

    try {
      await downloadSubmissionFile(submission.id, file.id, file.originalName);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to download file");
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDecision(decision: ReviewDecision) {
    if (!submission) {
      return;
    }

    if (decision !== "APPROVED" && !feedback.trim()) {
      setError("Feedback is required when you request a revision or reject the work.");
      return;
    }

    const message =
      decision === "APPROVED"
        ? "Approved."
        : decision === "REJECTED"
          ? "Rejected."
          : "Revision requested.";
    await run(
      decision,
      async () => (await reviewSubmission(submission.id, decision, feedback)).submission,
      message,
    );
  }

  if (!id) {
    return <BackToSubmissions message="Invalid submission ID" />;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-3xl border border-white/60 bg-white/70 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
        <p className="text-sm text-slate-500">Loading submission…</p>
      </div>
    );
  }

  if (error && !submission) {
    return <BackToSubmissions message={error} />;
  }

  if (!submission) {
    return <BackToSubmissions message="Submission not found" />;
  }

  const reviewable = submission.status === "SUBMITTED" || submission.status === "UNDER_REVIEW";

  return (
    <div className="relative">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-rose-200/40 via-amber-200/40 to-emerald-200/40 blur-3xl"
      />

      <PageHeader
        eyebrow={
          <Link to="/admin/submissions" className="transition-colors hover:text-slate-900">
            ← Submissions
          </Link>
        }
        title={submission.topicResource?.resourceName || submission.job?.title || "Submission"}
        description={`${submission.contributor?.name ?? "Contributor"} · ${submission.submissionType === 'TOPIC_RESOURCE' ? 'Topic Resource' : (submission.template?.name || "Template")} · Version ${submission.currentVersion || 1}`}
        action={<StatusBadge label={submissionStatusLabel(submission.status)} />}
      />

      {error ? <Alert>{error}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}

      {reviewable ? (
        <ActionCard
          title="Review"
          tone="sky"
          description="Approve the current version, send it back with feedback, or reject it. Feedback is required for a revision or a rejection."
        >
          {submission.status === "SUBMITTED" ? (
            <button
              type="button"
              className={`${secondaryButtonClass} !rounded-full`}
              disabled={Boolean(busy)}
              onClick={() =>
                run(
                  "start",
                  async () => (await startReview(submission.id)).submission,
                  "Review started.",
                )
              }
            >
              {busy === "start" ? "Starting…" : "Start review"}
            </button>
          ) : null}

          <div className="w-full">
            <label
              className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500"
              htmlFor="feedback"
            >
              Reviewer feedback
            </label>
            <textarea
              id="feedback"
              rows={4}
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              className={`${inputClass} !rounded-2xl`}
              placeholder="Explain what should change, or why this is being rejected…"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`${primaryButtonClass} !rounded-full !shadow-[0_8px_24px_-8px_rgba(15,23,42,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-8px_rgba(15,23,42,0.6)]`}
              disabled={Boolean(busy)}
              onClick={() => handleDecision("APPROVED")}
            >
              {busy === "APPROVED" ? "Saving…" : "Approve"}
            </button>
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={() => handleDecision("REVISION_REQUIRED")}
              className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50/60 px-5 py-2.5 text-sm font-medium text-amber-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-amber-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy === "REVISION_REQUIRED" ? "Saving…" : "Request revision"}
            </button>
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={() => handleDecision("REJECTED")}
              className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50/60 px-5 py-2.5 text-sm font-medium text-rose-600 transition-all duration-300 hover:-translate-y-0.5 hover:bg-rose-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy === "REJECTED" ? "Saving…" : "Reject"}
            </button>
          </div>
        </ActionCard>
      ) : null}

      {submission.status === "APPROVED" ? (
        <ActionCard
          title="Content ready"
          tone="emerald"
          description={`Version ${submission.approvedVersion} is the final approved version. Marking it content ready locks that version for export.`}
        >
          <button
            type="button"
            className={`${primaryButtonClass} !rounded-full !shadow-[0_8px_24px_-8px_rgba(15,23,42,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-8px_rgba(15,23,42,0.6)]`}
            disabled={Boolean(busy)}
            onClick={() =>
              run(
                "ready",
                async () => (await markContentReady(submission.id)).submission,
                "Marked content ready.",
              )
            }
          >
            {busy === "ready" ? "Saving…" : "Mark content ready"}
          </button>
        </ActionCard>
      ) : null}

      {submission.status === "CONTENT_READY" ? (
        <ActionCard
          title="Export"
          tone="emerald"
          description="Download the approved version as structured JSON for the main Ethio Exam platform. This file is the handoff — it does not import the work."
        >
          <button
            type="button"
            className={`${primaryButtonClass} !rounded-full !shadow-[0_8px_24px_-8px_rgba(15,23,42,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-8px_rgba(15,23,42,0.6)]`}
            disabled={Boolean(busy)}
            onClick={() =>
              run(
                "export",
                async () => {
                  await downloadSubmissionExport(
                    submission.id,
                    submission.approvedVersion ?? submission.currentVersion,
                  );
                  return submission;
                },
                "Export downloaded.",
              )
            }
          >
            {busy === "export" ? "Downloading…" : "Download export"}
          </button>
        </ActionCard>
      ) : null}

      <div className="space-y-4">
        <SubmissionContent
          submission={submission}
          onDownload={handleDownload}
          downloadingId={downloadingId}
        />
        <ReviewHistory reviews={submission.reviews} />
        <VersionHistory submission={submission} />
        <ActivityHistory entityType="Submission" entityId={submission.id} />
      </div>
    </div>
  );
}
