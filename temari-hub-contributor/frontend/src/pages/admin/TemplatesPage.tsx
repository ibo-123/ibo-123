import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StatusBadge } from "../../components/StatusBadge";
import { Alert, EmptyState, LoadingState, PageHeader } from "../../components/ui";
import { primaryButtonClass } from "../../components/formStyles";
import { subjectLabel } from "../../constants/contributors";
import { templateTypeLabel } from "../../constants/templates";
import { listTemplates, updateTemplateStatus } from "../../services/templateService";
import type { Template } from "../../types";

export function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    listTemplates()
      .then((data) => {
        if (!cancelled) {
          setTemplates(data.templates);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load templates");
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

  async function handleStatus(template: Template) {
    setError("");
    setUpdatingId(template.id);

    try {
      const data = await updateTemplateStatus(template.id, !template.isActive);
      setTemplates((current) =>
        current.map((item) => (item.id === data.template.id ? data.template : item)),
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to update template");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="relative">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-200/40 via-sky-200/40 to-emerald-200/40 blur-3xl"
      />

      <PageHeader
        title="Templates"
        description="A template is the structure of a submission. Jobs keep a copy, so later edits do not rewrite work already assigned."
        action={
          <Link
            to="/admin/templates/new"
            className={`${primaryButtonClass} !rounded-full !shadow-[0_8px_24px_-8px_rgba(15,23,42,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-8px_rgba(15,23,42,0.6)]`}
          >
            Create template
          </Link>
        }
      />

      {error ? <Alert>{error}</Alert> : null}

      <section className="overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
        {loading ? (
          <LoadingState>Loading templates…</LoadingState>
        ) : templates.length === 0 ? (
          <EmptyState title="No templates yet">
            Create one before you ask contributors to submit structured work.
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Name</th>
                  <th className="px-5 py-3.5 font-medium">Subject</th>
                  <th className="px-5 py-3.5 font-medium">Type</th>
                  <th className="px-5 py-3.5 font-medium">Fields</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => (
                  <tr
                    key={template.id}
                    className="group border-b border-slate-100/80 transition-colors last:border-0 hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4">
                      <Link
                        to={`/admin/templates/${template.id}`}
                        className="font-medium text-slate-900 transition-colors group-hover:text-slate-950 hover:text-slate-700"
                      >
                        {template.name}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{subjectLabel(template.subject)}</td>
                    <td className="px-5 py-4 text-slate-600">{templateTypeLabel(template.type)}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        {template.fields.length}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge label={template.isActive ? "Active" : "Inactive"} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/admin/templates/${template.id}/edit`}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-900 hover:shadow-sm"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          disabled={updatingId === template.id}
                          onClick={() => handleStatus(template)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                            template.isActive
                              ? "border-rose-200 bg-rose-50/60 text-rose-600 hover:-translate-y-0.5 hover:bg-rose-50 hover:shadow-sm"
                              : "border-emerald-200 bg-emerald-50/60 text-emerald-600 hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-sm"
                          }`}
                        >
                          {updatingId === template.id
                            ? "Updating…"
                            : template.isActive
                              ? "Deactivate"
                              : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
