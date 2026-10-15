import { Link } from "react-router-dom";
import { Icon, type IconName } from "../../components/Icons";
import { useAuth } from "../../context/AuthContext";

const actions = [
  {
    to: "/admin/contributors",
    title: "Contributors",
    text: "Create accounts, assign a subject, and activate or deactivate people.",
    icon: "users" as IconName,
  },
  {
    to: "/admin/templates",
    title: "Templates",
    text: "Define the fields contributors must fill when they submit work.",
    icon: "layers" as IconName,
  },
  {
    to: "/admin/jobs",
    title: "Jobs",
    text: "Assign work, choose a template, and set the quantity and deadline.",
    icon: "briefcase" as IconName,
  },
  {
    to: "/admin/submissions",
    title: "Submissions",
    text: "Review submitted work, request a revision, approve it, or reject it.",
    icon: "inbox" as IconName,
  },
  {
    to: "/admin/content",
    title: "Content ready",
    text: "Export the approved version for handoff to the main platform.",
    icon: "check" as IconName,
  },
  {
    to: "/admin/activity",
    title: "Activity",
    text: "See who assigned work, submitted it, requested a revision, or approved it.",
    icon: "activity" as IconName,
  },
];

export function AdminDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="relative">
      {/* Soft background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-sky-200/40 via-violet-200/40 to-rose-200/40 blur-3xl"
      />

      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Admin</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Welcome back, {user?.name}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Review submitted work, then mark the approved version content ready so it can be exported.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {actions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Icon name={action.icon} className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-900">{action.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">{action.text}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
