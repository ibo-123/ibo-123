import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ContributorForm, type ContributorFormValues } from "../../components/ContributorForm";
import { isContributorRole, isSubject, isVerificationStatus } from "../../constants/contributors";
import { getContributor, updateContributor } from "../../services/contributorService";

function BackToContributors({ message }: { message: string }) {
  return (
    <section className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
      <p className="text-red-500">{message}</p>
      <Link
        to="/admin/contributors"
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-slate-700 transition-colors hover:text-slate-900"
      >
        ← Back to contributors
      </Link>
    </section>
  );
}

export function EditContributorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initialValues, setInitialValues] = useState<ContributorFormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!id) {
      return;
    }

    let cancelled = false;

    getContributor(id)
      .then((data) => {
        if (cancelled) {
          return;
        }

        setInitialValues({
          name: data.contributor.name,
          email: data.contributor.email,
          password: "",
          contributorRole: data.contributor.contributorRole ?? "",
          subject: data.contributor.subject ?? "",
          academicVerificationStatus: data.contributor.academicVerificationStatus ?? "PENDING",
          isActive: data.contributor.isActive,
        });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Unable to load contributor");
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

  async function handleSubmit(values: ContributorFormValues) {
    if (!id) {
      return;
    }

    if (
      !isContributorRole(values.contributorRole) ||
      !isSubject(values.subject) ||
      !isVerificationStatus(values.academicVerificationStatus)
    ) {
      setError("Choose a valid role, subject, and verification status");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const data = await updateContributor(id, {
        name: values.name,
        email: values.email,
        contributorRole: values.contributorRole,
        subject: values.subject,
        academicVerificationStatus: values.academicVerificationStatus,
        isActive: values.isActive,
      });
      navigate(`/admin/contributors/${data.contributor.id}`, { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to update contributor");
    } finally {
      setSubmitting(false);
    }
  }

  if (!id) {
    return <BackToContributors message="Invalid contributor ID" />;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-3xl border border-white/60 bg-white/70 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
        <p className="text-sm text-slate-500">Loading contributor…</p>
      </div>
    );
  }

  if (loadError || !initialValues) {
    return <BackToContributors message={loadError || "Contributor not found"} />;
  }

  return (
    <div className="relative">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-sky-200/40 via-violet-200/40 to-rose-200/40 blur-3xl"
      />

      {/* Header */}
      <div className="mb-6">
        <Link
          to={`/admin/contributors/${id}`}
          className="inline-flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-slate-900"
        >
          ← Back to profile
        </Link>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Edit contributor
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
          Update this person's role, subject, and verification. Changing the subject affects the
          templates and jobs they can be assigned to.
        </p>
      </div>

      <ContributorForm
        mode="edit"
        initialValues={initialValues}
        submitting={submitting}
        error={error}
        cancelTo={`/admin/contributors/${id}`}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
