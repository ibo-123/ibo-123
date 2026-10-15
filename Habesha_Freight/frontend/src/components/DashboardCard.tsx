interface DashboardCardProps {
  label: string;
  value: string | number;
  hint?: string;
  accent?: 'gold' | 'navy' | 'green' | 'blue';
}

export default function DashboardCard({
  label,
  value,
  hint,
  accent = 'gold',
}: DashboardCardProps) {
  return (
    <div className={`p2-stat-card p2-stat-card--${accent}`}>
      <span className="p2-stat-label">{label}</span>
      <span className="p2-stat-value">{value}</span>
      {hint && <span className="p2-stat-hint">{hint}</span>}
    </div>
  );
}
