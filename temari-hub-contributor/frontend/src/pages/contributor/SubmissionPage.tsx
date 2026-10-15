import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { ReviewHistory } from "../../components/ReviewHistory";
import { SubmissionContent } from "../../components/SubmissionContent";
import { Alert, PageHeader } from "../../components/ui";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "../../components/formStyles";
import { deadlineHasPassed } from "../../constants/jobs";
import { ApiRequestError } from "../../services/api";
import { getMyJob } from "../../services/jobService";
import {
  createSubmission,
  downloadSubmissionFile,
  getMySubmission,
  removeSubmissionFile,
  resubmitSubmission,
  submitSubmission,
  updateSubmission,
  uploadSubmissionFiles,
} from "../../services/submissionService";
import type {
  ContributorJob,
  Submission,
  SubmissionFile,
  SubmissionItem,
  TemplateField,
} from "../../types";

function itemReady(row: Record<string, string>, fields: TemplateField[]) {
  return fields.every((field) => !field.required || (row[field.name] ?? "").trim() !== "");
}

function itemPreview(row: Record<string, string>, fields: TemplateField[]) {
  const field = fields.find((item) => (row[item.name] ?? "").trim());
  if (!field) {
    return "Not started";
  }

  const text = row[field.name].trim();
  return text.length > 72 ? `${text.slice(0, 72)}…` : text;
}

function latestFeedback(submission: Submission, decision: "REVISION_REQUIRED" | "REJECTED") {
  const match = [...(submission.reviews ?? [])]
    .reverse()
    .find((review) => review.decision === decision);
  return match?.feedback ?? "";
}

function blankRow(fields: TemplateField[]) {
  return Object.fromEntries(fields.map((field) => [field.name, ""]));
}

function groupFields(fields: TemplateField[]) {
  const isQuestionTemplate = fields.some((f) =>
    ['question', 'stem', 'prompt', 'option_a', 'choices', 'correct_answer'].some((k) =>
      f.name.toLowerCase().includes(k),
    ),
  );

  if (!isQuestionTemplate) {
    return { isGrouped: false, groups: [{ title: 'Fields', fields, color: 'border-slate-100 bg-slate-50/30' }] };
  }

  const questionFields: TemplateField[] = [];
  const answerFields: TemplateField[] = [];
  const explanationFields: TemplateField[] = [];
  const metaFields: TemplateField[] = [];

  for (const f of fields) {
    const n = f.name.toLowerCase();
    if (['question', 'prompt', 'stem', 'problem', 'body'].some((k) => n.includes(k))) {
      questionFields.push(f);
    } else if (['option', 'choice', 'answer', 'correct'].some((k) => n.includes(k))) {
      answerFields.push(f);
    } else if (['explanation', 'solution', 'rationale', 'working', 'reason'].some((k) => n.includes(k))) {
      explanationFields.push(f);
    } else {
      metaFields.push(f);
    }
  }

  const groups = [
    { title: 'Question Prompt', fields: questionFields, color: 'border-sky-100 bg-sky-50/40' },
    { title: 'Answer Choices & Solution Key', fields: answerFields, color: 'border-emerald-100 bg-emerald-50/40' },
    { title: 'Explanation & Solution Steps', fields: explanationFields, color: 'border-violet-100 bg-violet-50/40' },
    { title: 'Details & Classification', fields: metaFields, color: 'border-slate-100 bg-slate-50/40' },
  ].filter((g) => g.fields.length > 0);

  return { isGrouped: true, groups };
}

function rowsFromSubmission(submission: Submission, quantity: number, fields: TemplateField[]) {
  const sorted = [...submission.items].sort((left, right) => left.order - right.order);
  const rows = sorted.map((item) => {
    const row = blankRow(fields);
    fields.forEach((field) => {
      const value = item.values[field.name];
      row[field.name] = value === null || value === undefined ? "" : String(value);
    });
    return row;
  });

  while (rows.length < quantity) {
    rows.push(blankRow(fields));
  }

  return rows.slice(0, quantity);
}

