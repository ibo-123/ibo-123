import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { SUBJECTS } from '../constants/contributors';
import {
  DIFFICULTIES,
  JOB_STATUSES,
  STATUS_TRANSITIONS,
  todayInputValue,
} from '../constants/jobs';
import type { JobStatus } from '../constants/jobs';
import { listContributors } from '../services/contributorService';
import { listTemplates } from '../services/templateService';
import type { Contributor, Template } from '../types';
import { inputClass } from './formStyles';

export type JobFormValues = {
  title: string;
  description: string;
  requirements: string;
  subject: string;
  topic: string;
  quantity: string;
  difficulty: string;
  deadline: string;
  instructions: string;
  contributor: string;
  status: string;
  template: string;
};

const labelClass = 'mt-4 block text-sm font-medium text-slate-700';

function statusOptions(currentStatus: JobStatus | undefined) {
  const allowed: JobStatus[] = currentStatus
    ? [currentStatus, ...STATUS_TRANSITIONS[currentStatus].filter((item) => item !== 'CANCELLED')]
    : ['DRAFT', 'ASSIGNED'];

  return JOB_STATUSES.filter((item) => allowed.includes(item.value));
}

export function JobForm({
  mode,
  initialValues,
  currentStatus,
  submitting,
  error,
  cancelTo,
  onSubmit,
}: {
  mode: 'create' | 'edit';
  initialValues: JobFormValues;
  currentStatus?: JobStatus;
  submitting: boolean;
  error: string;
  cancelTo: string;
  onSubmit: (values: JobFormValues) => void;
}) {
  const [values, setValues] = useState(initialValues);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [contributorsError, setContributorsError] = useState('');
  const [templatesError, setTemplatesError] = useState('');
  const [contributorsLoading, setContributorsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    listContributors()
      .then((data) => {
        if (!cancelled) {
          setContributors(data.contributors);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setContributorsError(err instanceof Error ? err.message : 'Unable to load contributors');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setContributorsLoading(false);
        }
      });

    listTemplates()
      .then((data) => {
        if (!cancelled) {
          setTemplates(data.templates);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setTemplatesError(err instanceof Error ? err.message : 'Unable to load templates');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Eligible: active and same subject as the job. An already-assigned
  // contributor stays visible so an edit does not silently drop them.
  const eligible = contributors.filter(
    (item) =>
      item.subject === values.subject &&
      (item.isActive || item.id === initialValues.contributor),
  );

  function update<K extends keyof JobFormValues>(key: K, value: JobFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubjectChange(subject: string) {
    setValues((current) => {
      const stillEligible = contributors.some(
        (item) => item.id === current.contributor && item.subject === subject,
      );

      const template = templates.find((item) => item.id === current.template);
      const keepTemplate = Boolean(template && template.subject === subject);

      return {
        ...current,
        subject,
        contributor: stillEligible ? current.contributor : '',
        template: keepTemplate ? current.template : '',
      };
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(values);
  }

  const contributorRequired = values.status !== 'DRAFT';
  const activeTemplates = templates.filter(
    (item) => item.isActive && item.subject === values.subject,
  );
  const selectedTemplate = templates.find((item) => item.id === values.template);
  const templateOptions =
    selectedTemplate && !activeTemplates.some((item) => item.id === selectedTemplate.id)
      ? [selectedTemplate, ...activeTemplates]
      : activeTemplates;

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <label className={labelClass} htmlFor="title">
        Title
      </label>
      <input
        id="title"
        required
        value={values.title}
        onChange={(event) => update('title', event.target.value)}
        className={inputClass}
      />

      <label className={labelClass} htmlFor="description">
        Description
      </label>
      <textarea
        id="description"
        required
        rows={3}
        value={values.description}
        onChange={(event) => update('description', event.target.value)}
        className={inputClass}
      />

      <label className={labelClass} htmlFor="requirements">
        Requirements
      </label>
      <textarea
        id="requirements"
        rows={4}
        value={values.requirements}
        onChange={(event) => update('requirements', event.target.value)}
        className={inputClass}
      />

      <div className="grid gap-x-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="subject">
            Subject
          </label>
          <select
            id="subject"
            required
            value={values.subject}
            onChange={(event) => handleSubjectChange(event.target.value)}
            className={inputClass}
          >
            <option value="">Select a subject</option>
            {SUBJECTS.map((subject) => (
              <option key={subject.value} value={subject.value}>
                {subject.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="topic">
            Topic
          </label>
          <input
            id="topic"
            required
            value={values.topic}
            onChange={(event) => update('topic', event.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="quantity">
            Quantity
          </label>
          <input
            id="quantity"
            type="number"
            required
            min={1}
            step={1}
            value={values.quantity}
            onChange={(event) => update('quantity', event.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="difficulty">
            Difficulty
          </label>
          <select
            id="difficulty"
            required
            value={values.difficulty}
            onChange={(event) => update('difficulty', event.target.value)}
            className={inputClass}
          >
            <option value="">Select difficulty</option>
            {DIFFICULTIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="deadline">
            Deadline
          </label>
          <input
            id="deadline"
            type="date"
            required
            min={mode === 'create' ? todayInputValue() : undefined}
            value={values.deadline}
            onChange={(event) => update('deadline', event.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <label className={labelClass} htmlFor="instructions">
        Instructions
      </label>
      <textarea
        id="instructions"
        required
        rows={4}
        value={values.instructions}
        onChange={(event) => update('instructions', event.target.value)}
        className={inputClass}
      />

      <label className={labelClass} htmlFor="template">
        Template
      </label>
      <select
        id="template"
        disabled={!values.subject}
        value={values.template}
        onChange={(event) => update('template', event.target.value)}
        className={`${inputClass} disabled:bg-slate-100`}
      >
        <option value="">{values.subject ? 'No template' : 'Select a subject first'}</option>
        {templateOptions.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
            {item.isActive ? '' : ' (inactive)'}
          </option>
        ))}
      </select>
      <p className="mt-1 text-xs text-slate-500">
        Only active templates for this subject can be selected. Contributors can submit structured
        work when a template is attached.
      </p>
      {templatesError ? <p className="mt-1 text-xs text-red-600">{templatesError}</p> : null}

      <label className={labelClass} htmlFor="contributor">
        Contributor
      </label>
      <select
        id="contributor"
        required={contributorRequired}
        disabled={!values.subject || contributorsLoading}
        value={values.contributor}
        onChange={(event) => update('contributor', event.target.value)}
        className={`${inputClass} disabled:bg-slate-100`}
      >
        <option value="">
          {!values.subject
            ? 'Select a subject first'
            : contributorRequired
              ? 'Select a contributor'
              : 'No contributor yet'}
        </option>
        {eligible.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name} ({item.email}){item.isActive ? '' : ' - inactive'}
          </option>
        ))}
      </select>
      {values.subject && !contributorsLoading && eligible.length === 0 ? (
        <p className="mt-1 text-xs text-slate-500">
          No active contributors are assigned to this subject.
        </p>
      ) : (
        <p className="mt-1 text-xs text-slate-500">
          Only active contributors whose subject matches the job are listed.
        </p>
      )}
      {contributorsError ? <p className="mt-1 text-xs text-red-600">{contributorsError}</p> : null}

      <label className={labelClass} htmlFor="status">
        Status
      </label>
      <select
        id="status"
        value={values.status}
        onChange={(event) => update('status', event.target.value)}
        className={inputClass}
      >
        {statusOptions(currentStatus).map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      <p className="mt-1 text-xs text-slate-500">
        Draft jobs are hidden from contributors. Choose Assigned to make the job visible to the
        selected contributor.
      </p>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Saving...' : mode === 'create' ? 'Create Job' : 'Save Changes'}
        </button>
        <Link
          to={cancelTo}
          className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back
        </Link>
      </div>
    </form>
  );
}
