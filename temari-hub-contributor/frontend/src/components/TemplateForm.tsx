import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { SUBJECTS } from '../constants/contributors';
import { FIELD_TYPES, TEMPLATE_TYPES, isFieldType } from '../constants/templates';
import { inputClass } from './formStyles';
import type { TemplateFormValues, TemplateFieldDraft } from '../utils/templateInput';
import { emptyField } from '../utils/templateInput';

const labelClass = 'block text-sm font-medium text-slate-700';

export function TemplateForm({
  mode,
  initialValues,
  submitting,
  error,
  cancelTo,
  onSubmit,
}: {
  mode: 'create' | 'edit';
  initialValues: TemplateFormValues;
  submitting: boolean;
  error: string;
  cancelTo: string;
  onSubmit: (values: TemplateFormValues) => void;
}) {
  const [values, setValues] = useState(initialValues);

  function updateField(index: number, patch: Partial<TemplateFieldDraft>) {
    setValues((current) => ({
      ...current,
      fields: current.fields.map((field, fieldIndex) =>
        fieldIndex === index ? { ...field, ...patch } : field,
      ),
    }));
  }

  function removeField(index: number) {
    setValues((current) => ({
      ...current,
      fields: current.fields.filter((_, fieldIndex) => fieldIndex !== index),
    }));
  }

  function moveField(index: number, direction: -1 | 1) {
    setValues((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.fields.length) {
        return current;
      }

      const fields = [...current.fields];
      const [moved] = fields.splice(index, 1);
      fields.splice(nextIndex, 0, moved);
      return { ...current, fields };
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <label className={labelClass} htmlFor="name">
        Name
      </label>
      <input
        id="name"
        required
        value={values.name}
        onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
        className={inputClass}
      />

      <label className={`${labelClass} mt-4`} htmlFor="description">
        Description
      </label>
      <textarea
        id="description"
        rows={3}
        value={values.description}
        onChange={(event) =>
          setValues((current) => ({ ...current, description: event.target.value }))
        }
        className={inputClass}
      />

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="subject">
            Subject
          </label>
          <select
            id="subject"
            required
            value={values.subject}
            onChange={(event) =>
              setValues((current) => ({ ...current, subject: event.target.value }))
            }
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
          <label className={labelClass} htmlFor="type">
            Type
          </label>
          <select
            id="type"
            required
            value={values.type}
            onChange={(event) => setValues((current) => ({ ...current, type: event.target.value }))}
            className={inputClass}
          >
            <option value="">Select a type</option>
            {TEMPLATE_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={values.isActive}
          onChange={(event) =>
            setValues((current) => ({ ...current, isActive: event.target.checked }))
          }
        />
        Active (available when creating or editing a job)
      </label>

      <div className="mt-8 flex items-center justify-between gap-4">
        <h3 className="text-lg font-medium text-slate-900">Fields</h3>
        <button
          type="button"
          onClick={() =>
            setValues((current) => ({ ...current, fields: [...current.fields, emptyField()] }))
          }
          className="rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Add field
        </button>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Field names use letters and numbers and must start with a letter, for example question or
        optionA. Order follows the list below.
      </p>

      <div className="mt-4 space-y-4">
        {values.fields.map((field, index) => (
          <fieldset key={index} className="rounded border border-slate-200 p-4">
            <legend className="px-1 text-sm font-medium text-slate-700">Field {index + 1}</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor={`field-label-${index}`}>
                  Label
                </label>
                <input
                  id={`field-label-${index}`}
                  required
                  value={field.label}
                  onChange={(event) => updateField(index, { label: event.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor={`field-name-${index}`}>
                  Name
                </label>
                <input
                  id={`field-name-${index}`}
                  required
                  value={field.name}
                  onChange={(event) => updateField(index, { name: event.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor={`field-type-${index}`}>
                  Type
                </label>
                <select
                  id={`field-type-${index}`}
                  required
                  value={field.type}
                  onChange={(event) =>
                    updateField(index, {
                      type: isFieldType(event.target.value) ? event.target.value : '',
                    })
                  }
                  className={inputClass}
                >
                  {FIELD_TYPES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <label className="mt-7 flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(event) => updateField(index, { required: event.target.checked })}
                />
                Required
              </label>
            </div>
            {field.type === 'select' ? (
              <div className="mt-4">
                <label className={labelClass} htmlFor={`field-options-${index}`}>
                  Options (one per line)
                </label>
                <textarea
                  id={`field-options-${index}`}
                  required
                  rows={4}
                  value={field.optionsText}
                  onChange={(event) => updateField(index, { optionsText: event.target.value })}
                  className={inputClass}
                />
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => moveField(index, -1)}
                disabled={index === 0}
                className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Move up
              </button>
              <button
                type="button"
                onClick={() => moveField(index, 1)}
                disabled={index === values.fields.length - 1}
                className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Move down
              </button>
              <button
                type="button"
                onClick={() => removeField(index)}
                className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          </fieldset>
        ))}
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Saving...' : mode === 'create' ? 'Create Template' : 'Save Changes'}
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
