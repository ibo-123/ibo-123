import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ActivityHistory } from "../../components/ActivityHistory";
import { StatusBadge } from "../../components/StatusBadge";
import {
  accountStatusLabel,
  contributorRoleLabel,
  subjectLabel,
  verificationLabel,
} from "../../constants/contributors";
import { getContributor } from "../../services/contributorService";
import type { Contributor } from "../../types";

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white/60 p-4 transition-colors hover:border-slate-200">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-1.5 text-sm text-slate-900">{children}</dd>
    </div>
  );
}

export function ContributorProfilePage() {
  const { id } = useParams();
  const [contributor, setContributor] = useState<Contributor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      return;
    }

    let cancelled = false;

    getContributor(id)
      .then((data) => {
        if (!cancelled) {
          setContributor(data.contributor);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load contributor");
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

  if (!id) {
    return (
      <section className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
        <p className="text-red-500">Invalid contributor ID</p>
        <Link
          to="/admin/contributors"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-slate-700 transition-colors hover:text-slate-900"
        >
          ← Back to contributors
        </Link>
      </section>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-3xl border border-white/60 bg-white/70 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
        <p className="text-sm text-slate-500">Loading contributor…</p>
      </div>
    );
  }

  if (error || !contributor) {
    return (
      <section className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
        <p className="text-red-500">{error || "Contributor not found"}</p>
        <Link
          to="/admin/contributors"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-slate-700 transition-colors hover:text-slate-900"
        >
          ← Back to contributors
        </Link>
      </section>
    );
  }

  const fields = [
    { label: "Name", value: contributor.name },
    { label: "Email", value: contributor.email },
    { label: "Role", value: contributorRoleLabel(contributor.contributorRole) },
    { label: "Subject", value: subjectLabel(contributor.subject) },
    { label: "Created", value: formatTimestamp(contributor.createdAt) },
    { label: "Updated", value: formatTimestamp(contributor.updatedAt) },
  ];

  const initials = contributor.name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-sky-200/40 via-violet-200/40 to-rose-200/40 blur-3xl"
      />

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            to="/admin/contributors"
            className="inline-flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-slate-900"
          >
            ← Contributors
          </Link>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Contributor Profile
          </h2>
        </div>
        <Link
          to={`/admin/contributors/${contributor.id}/edit`}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-[0_8px_24px_-8px_rgba(15,23,42,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-[0_12px_28px_-8px_rgba(15,23,42,0.6)] focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
        >
          Edit profile
        </Link>
      </div>

      {/* Profile card */}
      <section className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm sm:p-8">
        {/* Identity block */}
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-violet-100 text-lg font-semibold text-slate-700 shadow-inner ring-1 ring-white/60">
            {initials || "?"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-medium text-slate-900">{contributor.name}</p>
            <p className="truncate text-sm text-slate-500">{contributor.email}</p>
          </div>
        </div>

        {/* Details grid */}
        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          {fields.map((field) => (
            <Field key={field.label} label={field.label}>
              {field.value}
            </Field>
          ))}

          <Field label="Account Status">
            <StatusBadge label={accountStatusLabel(contributor.isActive)} />
          </Field>

          <Field label="Academic Verification">
            <StatusBadge label={verificationLabel(contributor.academicVerificationStatus)} />
          </Field>
        </dl>
      </section>

      {/* Activity */}
      <div className="mt-6">
        <ActivityHistory entityType="Contributor" entityId={contributor.id} />
      </div>
    </div>
  );
}
