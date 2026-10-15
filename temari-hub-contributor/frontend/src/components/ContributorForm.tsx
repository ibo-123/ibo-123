import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  CONTRIBUTOR_ROLES,
  SUBJECTS,
  VERIFICATION_STATUSES,
} from '../constants/contributors';
import { inputClass } from './formStyles';

export type ContributorFormValues = {
  name: string;
  email: string;
  password: string;
  contributorRole: string;
  subject: string;
  academicVerificationStatus: string;
  isActive: boolean;
};

const labelClass = 'mt-4 block text-sm font-medium text-slate-700';

export function ContributorForm({
  mode,
  initialValues,
  submitting,
  error,
  cancelTo,
  onSubmit,
}: {
  mode: 'create' | 'edit';
  initialValues: ContributorFormValues;
  submitting: boolean;
  error: string;
  cancelTo: string;
  onSubmit: (values: ContributorFormValues) => void;
}) {
  const [values, setValues] = useState(initialValues);

  function update<K extends keyof ContributorFormValues>(key: K, value: ContributorFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <label className={labelClass} htmlFor="name">
        Full Name
      </label>
      <input
        id="name"
        required
        value={values.name}
        onChange={(event) => update('name', event.target.value)}
        className={inputClass}
      />

      <label className={labelClass} htmlFor="email">
        Email
      </label>
      <input
        id="email"
        type="email"
        autoComplete="off"
        required
        value={values.email}
        onChange={(event) => update('email', event.target.value)}
        className={inputClass}
      />

      {mode === 'create' ? (
        <>
          <label className={labelClass} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={values.password}
            onChange={(event) => update('password', event.target.value)}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>
        </>
      ) : null}

      <label className={labelClass} htmlFor="contributorRole">
        Contributor Role
      </label>
      <select
        id="contributorRole"
        required
        value={values.contributorRole}
        onChange={(event) => update('contributorRole', event.target.value)}
        className={inputClass}
      >
        <option value="">Select a role</option>
        {CONTRIBUTOR_ROLES.map((role) => (
          <option key={role.value} value={role.value}>
            {role.label}
          </option>
        ))}
      </select>

      <label className={labelClass} htmlFor="subject">
        Subject
      </label>
      <select
        id="subject"
        required
        value={values.subject}
        onChange={(event) => update('subject', event.target.value)}
        className={inputClass}
      >
        <option value="">Select a subject</option>
        {SUBJECTS.map((subject) => (
          <option key={subject.value} value={subject.value}>
            {subject.label}
          </option>
        ))}
      </select>

      <label className={labelClass} htmlFor="verification">
        Academic Verification Status
      </label>
      <select
        id="verification"
        required
        value={values.academicVerificationStatus}
        onChange={(event) => update('academicVerificationStatus', event.target.value)}
        className={inputClass}
      >
        {VERIFICATION_STATUSES.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>

      <label className={labelClass} htmlFor="isActive">
        Active Status
      </label>
      <select
        id="isActive"
        value={values.isActive ? 'active' : 'inactive'}
        onChange={(event) => update('isActive', event.target.value === 'active')}
        className={inputClass}
      >
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Saving...' : mode === 'create' ? 'Create Contributor' : 'Save Changes'}
        </button>
        <Link
          to={cancelTo}
          className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
