interface DashboardStatsProps {
  activeShipments: number;
  pendingBids: number;
  completedShipments: number;
}

export default function DashboardStats({ activeShipments, pendingBids, completedShipments }: DashboardStatsProps) {
  const stats = [
    {
      label: 'Active Shipments',
      value: activeShipments,
      icon: '🚚',
      color: '#0B1F33',
    },
    {
      label: 'Pending Bids',
      value: pendingBids,
      icon: '📋',
      color: '#C8933A',
    },
    {
      label: 'Completed',
      value: completedShipments,
      icon: '✅',
      color: '#059669',
    },
  ];

  return (
    <div className="dashboard-stats">
      {stats.map((stat) => (
        <div key={stat.label} className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: stat.color }}>
            {stat.icon}
          </div>
          <div className="stat-content">
            <span className="stat-value">{stat.value}</span>
            <span className="stat-label">{stat.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}