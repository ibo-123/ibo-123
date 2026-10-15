import { useState, useEffect, useCallback } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Icon } from '../../components/Icons';
import { StatusBadge } from '../../components/StatusBadge';
import { Alert, LoadingState, PageHeader } from '../../components/ui';
import { inputClass } from '../../components/formStyles';
import { SUBJECTS, subjectLabel, type Subject } from '../../constants/contributors';
import { submissionStatusLabel } from '../../constants/templates';
import {
  createTopicResource,
  downloadSubmissionFile,
  getSubmission,
  updateTopicResource,
} from '../../services/submissionService';
import { listTopics } from '../../services/topicService';
import type { Submission, TopicItem, SubmissionFile } from '../../types';

interface FileWithOrder {
  id: string;
  file?: File;
  existing?: SubmissionFile;
  name: string;
  size: number;
  type: string;
}

export function TopicResourceSubmissionPage() {
  const { submissionId } = useParams<{ submissionId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialSubject = (searchParams.get('subject') as Subject) || 'MATHEMATICS';
  const initialTopic = searchParams.get('topic') || '';
  const jobId = searchParams.get('jobId') || undefined;

  // Form State
  const [subject, setSubject] = useState<Subject>(initialSubject);
  const [topic, setTopic] = useState<string>(initialTopic);
  const [customTopic, setCustomTopic] = useState(false);
  const [resourceName, setResourceName] = useState('');
  const [pageFrom, setPageFrom] = useState<number | ''>('');
  const [pageTo, setPageTo] = useState<number | ''>('');
  const [prerequisites, setPrerequisites] = useState<string[]>([]);
  const [newPrereq, setNewPrereq] = useState('');
  const [inputTypeMode, setInputTypeMode] = useState<'text' | 'file'>('text');
  const [rawContent, setRawContent] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileWithOrder[]>([]);

  // Async & UI State
  const [availableTopics, setAvailableTopics] = useState<TopicItem[]>([]);
  const [existingSubmission, setExistingSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(Boolean(submissionId));
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [editingRevision, setEditingRevision] = useState(false);

  // Load available topics whenever subject changes
  const loadTopics = useCallback(async (selectedSubject: Subject) => {
    setTopicsLoading(true);
    try {
      const res = await listTopics(selectedSubject);
      setAvailableTopics(res.topics || []);
    } catch {
      setAvailableTopics([]);
    } finally {
      setTopicsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTopics(subject);
  }, [subject, loadTopics]);

  // Load existing submission if submissionId is given
  useEffect(() => {
    if (!submissionId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    getSubmission(submissionId)
      .then((res) => {
        if (cancelled) return;
        const sub = res.submission;
        setExistingSubmission(sub);

        if (sub.topicResource) {
          setSubject(sub.topicResource.subject);
          setTopic(sub.topicResource.topic);
          setResourceName(sub.topicResource.resourceName);
          setPageFrom(sub.topicResource.pageFrom ?? '');
          setPageTo(sub.topicResource.pageTo ?? '');
          setPrerequisites(sub.topicResource.prerequisites || []);
          setRawContent(sub.topicResource.rawContent || '');
          if (sub.topicResource.inputType === 'TEXT') {
            setInputTypeMode('text');
          } else {
            setInputTypeMode('file');
          }
        }
        setNotes(sub.notes || '');

        if (sub.files && sub.files.length > 0) {
          setSelectedFiles(
            sub.files.map((f, i) => ({
              id: f.id || `file-${i}`,
              existing: f,
              name: f.originalName,
              size: f.size,
              type: f.mimeType,
            })),
          );
        }

        if (sub.status === 'REVISION_REQUIRED') {
          setEditingRevision(true);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load submission');
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
  }, [submissionId]);

  // Add / remove prerequisites
  function handleAddPrerequisite(nameToAdd: string) {
    const clean = nameToAdd.trim();
    if (!clean) return;
    if (prerequisites.some((p) => p.toLowerCase() === clean.toLowerCase())) {
      return;
    }
    setPrerequisites((prev) => [...prev, clean]);
    setNewPrereq('');
  }

  function handleRemovePrerequisite(index: number) {
    setPrerequisites((prev) => prev.filter((_, i) => i !== index));
  }

  // File selection
  function handleFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    e.target.value = '';

    const newItems: FileWithOrder[] = files.map((file, idx) => ({
      id: `new-${Date.now()}-${idx}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
    }));

    setSelectedFiles((prev) => [...prev, ...newItems]);
  }

  function handleRemoveFile(id: string) {
    setSelectedFiles((prev) => prev.filter((item) => item.id !== id));
  }

  function handleMoveFile(index: number, direction: -1 | 1) {
    setSelectedFiles((prev) => {
      const nextIdx = index + direction;
      if (nextIdx < 0 || nextIdx >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(index, 1);
      copy.splice(nextIdx, 0, moved);
      return copy;
    });
  }

  // Validation
  function validateForm(): string | null {
    if (!subject) return 'Subject is required.';
    if (!topic.trim()) return 'Topic is required.';
    if (!resourceName.trim()) return 'Resource Name is required.';
    if (pageFrom === '' || Number(pageFrom) < 1) return 'Page From must be a whole number ≥ 1.';
    if (pageTo === '' || Number(pageTo) < Number(pageFrom)) {
      return 'Page To must be a whole number ≥ Page From.';
    }

    const hasText = rawContent.trim().length > 0;
    const hasFiles = selectedFiles.length > 0;

    if (!hasText && !hasFiles) {
      return 'Provide at least one resource input: either typed text or an uploaded file.';
    }

    return null;
  }

  // Handle Form Submit
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('subject', subject);
      formData.append('topic', topic.trim());
      formData.append('resourceName', resourceName.trim());
      formData.append('pageFrom', String(pageFrom));
      formData.append('pageTo', String(pageTo));
      formData.append('prerequisites', JSON.stringify(prerequisites));
      formData.append('rawContent', rawContent.trim());
      formData.append('notes', notes.trim());
      if (jobId) {
        formData.append('jobId', jobId);
      }

      // Append new files
      selectedFiles.forEach((item) => {
        if (item.file) {
          formData.append('files', item.file);
        }
      });

      if (existingSubmission && editingRevision) {
        formData.append('submitNow', 'true');
        const res = await updateTopicResource(existingSubmission.id, formData);
        setExistingSubmission(res.submission);
        setEditingRevision(false);
        setSuccessNotice('Revision submitted successfully! It has been returned to the admin review queue.');
      } else {
        const res = await createTopicResource(formData);
        setExistingSubmission(res.submission);
        setSuccessNotice('Topic Resource submitted successfully! It is now waiting for administrator review.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit Topic Resource');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/60 bg-white/70 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
        <LoadingState>Loading resource submission…</LoadingState>
      </div>
    );
  }

  const isReadOnly =
    existingSubmission &&
    existingSubmission.status !== 'DRAFT' &&
    existingSubmission.status !== 'REVISION_REQUIRED' &&
    !editingRevision;

  const isRevisionRequired = existingSubmission?.status === 'REVISION_REQUIRED';
  const latestFeedback = existingSubmission?.reviews?.slice(-1)[0]?.feedback;

  return (
    <div className="relative space-y-6">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-sky-200/40 via-violet-200/40 to-amber-200/40 blur-3xl"
      />

      <PageHeader
        eyebrow={
          <div className="flex items-center gap-2">
            <Link to="/contributor/submissions" className="hover:underline text-slate-500">
              ← Submissions
            </Link>
            {existingSubmission ? <span>• Submission #{existingSubmission.id.slice(-6)}</span> : null}
          </div>
        }
        title={
          existingSubmission
            ? `Topic Resource: ${existingSubmission.topicResource?.resourceName || 'Resource'}`
            : 'Submit Topic Resource'
        }
        description="Submit supplementary topic learning resources, worked examples, and reference material for students."
        action={
          existingSubmission ? (
            <div className="flex items-center gap-2">
              <StatusBadge label={submissionStatusLabel(existingSubmission.status)} />
            </div>
          ) : null
        }
      />

      {/* Information Box (PART 5 Requirement) */}
      <div className="rounded-3xl border border-sky-100 bg-gradient-to-r from-sky-50/80 via-white to-sky-50/40 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">
            <Icon name="file" className="h-5 w-5" />
          </div>
          <div className="text-sm">
            <h3 className="font-semibold text-slate-900">Topic Resources</h3>
            <p className="mt-1 text-slate-600 leading-relaxed">
              Submit useful learning resources that help students understand a specific curriculum topic.
              These resources are supplementary materials and are <strong>different from the official curriculum books</strong>.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">Text</span>
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">PDF</span>
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">DOC / DOCX</span>
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">Image</span>
            </div>
          </div>
        </div>
      </div>

      {/* Revision Required Alert Banner */}
      {isRevisionRequired && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50/90 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-600 text-white">
              <Icon name="alert" className="h-5 w-5" />
            </div>
            <div className="flex-1 text-sm">
              <h3 className="font-bold text-amber-950">Revision Required</h3>
              <p className="mt-1 text-amber-900">An administrator reviewed your submission and requested adjustments:</p>
              {latestFeedback ? (
                <div className="mt-3 rounded-2xl border border-amber-200/80 bg-white/80 p-4 font-mono text-xs text-amber-950 whitespace-pre-wrap">
                  {latestFeedback}
                </div>
              ) : null}
              {!editingRevision ? (
                <button
                  type="button"
                  onClick={() => setEditingRevision(true)}
                  className="mt-4 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-700"
                >
                  Edit Submission
                </button>
              ) : (
                <p className="mt-3 text-xs font-semibold text-amber-800">
                  Editing mode active. Update the necessary fields below and click &quot;Resubmit for Review&quot;.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {error ? <Alert tone="error">{error}</Alert> : null}
      {successNotice ? <Alert tone="success">{successNotice}</Alert> : null}

      {/* If Read-only View: Show Processed & Review Details */}
      {isReadOnly && existingSubmission && existingSubmission.topicResource ? (
        <div className="space-y-6">
          <section className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-sm backdrop-blur-sm">
            <h3 className="text-base font-semibold text-slate-900">Resource Information</h3>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-xs font-medium text-slate-400">Subject</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-800">
                  {subjectLabel(existingSubmission.topicResource.subject)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-400">Topic</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-800">
                  {existingSubmission.topicResource.topic}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-400">Page Interval</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-800">
                  Pages {existingSubmission.topicResource.pageFrom} – {existingSubmission.topicResource.pageTo}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-400">Processing Status</dt>
                <dd className="mt-1">
                  <StatusBadge label={existingSubmission.topicResource.processingStatus} />
                </dd>
              </div>
            </dl>

            {/* Prerequisites */}
            <div className="mt-5 border-t border-slate-100 pt-4">
              <h4 className="text-xs font-medium text-slate-400">Prerequisites</h4>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {existingSubmission.topicResource.prerequisites &&
                existingSubmission.topicResource.prerequisites.length > 0 ? (
                  existingSubmission.topicResource.prerequisites.map((p) => (
                    <span
                      key={p}
                      className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                    >
                      {p}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">None specified</span>
                )}
              </div>
            </div>
          </section>

          {/* Extracted & Normalized Content */}
          <section className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-sm backdrop-blur-sm">
            <h3 className="text-base font-semibold text-slate-900">Normalized Resource Content</h3>
            <p className="mt-1 text-xs text-slate-500">Structured representation generated by the processing pipeline.</p>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-5 font-mono text-xs text-slate-800 whitespace-pre-wrap max-h-96 overflow-y-auto">
              {existingSubmission.topicResource.normalizedContent ||
                existingSubmission.topicResource.extractedContent ||
                existingSubmission.topicResource.rawContent ||
                'No content extracted.'}
            </div>
          </section>

          {/* Uploaded Files */}
          {existingSubmission.files && existingSubmission.files.length > 0 && (
            <section className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-sm backdrop-blur-sm">
              <h3 className="text-base font-semibold text-slate-900">Uploaded Original Files</h3>
              <ul className="mt-3 divide-y divide-slate-100">
                {existingSubmission.files.map((file) => (
                  <li key={file.id} className="flex items-center justify-between py-3 text-xs">
                    <div>
                      <p className="font-semibold text-slate-800">{file.originalName}</p>
                      <p className="text-slate-400">{Math.ceil(file.size / 1024)} KB • {file.mimeType}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadSubmissionFile(existingSubmission.id, file.id, file.originalName)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Download
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      ) : (
        /* Submission / Edit Form */
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">1. Curriculum Topic & Resource Name</h3>

            <div className="grid gap-5 sm:grid-cols-2">
              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5" htmlFor="subject">
                  Subject *
                </label>
                <select
                  id="subject"
                  value={subject}
                  onChange={(e) => {
                    const next = e.target.value as Subject;
                    setSubject(next);
                    setTopic('');
                  }}
                  className={inputClass}
                  required
                >
                  {SUBJECTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-400">Select the subject this topic belongs to.</p>
              </div>

              {/* Topic Selector / Custom input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600" htmlFor="topic">
                    Topic *
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomTopic((prev) => !prev)}
                    className="text-[11px] font-medium text-sky-600 hover:underline"
                  >
                    {customTopic ? 'Choose from curriculum topics' : '+ Enter custom topic'}
                  </button>
                </div>

                {customTopic ? (
                  <input
                    id="topic"
                    type="text"
                    placeholder="e.g. Quadratic Equations"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className={inputClass}
                    required
                  />
                ) : (
                  <select
                    id="topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className={inputClass}
                    required
                    disabled={topicsLoading}
                  >
                    <option value="">{topicsLoading ? 'Loading topics…' : 'Select a topic…'}</option>
                    {availableTopics.map((t) => (
                      <option key={t.id || t.name} value={t.name}>
                        {t.name} {t.isCurriculumStandard ? '(Standard Curriculum)' : ''}
                      </option>
                    ))}
                  </select>
                )}
                <p className="mt-1 text-[11px] text-slate-400">The specific topic covered by this resource.</p>
              </div>
            </div>

            {/* Resource Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5" htmlFor="resourceName">
                Resource Name *
              </label>
              <input
                id="resourceName"
                type="text"
                placeholder="e.g. Advanced Algebra Study Guide & Worked Examples"
                value={resourceName}
                onChange={(e) => setResourceName(e.target.value)}
                className={inputClass}
                required
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Explicitly provide the title or label for this topic resource.
              </p>
            </div>

            {/* Page Interval */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5" htmlFor="pageFrom">
                  Page From *
                </label>
                <input
                  id="pageFrom"
                  type="number"
                  min={1}
                  placeholder="e.g. 35"
                  value={pageFrom}
                  onChange={(e) => setPageFrom(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5" htmlFor="pageTo">
                  Page To *
                </label>
                <input
                  id="pageTo"
                  type="number"
                  min={typeof pageFrom === 'number' ? pageFrom : 1}
                  placeholder="e.g. 48"
                  value={pageTo}
                  onChange={(e) => setPageTo(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  className={inputClass}
                  required
                />
              </div>
            </div>
          </section>

          {/* Prerequisites Section */}
          <section className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">2. Topic Prerequisites</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Identify prerequisite knowledge required for students to understand this topic (e.g. Basic Algebra, Linear Equations).
              </p>
            </div>

            {/* Added prerequisites badges */}
            <div className="flex flex-wrap gap-2 min-h-[2.5rem] items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-3">
              {prerequisites.length === 0 ? (
                <span className="text-xs text-slate-400 italic">No prerequisites added yet.</span>
              ) : (
                prerequisites.map((item, index) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-medium text-slate-800 shadow-sm"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePrerequisite(index)}
                      className="text-slate-400 hover:text-red-600 transition"
                      aria-label={`Remove prerequisite ${item}`}
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Add Prerequisite input & Quick Picks */}
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                placeholder="Type prerequisite name…"
                value={newPrereq}
                onChange={(e) => setNewPrereq(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPrerequisite(newPrereq);
                  }
                }}
                className="flex-1 min-w-[12rem] rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleAddPrerequisite(newPrereq)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
              >
                + Add Prerequisite
              </button>
            </div>

            {/* Quick add from current subject curriculum topics */}
            {availableTopics.length > 0 && (
              <div className="pt-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Quick add from curriculum:
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {availableTopics.slice(0, 8).map((t) => {
                    const alreadyAdded = prerequisites.some(
                      (p) => p.toLowerCase() === t.name.toLowerCase(),
                    );
                    if (alreadyAdded || t.name === topic) return null;

                    return (
                      <button
                        key={t.name}
                        type="button"
                        onClick={() => handleAddPrerequisite(t.name)}
                        className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
                      >
                        + {t.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* Resource Content: Text OR File Upload */}
          <section className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">3. Resource Content</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Provide the content directly as text, or upload a PDF, Word Document, or Images.
                </p>
              </div>

              {/* Mode Toggle */}
              <div className="flex rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setInputTypeMode('text')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    inputTypeMode === 'text'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Type / Paste Text
                </button>
                <button
                  type="button"
                  onClick={() => setInputTypeMode('file')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    inputTypeMode === 'file'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Upload File(s)
                </button>
              </div>
            </div>

            {inputTypeMode === 'text' ? (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5" htmlFor="rawContent">
                  Resource Content Text
                </label>
                <textarea
                  id="rawContent"
                  rows={8}
                  placeholder="Paste or type study notes, formulas, worked examples, explanations, or questions here…"
                  value={rawContent}
                  onChange={(e) => setRawContent(e.target.value)}
                  className={inputClass}
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  {rawContent.trim().length} characters • Markdown syntax is supported.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Upload Box */}
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center transition hover:border-slate-300">
                  <div className="text-3xl text-slate-400 mb-2">📁</div>
                  <p className="text-xs font-medium text-slate-700">
                    Upload your resource file (PDF, DOC, DOCX, or Images)
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Supported: PDF, DOC, DOCX, JPG, JPEG, PNG (Multiple images supported with reordering)
                  </p>
                  <label className="mt-4 cursor-pointer rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800">
                    Browse Files
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,image/png,image/jpeg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Selected Files List with Reordering */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Selected Files ({selectedFiles.length}):
                    </p>
                    <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
                      {selectedFiles.map((item, index) => (
                        <li key={item.id} className="flex items-center justify-between p-3 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">
                              {index + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                              <p className="text-[11px] text-slate-400">{Math.ceil(item.size / 1024)} KB</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {selectedFiles.length > 1 && (
                              <>
                                <button
                                  type="button"
                                  disabled={index === 0}
                                  onClick={() => handleMoveFile(index, -1)}
                                  className="rounded-lg border border-slate-200 p-1 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                                  title="Move Up"
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  disabled={index === selectedFiles.length - 1}
                                  onClick={() => handleMoveFile(index, 1)}
                                  className="rounded-lg border border-slate-200 p-1 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                                  title="Move Down"
                                >
                                  ↓
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(item.id)}
                              className="rounded-lg p-1 text-slate-400 hover:text-red-600 transition"
                              title="Remove file"
                            >
                              ✕
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Optional Contributor Notes */}
            <div className="pt-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5" htmlFor="notes">
                Contributor Notes (Optional)
              </label>
              <textarea
                id="notes"
                rows={2}
                placeholder="Any special remarks or details for the reviewer…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={inputClass}
              />
            </div>
          </section>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 rounded-3xl border border-white/60 bg-white/70 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
            <button
              type="button"
              onClick={() => navigate('/contributor/submissions')}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Processing & Submitting…</span>
                </>
              ) : editingRevision ? (
                'Resubmit Topic Resource'
              ) : (
                'Submit Topic Resource'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
