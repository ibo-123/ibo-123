interface Shipment {
  id: string;
  origin: string;
  destination: string;
  status: 'pending' | 'in_transit' | 'delivered';
  date: string;
}

interface DashboardShipmentCardProps {
  shipments: Shipment[];
}

export default function DashboardShipmentCard({ shipments }: DashboardShipmentCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#C8933A';
      case 'in_transit':
        return '#0B1F33';
      case 'delivered':
        return '#059669';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in_transit':
        return 'In Transit';
      case 'delivered':
        return 'Delivered';
      default:
        return status;
    }
  };

  return (
    <div className="dashboard-shipment-card">
      <h3 className="shipment-card-title">Active Shipments</h3>
      <div className="shipment-list">
        {shipments.length === 0 ? (
          <p className="shipment-empty">No active shipments</p>
        ) : (
          shipments.map((shipment) => (
            <div key={shipment.id} className="shipment-item">
              <div className="shipment-route">
                <span className="shipment-origin">{shipment.origin}</span>
                <span className="shipment-arrow">→</span>
                <span className="shipment-destination">{shipment.destination}</span>
              </div>
              <div className="shipment-meta">
                <span className="shipment-date">{shipment.date}</span>
                <span
                  className="shipment-status"
                  style={{ backgroundColor: getStatusColor(shipment.status) }}
                >
                  {getStatusLabel(shipment.status)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}