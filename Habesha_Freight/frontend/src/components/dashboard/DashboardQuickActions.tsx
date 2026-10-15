import { Link } from 'react-router-dom';

export default function DashboardQuickActions() {
  const actions = [
    {
      label: 'Post a Shipment',
      icon: '📦',
      route: '/shipments/create',
      color: '#0B1F33',
    },
    {
      label: 'Find a Truck',
      icon: '🔍',
      route: '/shipments',
      color: '#C8933A',
    },
  ];

  return (
    <div className="dashboard-quick-actions">
      <h3 className="quick-actions-title">Quick Actions</h3>
      <div className="quick-actions-grid">
        {actions.map((action) => (
          <Link key={action.label} to={action.route} className="quick-action-btn">
            <span className="quick-action-icon">{action.icon}</span>
            <span className="quick-action-label">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}