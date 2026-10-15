import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ContributorForm, type ContributorFormValues } from "../../components/ContributorForm";
import { isContributorRole, isSubject, isVerificationStatus } from "../../constants/contributors";
import { createContributor } from "../../services/contributorService";

const emptyValues: ContributorFormValues = {
  name: "",
  email: "",
  password: "",
  contributorRole: "",
  subject: "",
  academicVerificationStatus: "PENDING",
  isActive: true,
};

export function AddContributorPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(values: ContributorFormValues) {
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
      const data = await createContributor({
        name: values.name,
        email: values.email,
        password: values.password,
        contributorRole: values.contributorRole,
        subject: values.subject,
        academicVerificationStatus: values.academicVerificationStatus,
        isActive: values.isActive,
      });
      navigate(`/admin/contributors/${data.contributor.id}`, { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to create contributor");
    } finally {
      setSubmitting(false);
    }
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
          to="/admin/contributors"
          className="inline-flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-slate-900"
        >
          ← Back to contributors
        </Link>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Add contributor
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
          Create an account, assign a work role and subject, and set the initial verification
          status. Only active accounts can sign in.
        </p>
      </div>

      <ContributorForm
        mode="create"
        initialValues={emptyValues}
        submitting={submitting}
        error={error}
        cancelTo="/admin/contributors"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
