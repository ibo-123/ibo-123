interface Activity {
  id: string;
  type: 'shipment' | 'bid' | 'payment' | 'status';
  description: string;
  time: string;
  status?: 'pending' | 'completed' | 'active';
}

interface DashboardActivityProps {
  activities: Activity[];
}

export default function DashboardActivity({ activities }: DashboardActivityProps) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'pending':
        return '#C8933A';
      case 'completed':
        return '#059669';
      case 'active':
        return '#0B1F33';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="dashboard-activity">
      <h3 className="activity-title">Recent Activity</h3>
      <div className="activity-list">
        {activities.length === 0 ? (
          <p className="activity-empty">No recent activity</p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="activity-item">
              <div className="activity-dot" style={{ backgroundColor: getStatusColor(activity.status) }} />
              <div className="activity-content">
                <p className="activity-description">{activity.description}</p>
                <span className="activity-time">{activity.time}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}