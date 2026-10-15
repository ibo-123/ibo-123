interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

const variantMap: Record<string, StatusBadgeProps['variant']> = {
  active: 'success',
  verified: 'success',
  approved: 'success',
  delivered: 'success',
  completed: 'success',
  accepted: 'success',
  pending: 'warning',
  in_transit: 'info',
  assigned: 'info',
  rejected: 'danger',
  suspended: 'danger',
  cancelled: 'danger',
  inactive: 'danger',
};

export default function StatusBadge({ status, variant }: StatusBadgeProps) {
  const colorMap: Record<string, string> = {
    success: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-rose-100 text-rose-800',
    info: 'bg-sky-100 text-sky-800',
    default: 'bg-slate-100 text-slate-800',
  };
  const resolved = variant ?? variantMap[status.toLowerCase()] ?? 'default';
  const badgeClass = colorMap[resolved] ?? colorMap['default'];
  const label = status.replace(/_/g, ' ');

  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>{label}</span>;

}
