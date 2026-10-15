import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StatusBadge } from "../../components/StatusBadge";
import { Alert, EmptyState, LoadingState, PageHeader } from "../../components/ui";
import { primaryButtonClass } from "../../components/formStyles";
import {
  accountStatusLabel,
  contributorRoleLabel,
  subjectLabel,
  verificationLabel,
} from "../../constants/contributors";
import { updateContributorStatus, listContributors } from "../../services/contributorService";
import type { Contributor } from "../../types";

function initialsFrom(name: string | undefined) {
  if (!name) {
    return "?";
  }
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ContributorsPage() {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    listContributors()
      .then((data) => {
        if (!cancelled) {
          setContributors(data.contributors);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load contributors");
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

  async function handleStatusToggle(contributor: Contributor) {
    setError("");
    setUpdatingId(contributor.id);

    try {
      const data = await updateContributorStatus(contributor.id, !contributor.isActive);
      setContributors((current) =>
        current.map((item) => (item.id === data.contributor.id ? data.contributor : item)),
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to update status");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="relative">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-sky-200/40 via-violet-200/40 to-rose-200/40 blur-3xl"
      />

      <PageHeader
        title="Contributors"
        description="Each contributor has one work role and one subject. Only active accounts can sign in."
        action={
          <Link
            to="/admin/contributors/new"
            className={`${primaryButtonClass} !rounded-full !shadow-[0_8px_24px_-8px_rgba(15,23,42,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-8px_rgba(15,23,42,0.6)]`}
          >
            Add contributor
          </Link>
        }
      />

      {error ? <Alert>{error}</Alert> : null}

      <section className="overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
        {loading ? (
          <LoadingState>Loading contributors…</LoadingState>
        ) : contributors.length === 0 ? (
          <EmptyState title="No contributors yet">
            Add a contributor before assigning a job.
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Name</th>
                  <th className="px-5 py-3.5 font-medium">Email</th>
                  <th className="px-5 py-3.5 font-medium">Role</th>
                  <th className="px-5 py-3.5 font-medium">Subject</th>
                  <th className="px-5 py-3.5 font-medium">Account</th>
                  <th className="px-5 py-3.5 font-medium">Verification</th>
                  <th className="px-5 py-3.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contributors.map((contributor) => (
                  <tr
                    key={contributor.id}
                    className="group border-b border-slate-100/80 transition-colors last:border-0 hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-violet-100 text-[11px] font-semibold text-slate-700 ring-1 ring-white/60"
                        >
                          {initialsFrom(contributor.name)}
                        </span>
                        <Link
                          to={`/admin/contributors/${contributor.id}`}
                          className="font-medium text-slate-900 transition-colors group-hover:text-slate-950 hover:text-slate-700"
                        >
                          {contributor.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{contributor.email}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {contributorRoleLabel(contributor.contributorRole)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        {subjectLabel(contributor.subject)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge label={accountStatusLabel(contributor.isActive)} />
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge
                        label={verificationLabel(contributor.academicVerificationStatus)}
                      />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2 whitespace-nowrap">
                        <Link
                          to={`/admin/contributors/${contributor.id}`}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-900 hover:shadow-sm"
                        >
                          View
                        </Link>
                        <Link
                          to={`/admin/contributors/${contributor.id}/edit`}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-900 hover:shadow-sm"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          disabled={updatingId === contributor.id}
                          onClick={() => handleStatusToggle(contributor)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                            contributor.isActive
                              ? "border-rose-200 bg-rose-50/60 text-rose-600 hover:-translate-y-0.5 hover:bg-rose-50 hover:shadow-sm"
                              : "border-emerald-200 bg-emerald-50/60 text-emerald-600 hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-sm"
                          }`}
                        >
                          {updatingId === contributor.id
                            ? "Updating…"
                            : contributor.isActive
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
