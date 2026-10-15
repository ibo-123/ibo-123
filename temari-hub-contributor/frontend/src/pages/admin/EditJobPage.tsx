import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { JobForm } from "../../components/JobForm";
import type { JobFormValues } from "../../components/JobForm";
import { canEditJob, toDateInputValue } from "../../constants/jobs";
import { getJob, updateJob } from "../../services/jobService";
import type { Job } from "../../types";
import { buildJobInput } from "../../utils/jobInput";

function BackToJobs({ message }: { message: string }) {
  return (
    <section className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
      <p className="text-red-500">{message}</p>
      <Link
        to="/admin/jobs"
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-slate-700 transition-colors hover:text-slate-900"
      >
        ← Back to jobs
      </Link>
    </section>
  );
}

export function EditJobPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!id) {
      return;
    }

    let cancelled = false;

    getJob(id)
      .then((data) => {
        if (!cancelled) {
          setJob(data.job);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Unable to load job");
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

  async function handleSubmit(values: JobFormValues) {
    if (!id) {
      return;
    }

    const input = buildJobInput(values);
    if (typeof input === "string") {
      setError(input);
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const data = await updateJob(id, input);
      navigate(`/admin/jobs/${data.job.id}`, { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to update job");
    } finally {
      setSubmitting(false);
    }
  }

  if (!id) {
    return <BackToJobs message="Invalid job ID" />;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-3xl border border-white/60 bg-white/70 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
        <p className="text-sm text-slate-500">Loading job…</p>
      </div>
    );
  }

  if (loadError || !job) {
    return <BackToJobs message={loadError || "Job not found"} />;
  }

  if (!canEditJob(job.status)) {
    return (
      <BackToJobs
        message={`${job.status === "CANCELLED" ? "Cancelled" : "Completed"} jobs cannot be edited`}
      />
    );
  }

  const initialValues: JobFormValues = {
    title: job.title,
    description: job.description,
    requirements: job.requirements,
    subject: job.subject,
    topic: job.topic,
    quantity: String(job.quantity),
    difficulty: job.difficulty,
    deadline: toDateInputValue(job.deadline),
    instructions: job.instructions,
    contributor: job.contributor?.id ?? "",
    status: job.status,
    template: job.template?.id ?? "",
  };

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
          to={`/admin/jobs/${id}`}
          className="inline-flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-slate-900"
        >
          ← Back to job
        </Link>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Edit job
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
          Update the assignment details. Changes apply to the job itself — any work already
          submitted keeps its own record.
        </p>
      </div>

      <JobForm
        mode="edit"
        initialValues={initialValues}
        currentStatus={job.status}
        submitting={submitting}
        error={error}
        cancelTo={`/admin/jobs/${id}`}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
