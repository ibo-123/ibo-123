import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TemplateForm } from "../../components/TemplateForm";
import type { TemplateFormValues } from "../../utils/templateInput";
import { buildTemplateInput, emptyField } from "../../utils/templateInput";
import { createTemplate } from "../../services/templateService";

const emptyValues: TemplateFormValues = {
  name: "",
  description: "",
  subject: "",
  type: "",
  isActive: true,
  fields: [emptyField()],
};

export function AddTemplatePage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(values: TemplateFormValues) {
    const input = buildTemplateInput(values);
    if (typeof input === "string") {
      setError(input);
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const data = await createTemplate(input);
      navigate(`/admin/templates/${data.template.id}`, { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to create template");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-200/40 via-sky-200/40 to-emerald-200/40 blur-3xl"
      />

      {/* Header */}
      <div className="mb-6">
        <Link
          to="/admin/templates"
          className="inline-flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-slate-900"
        >
          ← Back to templates
        </Link>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Create template
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
          A template is the structure of a submission. Jobs keep a copy, so later edits do not
          rewrite work already assigned.
        </p>
      </div>

      <TemplateForm
        mode="create"
        initialValues={emptyValues}
        submitting={submitting}
        error={error}
        cancelTo="/admin/templates"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
