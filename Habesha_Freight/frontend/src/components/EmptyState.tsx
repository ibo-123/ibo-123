interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="text-4xl mb-4">📦</div>
      <h3 className="text-xl font-semibold text-slate-800 mb-2">{title}</h3>
      {description && <p className="text-slate-600 mb-4">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
