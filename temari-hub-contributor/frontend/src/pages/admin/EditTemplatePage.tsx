import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { TemplateForm } from "../../components/TemplateForm";
import type { TemplateFormValues } from "../../utils/templateInput";
import { buildTemplateInput, fieldsToDrafts } from "../../utils/templateInput";
import { getTemplate, updateTemplate } from "../../services/templateService";
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

export function EditTemplatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");

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
          setLoadError(err instanceof Error ? err.message : "Unable to load template");
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

  async function handleSubmit(values: TemplateFormValues) {
    if (!id) {
      return;
    }

    const input = buildTemplateInput(values);
    if (typeof input === "string") {
      setError(input);
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const data = await updateTemplate(id, input);
      navigate(`/admin/templates/${data.template.id}`, { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to update template");
    } finally {
      setSubmitting(false);
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

  if (loadError || !template) {
    return <BackToTemplates message={loadError || "Template not found"} />;
  }

  const initialValues: TemplateFormValues = {
    name: template.name,
    description: template.description,
    subject: template.subject,
    type: template.type,
    isActive: template.isActive,
    fields: fieldsToDrafts(template.fields),
  };

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
          to={`/admin/templates/${id}`}
          className="inline-flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-slate-900"
        >
          ← Back to template
        </Link>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Edit template
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
          Update the structure contributors will fill in. Jobs already created keep their own copy.
        </p>
      </div>

      <TemplateForm
        mode="edit"
        initialValues={initialValues}
        submitting={submitting}
        error={error}
        cancelTo={`/admin/templates/${id}`}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