function rowsToItems(
  rows: Record<string, string>[],
  fields: TemplateField[],
): SubmissionItem[] | string {
  const items: SubmissionItem[] = [];

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const values: Record<string, string | number | null> = {};

    for (const field of fields) {
      const raw = row[field.name] ?? "";
      if (field.type === "number") {
        if (raw.trim() === "") {
          values[field.name] = null;
        } else {
          const parsed = Number(raw);
          if (!Number.isFinite(parsed)) {
            return `Item ${index + 1}: ${field.label} must be a number`;
          }
          values[field.name] = parsed;
        }
      } else {
        values[field.name] = raw;
      }
    }

    items.push({ order: index + 1, values });
  }

  return items;
}

function BackLink({ message }: { message: string }) {
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

export function SubmissionPage() {
  const { jobId } = useParams();
  const [job, setJob] = useState<ContributorJob | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [openIndex, setOpenIndex] = useState(0);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!jobId) {
      return;
    }

    let cancelled = false;

    async function load(id: string) {
      try {
        const jobData = await getMyJob(id);
        const loadedJob = jobData.job;
        let existing = (await getMySubmission(id)).submission;
        const canCreate =
          Boolean(loadedJob.template) &&
          (loadedJob.status === "ASSIGNED" || loadedJob.status === "IN_PROGRESS");

        if (!existing && canCreate) {
          try {
            existing = (await createSubmission(id)).submission;
          } catch (err: unknown) {
            if (err instanceof ApiRequestError && err.status === 409) {
              existing = (await getMySubmission(id)).submission;
            } else {
              throw err;
            }
          }
        }

        if (!cancelled) {
          setJob(loadedJob);
          setSubmission(existing);
          if (existing && loadedJob.template) {
            const templateFields = loadedJob.template.fields;
            const nextRows = rowsFromSubmission(existing, loadedJob.quantity, templateFields);
            const gap = nextRows.findIndex((row) => !itemReady(row, templateFields));
            setRows(nextRows);
            setOpenIndex(gap === -1 ? 0 : gap);
            setNotes(existing.notes);
          }
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load submission");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load(jobId);

    return () => {
      cancelled = true;
    };
  }, [jobId]);

  function updateCell(index: number, name: string, value: string) {
    setNotice("");
    setRows((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, [name]: value } : row)),
    );
  }

  function currentItems() {
    if (!job?.template) {
      return "This job does not have a submission template yet";
    }

    return rowsToItems(rows, job.template.fields);
  }

  async function handleSave(event?: FormEvent) {
    event?.preventDefault();
    if (!submission) {
      return;
    }

    const items = currentItems();
    if (typeof items === "string") {
      setError(items);
      return;
    }

    setError("");
    setNotice("");
    setSaving(true);

    try {
      const data = await updateSubmission(submission.id, { items, notes });
      setSubmission(data.submission);
      if (job?.template) {
        setRows(rowsFromSubmission(data.submission, job.quantity, job.template.fields));
      }
      setNotes(data.submission.notes);
      setNotice(
        data.submission.status === "REVISION_REQUIRED"
          ? "Changes saved. Resubmit when the requested updates are done."
          : "Draft saved. You can leave and continue later.",
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to save draft");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    if (!submission || !job) {
      return;
    }

    const items = currentItems();
    if (typeof items === "string") {
      setError(items);
      return;
    }

    if (job.template) {
      const templateFields = job.template.fields;
      const gap = rows.findIndex((row) => !itemReady(row, templateFields));
      if (gap !== -1) {
        setOpenIndex(gap);
        setNotice("");
        setError(`Item ${gap + 1} is missing required fields.`);
        return;
      }
    }

    setError("");
    setNotice("");
    setSending(true);

    try {
      const saved = await updateSubmission(submission.id, { items, notes });
      const revising = saved.submission.status === "REVISION_REQUIRED";
      const sent = revising
        ? await resubmitSubmission(saved.submission.id)
        : await submitSubmission(saved.submission.id);
      setSubmission(sent.submission);
      setNotice(revising ? "Revision sent for review." : "Submitted for review.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to submit");
      const refreshed = await getMySubmission(job.id).catch(() => null);
      if (refreshed?.submission) {
        setSubmission(refreshed.submission);
      }
    } finally {
      setSending(false);
    }
  }

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    if (!submission) {
      return;
    }

    const selected = event.target.files ? Array.from(event.target.files) : [];
    event.target.value = "";
    if (selected.length === 0) {
      return;
    }

    setError("");

    try {
      const data = await uploadSubmissionFiles(submission.id, selected);
      setSubmission(data.submission);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to upload files");
    }
  }

  async function handleRemove(fileId: string) {
    if (!submission) {
      return;
    }

    setError("");

    try {
      const data = await removeSubmissionFile(submission.id, fileId);
      setSubmission(data.submission);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to remove file");
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

  if (!jobId) {
    return <BackLink message="Invalid job ID" />;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-3xl border border-white/60 bg-white/70 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
        <p className="text-sm text-slate-500">Loading submission…</p>
      </div>
    );
  }

  if (!job) {
    return <BackLink message={error || "Job not found"} />;
  }

  if (!job.template || !submission) {
    return (
      <BackLink
        message={
          job.template
            ? "This job is not open for a new submission."
            : "This job does not have a submission template yet."
        }
      />
    );
  }

  const fields = [...job.template.fields].sort((left, right) => left.order - right.order);
  const revising = submission.status === "REVISION_REQUIRED";
  const locked = submission.status !== "DRAFT" && !revising;
  const expired = deadlineHasPassed(job.deadline);
  const readyCount = rows.filter((row) => itemReady(row, fields)).length;
  const revisionNote = latestFeedback(submission, "REVISION_REQUIRED");
  const rejectionNote = latestFeedback(submission, "REJECTED");
  const progressPct = rows.length === 0 ? 0 : Math.round((readyCount / rows.length) * 100);

  return (
    <div className="relative">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-sky-200/40 via-violet-200/40 to-amber-200/40 blur-3xl"
      />

      <PageHeader
        eyebrow={
          <Link
            to={`/contributor/jobs/${job.id}`}
            className="inline-flex items-center gap-1 transition-colors hover:text-slate-900"
          >
            ← Back to job
          </Link>
        }
        title={job.title}
        description={`${job.template.name}. This job asks for exactly ${job.quantity} items. Required fields are marked.`}
      />

      {error ? <Alert>{error}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {revising && revisionNote ? (
        <Alert tone="warning">{`Revision requested: ${revisionNote}`}</Alert>
      ) : null}
      {submission.status === "REJECTED" && rejectionNote ? (
        <Alert>{`Rejected: ${rejectionNote}`}</Alert>
      ) : null}

      {locked ? (
        <div className="space-y-4">
          <SubmissionContent
            submission={submission}
            onDownload={handleDownload}
            downloadingId={downloadingId}
          />
          <ReviewHistory reviews={submission.reviews} />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4 pb-4">
          {/* Progress strip */}
          <div className="rounded-2xl border border-slate-100 bg-white/60 px-4 py-3 backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Progress
                </span>
                <span className="text-sm text-slate-700">
                  {readyCount} of {rows.length} {rows.length === 1 ? "item" : "items"} ready
                </span>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  readyCount === rows.length
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-sky-50 text-sky-700"
                }`}
              >
                {progressPct}%
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressPct}
              className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  readyCount === rows.length
                    ? "bg-gradient-to-r from-emerald-300 to-emerald-400"
                    : "bg-gradient-to-r from-sky-300 to-violet-300"
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Item cards */}
          {rows.map((row, index) => {
            const ready = itemReady(row, fields);
            const open = openIndex === index;

            return (
              <section
                key={index}
                className="overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm transition-shadow duration-300 hover:shadow-[0_12px_36px_-12px_rgba(15,23,42,0.12)]"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? -1 : index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50/60"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      aria-hidden="true"
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-1 ring-white/60 transition-colors ${
                        ready
                          ? "bg-gradient-to-br from-emerald-100 to-sky-100 text-emerald-800"
                          : "bg-gradient-to-br from-amber-100 to-rose-100 text-amber-800"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-slate-900">
                        Item {index + 1}
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-slate-500">
                        {itemPreview(row, fields)}
                      </span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        ready ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {ready ? "Ready" : "Needs fields"}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`text-slate-400 transition-transform duration-300 ${
                        open ? "rotate-180" : ""
                      }`}
                    >
                      ▾
                    </span>
                  </span>
                </button>

                {open ? (
                  <div className="space-y-6 border-t border-slate-100 px-5 py-6 sm:px-6">
                    {(() => {
                      const { isGrouped, groups } = groupFields(fields);
                      if (isGrouped) {
                        return groups.map((group) => (
                          <div key={group.title} className={`rounded-2xl border p-5 ${group.color}`}>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4">
                              {group.title}
                            </h4>
                            <div className="space-y-4">
                              {group.fields.map((field) => (
                                <div key={field.name}>
                                  <label
                                    className="block text-xs font-medium uppercase tracking-wide text-slate-600"
                                    htmlFor={`${field.name}-${index}`}
                                  >
                                    {field.label}
                                    {field.required ? (
                                      <span className="ml-1.5 normal-case tracking-normal text-rose-500 font-semibold">
                                        * required
                                      </span>
                                    ) : null}
                                  </label>
                                  {field.description ? (
                                    <p className="mt-0.5 text-xs text-slate-400">{field.description}</p>
                                  ) : null}
                                  <div className="mt-1.5">
                                    {field.type === "textarea" ? (
                                      <textarea
                                        id={`${field.name}-${index}`}
                                        rows={3}
                                        placeholder={field.placeholder}
                                        value={row[field.name] ?? ""}
                                        onChange={(event) =>
                                          updateCell(index, field.name, event.target.value)
                                        }
                                        className={`${inputClass} !rounded-xl bg-white`}
                                      />
                                    ) : field.type === "select" ? (
                                      <select
                                        id={`${field.name}-${index}`}
                                        value={row[field.name] ?? ""}
                                        onChange={(event) =>
                                          updateCell(index, field.name, event.target.value)
                                        }
                                        className={`${inputClass} !rounded-xl bg-white`}
                                      >
                                        <option value="">Select option…</option>
                                        {field.options.map((option) => (
                                          <option key={option} value={option}>
                                            {option}
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      <input
                                        id={`${field.name}-${index}`}
                                        type={field.type === "number" ? "number" : "text"}
                                        placeholder={field.placeholder}
                                        value={row[field.name] ?? ""}
                                        onChange={(event) =>
                                          updateCell(index, field.name, event.target.value)
                                        }
                                        className={`${inputClass} !rounded-xl bg-white`}
                                      />
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ));
                      }

                      return fields.map((field) => (
                        <div key={field.name}>
                          <label
                            className="block text-xs font-medium uppercase tracking-wide text-slate-500"
                            htmlFor={`${field.name}-${index}`}
                          >
                            {field.label}
                            {field.required ? (
                              <span className="ml-1.5 normal-case tracking-normal text-slate-400">
                                · required
                              </span>
                            ) : null}
                          </label>
                          {field.description ? (
                            <p className="mt-0.5 text-xs text-slate-400">{field.description}</p>
                          ) : null}
                          <div className="mt-2">
                            {field.type === "textarea" ? (
                              <textarea
                                id={`${field.name}-${index}`}
                                rows={3}
                                placeholder={field.placeholder}
                                value={row[field.name] ?? ""}
                                onChange={(event) =>
                                  updateCell(index, field.name, event.target.value)
                                }
                                className={`${inputClass} !rounded-2xl`}
                              />
                            ) : field.type === "select" ? (
                              <select
                                id={`${field.name}-${index}`}
                                value={row[field.name] ?? ""}
                                onChange={(event) =>
                                  updateCell(index, field.name, event.target.value)
                                }
                                className={`${inputClass} !rounded-2xl`}
                              >
                                <option value="">Select</option>
                                {field.options.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                id={`${field.name}-${index}`}
                                type={field.type === "number" ? "number" : "text"}
                                placeholder={field.placeholder}
                                value={row[field.name] ?? ""}
                                onChange={(event) =>
                                  updateCell(index, field.name, event.target.value)
                                }
                                className={`${inputClass} !rounded-2xl`}
                              />
                            )}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                ) : null}
              </section>
            );
          })}

          {/* Notes + files */}
          <section className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
            <label
              className="block text-xs font-medium uppercase tracking-wide text-slate-500"
              htmlFor="notes"
            >
              Notes
            </label>
            <p className="mt-0.5 text-xs text-slate-400">
              Optional context for whoever reads this submission later.
            </p>
            <textarea
              id="notes"
              rows={4}
              value={notes}
              onChange={(event) => {
                setNotice("");
                setNotes(event.target.value);
              }}
              className={`${inputClass} !rounded-2xl`}
            />

            <div className="mt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Supporting files
              </p>
              <label
                htmlFor="files"
                className="mt-2 flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white/40 px-4 py-6 text-center transition-colors hover:border-slate-400 hover:bg-slate-50/70"
              >
                <span className="text-sm font-medium text-slate-900">Choose files</span>
                <span className="mt-1 text-xs text-slate-500">
                  PDF, Word, Excel, text, CSV, PNG, or JPEG. Several files can sit on this one
                  submission.
                </span>
                <input
                  id="files"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xlsx,.txt,.csv,.png,.jpg,.jpeg"
                  onChange={handleFiles}
                  className="sr-only"
                />
              </label>
              {submission.files.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {submission.files.map((file) => (
                    <li
                      key={file.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white/60 px-4 py-2.5 text-sm transition-colors hover:border-slate-200"
                    >
                      <button
                        type="button"
                        onClick={() => handleDownload(file)}
                        className="min-w-0 truncate text-left font-medium text-slate-900 transition-colors hover:text-slate-700"
                      >
                        {file.originalName}
                        <span className="ml-2 font-normal text-slate-400">
                          ({Math.ceil(file.size / 1024)} KB)
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(file.id)}
                        className="shrink-0 rounded-full border border-rose-200 bg-rose-50/60 px-3 py-1 text-xs font-medium text-rose-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-50 hover:shadow-sm"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>

          <ReviewHistory reviews={submission.reviews} />

          {/* Sticky action bar */}
          <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/60 bg-white/80 px-5 py-3.5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur">
            <p className="text-sm text-slate-600">
              {expired && !revising
                ? "The deadline has passed. This draft can be saved, but it can no longer be submitted."
                : `${readyCount} of ${rows.length} ready to ${revising ? "resubmit" : "submit"}`}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={saving || sending}
                className={`${secondaryButtonClass} !rounded-full disabled:hover:translate-y-0 disabled:hover:shadow-none`}
              >
                {saving ? "Saving…" : revising ? "Save changes" : "Save draft"}
              </button>
              <button
                type="button"
                disabled={saving || sending || (expired && !revising)}
                onClick={handleSubmit}
                className={`${primaryButtonClass} !rounded-full !shadow-[0_8px_24px_-8px_rgba(15,23,42,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-8px_rgba(15,23,42,0.6)] disabled:hover:translate-y-0 disabled:hover:shadow-[0_8px_24px_-8px_rgba(15,23,42,0.5)]`}
              >
                {sending ? "Submitting…" : revising ? "Resubmit" : "Submit"}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
