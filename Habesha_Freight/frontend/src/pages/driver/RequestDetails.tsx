import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import ChatModal from '../../components/ChatModal';
import { get } from '../../services/api';

export default function RequestDetails() {
  const { id } = useParams<{ id: string }>();
  const [load, setLoad] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    get<any>(`/loads/${id}`)
      .then((res) => {
        const data = res?.data ?? res;
        setLoad(data);
      })
      .catch((err) => {
        console.error('Fetch load details error:', err);
        setError(err.message || 'Unable to fetch load details.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="p-4 sm:p-5 text-center text-slate-500">Loading shipment details...</div>;
  }

  if (error || !load) {
    return (
      <div className="p-4 sm:p-5 text-center">
        <p className="text-red-500 font-medium mb-4">{error || 'Shipment load not found.'}</p>
        <Link to="/driver/requests/loads" className="btn-outline">
          Back to Available Loads
        </Link>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Request Details"
        subtitle={`Request #${load.id.slice(0, 8)}`}
        actions={
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => setIsChatOpen(true)} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              💬 Chat with Shipper
            </button>
            <Link to="/driver/bids/submit" state={{ requestId: id }} className="btn-primary">
              Submit Bid
            </Link>
          </div>
        }
      />

      <div className="p2-detail-grid">
        <div className="p2-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontFamily: 'Instrument Serif, serif' }}>Shipment Information</h3>
            <StatusBadge status={load.status} />
          </div>
          <div className="p2-detail-row">
            <span className="p2-detail-label">Route</span>
            <span className="p2-detail-value">{load.origin_city} → {load.destination_city}</span>
          </div>
          <div className="p2-detail-row">
            <span className="p2-detail-label">Cargo Description</span>
            <span className="p2-detail-value">{load.cargo_description}</span>
          </div>
          <div className="p2-detail-row">
            <span className="p2-detail-label">Weight</span>
            <span className="p2-detail-value">{load.weight_tons} tons</span>
          </div>
          <div className="p2-detail-row">
            <span className="p2-detail-label">Offered Budget</span>
            <span className="p2-detail-value font-bold text-emerald-600">ETB {Number(load.offered_price_etb || 0).toLocaleString()}</span>
          </div>
          <div className="p2-detail-row">
            <span className="p2-detail-label">Shipper</span>
            <span className="p2-detail-value">{load.shipper_name || 'Verified Shipper'}</span>
          </div>
          <div className="p2-detail-row">
            <span className="p2-detail-label">Shipper Contact</span>
            <span className="p2-detail-value">{load.shipper_phone || '+251 9XX XXX XXX'}</span>
          </div>
        </div>

        <div className="p2-card">
          <h3 style={{ fontFamily: 'Instrument Serif, serif', marginBottom: '1rem' }}>Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/driver/bids/submit" state={{ requestId: id }} className="btn-primary" style={{ textAlign: 'center' }}>
              Submit Custom Bid
            </Link>
            <button
              onClick={() => setIsChatOpen(true)}
              style={{
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              💬 Message Shipper Now
            </button>
            <Link to="/driver/requests/loads" className="btn-outline" style={{ textAlign: 'center' }}>
              Back to Available Loads
            </Link>
          </div>
        </div>
      </div>

      {isChatOpen && (
        <ChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          receiverId={load.shipper_id || ''}
          receiverName={load.shipper_name || 'Shipper'}
          receiverPhone={load.shipper_phone}
          loadTitle={`${load.origin_city} → ${load.destination_city}`}
        />
      )}
    </div>
  );
}
