import React from 'react';
import { useDriverShipments } from '../../hooks/useDriverShipments';
import StatusBadge from '../../components/StatusBadge';

const DeliveryHistory: React.FC = () => {
  const { shipments, loading, error } = useDriverShipments();

  if (loading) {
    return <div className="p-4 sm:p-5 text-center text-slate-500">Loading delivery history...</div>;
  }

  if (error) {
    return <div className="p-4 sm:p-5 text-center text-red-500">{error}</div>;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '900px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 className="text-xl font-bold text-slate-900">Delivery History</h1>
        <p style={{ fontSize: '14px', color: '#8b8b9f', margin: '4px 0 0 0' }}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {shipments.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px',
              color: '#8b8b9f',
              backgroundColor: '#f8f8fa',
              borderRadius: '12px',
            }}
          >
            No completed or assigned deliveries found.
          </div>
        ) : (
          shipments.map((s) => (
            <div
              key={s.id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e8e8f0',
                padding: '16px 20px',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ flex: '1 1 60%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a2e' }}>
                    SHP-{s.id.slice(0, 8)}
                  </span>
                  <span style={{ color: '#c8c8d8' }}>·</span>
                  <span style={{ fontSize: '15px', color: '#4a4a62' }}>
                    {s.origin_city} → {s.destination_city}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '13px',
                    color: '#7a7a92',
                  }}
                >
                  <span>{s.cargo_description}</span>
                  <span>·</span>
                  <span>{s.weight_tons} tons</span>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  flex: '1 1 auto',
                  justifyContent: 'flex-end',
                }}
              >
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#16a34a' }}>
                  ETB {Number(s.offered_price_etb || 0).toLocaleString()}
                </span>
                <StatusBadge status={s.status} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DeliveryHistory;