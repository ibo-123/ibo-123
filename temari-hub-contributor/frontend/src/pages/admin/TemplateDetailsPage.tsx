import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { StatusBadge } from "../../components/StatusBadge";
import { subjectLabel } from "../../constants/contributors";
import { fieldTypeLabel, templateTypeLabel } from "../../constants/templates";
import { getTemplate, updateTemplateStatus } from "../../services/templateService";
import type { Template } from "../../types";

function BackToTemplates({ message }: { message: string }) {
  return (
    <section className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
      <p className="text-red-500">{message}</p>
      <Link
        to="/admin/templates"
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-slate-700 transition-colors hover:text-slate-900"
      >
        ← Back to templates
      </Link>
    </section>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-100 bg-white/60 p-4 transition-colors hover:border-slate-200 ${
        full ? "sm:col-span-2" : ""
      }`}
    >
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-1.5 text-sm text-slate-900">{children}</dd>
    </div>
  );
}

export function TemplateDetailsPage() {
  const { id } = useParams();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) {
      return;
    }

    let cancelled = false;

    getTemplate(id)
      .then((data) => {
        if (!cancelled) {
          setTemplate(data.template);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load template");
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

  async function handleStatus() {
    if (!template) {
      return;
    }

    setUpdating(true);

    try {
      const data = await updateTemplateStatus(template.id, !template.isActive);
      setTemplate(data.template);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to update template");
    } finally {
      setUpdating(false);
    }
  }

  if (!id) {
    return <BackToTemplates message="Invalid template ID" />;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-3xl border border-white/60 bg-white/70 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
        <p className="text-sm text-slate-500">Loading template…</p>
      </div>
    );
  }

  if (!template) {
    return <BackToTemplates message={error || "Template not found"} />;
  }

  return (
    <div className="relative">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-200/40 via-sky-200/40 to-emerald-200/40 blur-3xl"
      />

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            to="/admin/templates"
            className="inline-flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-slate-900"
          >
            ← Templates
          </Link>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {template.name}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/admin/templates/${template.id}/edit`}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-[0_8px_24px_-8px_rgba(15,23,42,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-[0_12px_28px_-8px_rgba(15,23,42,0.6)] focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
          >
            Edit template
          </Link>
          <button
            type="button"
            disabled={updating}
            onClick={handleStatus}
            className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60 ${
              template.isActive
                ? "border-rose-200 bg-rose-50/60 text-rose-600 hover:-translate-y-0.5 hover:bg-rose-50 hover:shadow-sm"
                : "border-emerald-200 bg-emerald-50/60 text-emerald-600 hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-sm"
            }`}
          >
            {updating ? "Updating…" : template.isActive ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-100 bg-rose-50/70 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      ) : null}

      {/* Details card */}
      <section className="max-w-3xl rounded-3xl border border-white/60 bg-white/70 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm sm:p-8">
        <dl className="grid gap-3 sm:grid-cols-2">
          <Field label="Description" full>
            <span className="whitespace-pre-wrap">{template.description || "None"}</span>
          </Field>
          <Field label="Subject">{subjectLabel(template.subject)}</Field>
          <Field label="Type">{templateTypeLabel(template.type)}</Field>
          <Field label="Status">
            <StatusBadge label={template.isActive ? "Active" : "Inactive"} />
          </Field>
          <Field label="Version">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              v{template.version}
            </span>
          </Field>
        </dl>

        {/* Fields */}
        <div className="mt-8 flex items-center justify-between">
          <h3 className="text-lg font-medium tracking-tight text-slate-900">Fields</h3>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            {template.fields.length} {template.fields.length === 1 ? "field" : "fields"}
          </span>
        </div>

        <ol className="mt-4 space-y-3">
          {template.fields.map((field) => (
            <li
              key={field.name}
              className="group rounded-2xl border border-slate-100 bg-white/60 p-4 text-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-[0_8px_24px_-12px_rgba(15,23,42,0.12)]"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-sky-100 text-xs font-semibold text-slate-700 ring-1 ring-white/60">
                  {field.order}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">{field.label}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                    <span className="font-mono text-slate-600">{field.name}</span>
                    <span className="text-slate-300">·</span>
                    <span>{fieldTypeLabel(field.type)}</span>
                    <span className="text-slate-300">·</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        field.required
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {field.required ? "Required" : "Optional"}
                    </span>
                  </div>
                  {field.options.length > 0 ? (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {field.options.map((option) => (
                        <span
                          key={option}
                          className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600"
                        >
                          {option}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
