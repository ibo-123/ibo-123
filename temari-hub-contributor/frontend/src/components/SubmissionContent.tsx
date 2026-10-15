import type { Submission, SubmissionFile, TemplateField } from '../types';
import { submissionStatusLabel, inputTypeLabel } from '../constants/templates';
import { subjectLabel } from '../constants/contributors';
import { StatusBadge } from './StatusBadge';

function formatTimestamp(value: string | null) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function formatBytes(bytes: number) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function displayValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  return String(value);
}

function groupFields(fields: TemplateField[]) {
  const isQuestionTemplate = fields.some((f) =>
    ['question', 'stem', 'prompt', 'option_a', 'choices', 'correct_answer'].some((k) =>
      f.name.toLowerCase().includes(k),
    ),
  );

  if (!isQuestionTemplate) {
    return { isGrouped: false, groups: [{ title: 'Fields', fields }] };
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
    { title: 'Question Prompt', fields: questionFields },
    { title: 'Answer Choices & Solution Key', fields: answerFields },
    { title: 'Explanation & Steps', fields: explanationFields },
    { title: 'Details & Classification', fields: metaFields },
  ].filter((g) => g.fields.length > 0);

  return { isGrouped: true, groups };
}

export function SubmissionContent({
  submission,
  onDownload,
  downloadingId,
}: {
  submission: Submission;
  onDownload: (file: SubmissionFile) => void;
  downloadingId: string | null;
}) {
  const isTopicResource =
    submission.submissionType === 'TOPIC_RESOURCE' || Boolean(submission.topicResource);
  const topicRes = submission.topicResource;

  const fields = submission.template?.fields
    ? [...submission.template.fields].sort((left, right) => left.order - right.order)
    : [];

  const { isGrouped, groups } = groupFields(fields);

  return (
    <div className="space-y-6">
      {/* Side-by-side view for Topic Resource submissions */}
      {isTopicResource && topicRes ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left Column: Original Submission */}
          <section className="flex flex-col justify-between rounded-3xl border border-white/60 bg-white/70 p-6 shadow-sm backdrop-blur-sm">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Original Submission</h3>
                  <p className="text-xs text-slate-500">Submitted learning material</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
                  {inputTypeLabel(topicRes.inputType)}
                </span>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <dt className="font-semibold uppercase tracking-wider text-slate-400">Contributor</dt>
                  <dd className="mt-1 font-semibold text-slate-800">
                    {submission.contributor?.name || 'Unknown Contributor'}
                    {submission.contributor?.email && (
                      <span className="block text-slate-500 font-normal">{submission.contributor.email}</span>
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="font-semibold uppercase tracking-wider text-slate-400">Resource Name</dt>
                  <dd className="mt-1 font-bold text-slate-900">{topicRes.resourceName}</dd>
                </div>

                <div>
                  <dt className="font-semibold uppercase tracking-wider text-slate-400">Subject & Topic</dt>
                  <dd className="mt-1 font-medium text-slate-800">
                    <span className="font-semibold text-slate-900">{subjectLabel(topicRes.subject)}</span>
                    <span className="mx-1 text-slate-400">·</span>
                    <span>{topicRes.topic}</span>
                  </dd>
                </div>

                <div>
                  <dt className="font-semibold uppercase tracking-wider text-slate-400">Page Interval</dt>
                  <dd className="mt-1 font-semibold text-slate-800">
                    Pages {topicRes.pageFrom} – {topicRes.pageTo}
                  </dd>
                </div>

                <div className="sm:col-span-2">
                  <dt className="font-semibold uppercase tracking-wider text-slate-400">Prerequisites</dt>
                  <dd className="mt-1.5 flex flex-wrap gap-1.5">
                    {topicRes.prerequisites && topicRes.prerequisites.length > 0 ? (
                      topicRes.prerequisites.map((p) => (
                        <span
                          key={p}
                          className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-medium text-slate-700"
                        >
                          {p}
                        </span>
                      ))
                    ) : (
                      <span className="italic text-slate-400">No prerequisites specified</span>
                    )}
                  </dd>
                </div>

                {topicRes.rawContent && (
                  <div className="sm:col-span-2">
                    <dt className="font-semibold uppercase tracking-wider text-slate-400">Directly Entered Text</dt>
                    <dd className="mt-1 rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs font-mono text-slate-800 whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {topicRes.rawContent}
                    </dd>
                  </div>
                )}

                {submission.notes && (
                  <div className="sm:col-span-2">
                    <dt className="font-semibold uppercase tracking-wider text-slate-400">Contributor Notes</dt>
                    <dd className="mt-1 rounded-xl bg-slate-50 border border-slate-100 p-2.5 text-xs text-slate-700 whitespace-pre-wrap">
                      {submission.notes}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Original Files */}
            <div className="mt-6 border-t border-slate-100 pt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Attached Files ({submission.files.length})
              </h4>
              {submission.files.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No files attached (text submission)</p>
              ) : (
                <ul className="divide-y divide-slate-100 space-y-2">
                  {submission.files.map((file, idx) => (
                    <li key={file.id} className="flex items-center justify-between pt-2 text-xs">
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="font-medium text-slate-800 truncate">
                          {submission.files.length > 1 && (
                            <span className="mr-1.5 inline-block text-[10px] font-bold bg-slate-200 text-slate-700 rounded px-1">
                              #{idx + 1}
                            </span>
                          )}
                          {file.originalName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {formatBytes(file.size)} · {file.mimeType}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDownload(file)}
                        disabled={downloadingId === file.id}
                        className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
                      >
                        {downloadingId === file.id ? 'Downloading…' : 'Download File'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Right Column: Processed Content */}
          <section className="flex flex-col justify-between rounded-3xl border border-white/60 bg-white/70 p-6 shadow-sm backdrop-blur-sm">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Processed Content</h3>
                  <p className="text-xs text-slate-500">Extracted and normalized output</p>
                </div>
                <StatusBadge label={topicRes.processingStatus} />
              </div>

              {topicRes.processingStatus === 'PROCESSING_FAILED' && (
                <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900">
                  <p className="font-semibold">Text extraction failed:</p>
                  <p className="mt-1 text-rose-700">{topicRes.processingError || 'Unable to extract text from provided document.'}</p>
                  <p className="mt-2 text-rose-600">
                    Original files are safely preserved on the left. You can download and manually review the material.
                  </p>
                </div>
              )}

              {topicRes.processingStatus === 'PROCESSING' && (
                <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 flex items-center gap-2">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                  Processing files… Extracted text will appear once processing completes.
                </div>
              )}

              {/* Content Viewer */}
              <div className="flex-1 flex flex-col min-h-[300px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Normalized Content
                  </span>
                  {topicRes.normalizedContent && (
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(topicRes.normalizedContent || '')}
                      className="text-[11px] font-medium text-slate-500 hover:text-slate-800"
                    >
                      Copy Text
                    </button>
                  )}
                </div>

                <div className="flex-1 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 font-mono text-xs text-slate-800 whitespace-pre-wrap max-h-[500px] overflow-y-auto leading-relaxed select-text">
                  {topicRes.normalizedContent || topicRes.extractedContent || topicRes.rawContent || (
                    <span className="text-slate-400 font-sans italic">
                      {topicRes.processingStatus === 'PENDING' ? 'Awaiting processing…' : 'No processed content available.'}
                    </span>
                  )}
                </div>

                {topicRes.extractedContent && topicRes.extractedContent !== topicRes.normalizedContent && (
                  <details className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-xs">
                    <summary className="cursor-pointer font-medium text-slate-700">
                      View Raw Extracted Text (Pre-normalization)
                    </summary>
                    <div className="mt-2 font-mono text-[11px] text-slate-600 whitespace-pre-wrap max-h-40 overflow-y-auto bg-slate-50 p-2 rounded">
                      {topicRes.extractedContent}
                    </div>
                  </details>
                )}
              </div>
            </div>
          </section>
        </div>
      ) : (
        /* Template Submission View */
        <>
          {/* Overview Card */}
          <section className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-sm backdrop-blur-sm">
            <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Review Status</dt>
                <dd className="mt-1.5">
                  <StatusBadge label={submissionStatusLabel(submission.status)} />
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Submission Type</dt>
                <dd className="mt-1.5 text-sm font-semibold text-slate-800">
                  {submission.template?.name || 'Structured Template'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Submitted Date</dt>
                <dd className="mt-1.5 text-sm font-medium text-slate-700">{formatTimestamp(submission.submittedAt)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Version</dt>
                <dd className="mt-1.5 text-sm font-medium text-slate-700">v{submission.currentVersion || 1}</dd>
              </div>
              {submission.notes ? (
                <div className="sm:col-span-2 lg:col-span-4 border-t border-slate-100 pt-4">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Contributor Notes</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-700 bg-slate-50 rounded-xl p-3 border border-slate-100">
                    {submission.notes}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>

          {/* Template Items (Questions / Solutions / Template Resources) */}
          {fields.length > 0 && (
            <section className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-sm backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Submitted Items</h3>
                  <p className="mt-0.5 text-xs text-slate-500">{submission.items.length} items submitted</p>
                </div>
              </div>

              <div className="mt-5 space-y-6">
                {submission.items.map((item) => (
                  <article key={item.order} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h4 className="text-sm font-bold text-slate-900">Item #{item.order}</h4>
                    </div>

                    {isGrouped ? (
                      <div className="mt-4 space-y-4">
                        {groups.map((group) => (
                          <div key={group.title} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                            <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
                              {group.title}
                            </h5>
                            <dl className="space-y-3">
                              {group.fields.map((field) => (
                                <div key={field.name}>
                                  <dt className="text-xs font-medium text-slate-500">{field.label}</dt>
                                  <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-900 font-medium">
                                    {displayValue(item.values[field.name])}
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                        {fields.map((field) => (
                          <div key={field.name}>
                            <dt className="text-xs font-medium text-slate-500">{field.label}</dt>
                            <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-900">
                              {displayValue(item.values[field.name])}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Files Section */}
          <section className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-sm backdrop-blur-sm">
            <h3 className="text-base font-semibold text-slate-900">Attached Files</h3>
            {submission.files.length === 0 ? (
              <p className="mt-3 text-xs text-slate-500">No files attached to this submission.</p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-100">
                {submission.files.map((file) => (
                  <li key={file.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs">
                    <div>
                      <span className="font-semibold text-slate-800">{file.originalName}</span>
                      <span className="ml-2 text-slate-400">({formatBytes(file.size)})</span>
                    </div>
                    <button
                      type="button"
                      disabled={downloadingId === file.id}
                      onClick={() => onDownload(file)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      Download File
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
