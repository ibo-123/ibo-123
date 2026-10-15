import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { JobForm } from "../../components/JobForm";
import type { JobFormValues } from "../../components/JobForm";
import { createJob } from "../../services/jobService";
import { buildJobInput } from "../../utils/jobInput";

const emptyValues: JobFormValues = {
  title: "",
  description: "",
  requirements: "",
  subject: "",
  topic: "",
  quantity: "",
  difficulty: "",
  deadline: "",
  instructions: "",
  contributor: "",
  status: "DRAFT",
  template: "",
};

export function AddJobPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(values: JobFormValues) {
    const input = buildJobInput(values);
    if (typeof input === "string") {
      setError(input);
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const data = await createJob(input);
      navigate(`/admin/jobs/${data.job.id}`, { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to create job");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-200/40 via-violet-200/40 to-sky-200/40 blur-3xl"
      />

      {/* Header */}
      <div className="mb-6">
        <Link
          to="/admin/jobs"
          className="inline-flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-slate-900"
        >
          ← Back to jobs
        </Link>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Create job
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
          Assign one contributor and one template. The template decides the fields they must submit.
        </p>
      </div>

      <JobForm
        mode="create"
        initialValues={emptyValues}
        submitting={submitting}
        error={error}
        cancelTo="/admin/jobs"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
