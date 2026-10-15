import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { post } from '../../services/api';

export default function SubmitBid() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: paramId } = useParams<{ id: string }>();
  // load_id may come from the URL param OR from navigation state
  const requestId =
    paramId ??
    (location.state as { requestId?: string } | null)?.requestId ??
    '';
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!requestId) {
      setError('Load ID is missing. Please go back and try again.');
      return;
    }
    setSubmitting(true);
    try {
      await post('/driver/bids', {
        load_id: requestId,
        bid_amount_etb: Number(amount),
        note: note || undefined,
      });
      navigate('/driver/bids');
    } catch (err: any) {
      setError(err?.message ?? 'Unable to submit bid. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Submit Bid" subtitle="Place your bid for this shipment" />

      <div className="p2-card" style={{ maxWidth: '560px' }}>
        <form onSubmit={handleSubmit}>
          {requestId && (
            <div className="p2-form-group">
              <label className="p2-form-label">Request ID</label>
              <input className="p2-input" value={requestId} readOnly />
            </div>
          )}
          <div className="p2-form-group">
            <label className="p2-form-label" htmlFor="bid-amount">
              Bid Amount (ETB)
            </label>
            <input
              id="bid-amount"
              className="p2-input"
              type="number"
              min="0"
              step="100"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter your bid amount"
            />
          </div>
          <div className="p2-form-group">
            <label className="p2-form-label" htmlFor="bid-note">
              Notes (optional)
            </label>
            <textarea
              id="bid-note"
              className="p2-textarea"
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any additional details for the shipper..."
            />
          </div>
          {error && <p style={{ color: '#c53030', marginBottom: '1rem' }}>{error}</p>}
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Bid'}
          </button>
        </form>
      </div>
    </div>
  );
}
