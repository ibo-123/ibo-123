const tones: Record<string, string> = {
  // Account & Contributor
  Active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Inactive: 'bg-slate-200 text-slate-700 border-slate-300',
  Pending: 'bg-amber-100 text-amber-900 border-amber-200',
  Verified: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Rejected: 'bg-rose-100 text-rose-800 border-rose-200',

  // Job Statuses
  Draft: 'bg-slate-100 text-slate-700 border-slate-200',
  Assigned: 'bg-sky-100 text-sky-800 border-sky-200',
  'In Progress': 'bg-amber-100 text-amber-900 border-amber-200',
  Completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Cancelled: 'bg-rose-100 text-rose-800 border-rose-200',

  // Submission Statuses
  Submitted: 'bg-blue-100 text-blue-800 border-blue-200',
  'Under Review': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Revision Required': 'bg-amber-100 text-amber-900 border-amber-200',
  Approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Content Ready': 'bg-teal-100 text-teal-900 border-teal-200',

  // Processing Statuses
  PROCESSED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Processed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  PROCESSING: 'bg-indigo-100 text-indigo-800 border-indigo-200 animate-pulse',
  Processing: 'bg-indigo-100 text-indigo-800 border-indigo-200 animate-pulse',
  PROCESSING_FAILED: 'bg-rose-100 text-rose-800 border-rose-200',
  'Processing Failed': 'bg-rose-100 text-rose-800 border-rose-200',
  PENDING: 'bg-amber-100 text-amber-900 border-amber-200',

  // Input Types
  TEXT: 'bg-slate-100 text-slate-800 border-slate-200',
  PDF: 'bg-red-100 text-red-800 border-red-200',
  DOC: 'bg-blue-100 text-blue-800 border-blue-200',
  DOCX: 'bg-blue-100 text-blue-800 border-blue-200',
  IMAGE: 'bg-purple-100 text-purple-800 border-purple-200',

  // Difficulty
  Easy: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Medium: 'bg-amber-100 text-amber-900 border-amber-200',
  Hard: 'bg-rose-100 text-rose-800 border-rose-200',
};

export function StatusBadge({ label }: { label: string }) {
  const toneClass = tones[label] ?? 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${toneClass}`}
    >
      {label}
    </span>
  );
}
