import { useParams } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';

export default function DeliveryDetails() {
  const { id } = useParams<{ id: string }>();

  // TODO: Replace with API response from GET /api/driver/deliveries/:id
  const delivery = {
    id: id ?? '',
    origin: 'Addis Ababa',
    destination: 'Hawassa',
    status: 'in_transit',
    cargoType: 'Agricultural Products',
    weight: 8,
    pickupDate: '2026-08-16',
    eta: '2026-08-17 14:00',
    shipper: 'Green Valley Exports',
    vehicle: 'AA-3-12345',
  };

  return (
    <div>
      <PageHeader title="Delivery Details" subtitle={`Delivery #${delivery.id.slice(0, 8)}`} />

      <div className="p2-detail-grid">
        <div className="p2-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontFamily: 'Instrument Serif, serif' }}>Shipment</h3>
            <StatusBadge status={delivery.status} />
          </div>
          {[
            ['Route', `${delivery.origin} → ${delivery.destination}`],
            ['Cargo', delivery.cargoType],
            ['Weight', `${delivery.weight} tons`],
            ['Pickup', delivery.pickupDate],
            ['ETA', delivery.eta],
            ['Shipper', delivery.shipper],
            ['Vehicle', delivery.vehicle],
          ].map(([label, value]) => (
            <div key={label} className="p2-detail-row">
              <span className="p2-detail-label">{label}</span>
              <span className="p2-detail-value">{value}</span>
            </div>
          ))}
        </div>

        <div className="p2-card">
          <h3 style={{ fontFamily: 'Instrument Serif, serif', marginBottom: '1rem' }}>
            Update Status
          </h3>
          <p style={{ color: '#6b7c8f', fontSize: '0.875rem', marginBottom: '1rem' }}>
            {/* TODO: Backend endpoint required: PATCH /api/driver/deliveries/:id/status */}
            Status updates require backend integration for real-time delivery tracking.
          </p>
          <select className="p2-select" defaultValue={delivery.status}>
            <option value="assigned">Assigned</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
          </select>
          <button type="button" className="btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
            Update Status
          </button>
        </div>
      </div>
    </div>
  );
}
