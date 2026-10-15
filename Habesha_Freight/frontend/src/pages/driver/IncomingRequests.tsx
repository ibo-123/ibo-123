import { useMemo, useState } from 'react';
import { getStoredUser } from '../../services/authService';
import { useAvailableLoads, AvailableLoad } from '../../hooks/useAvailableLoads';
import { post } from '../../services/api';
import ChatModal from '../../components/ChatModal';

/* ── Route / filter options ────────── */
const ALL_ROUTES = 'All Routes';
const ALL_CARGO = 'All Cargo Types';
const ALL_DISTANCE = 'Any Distance';

const ROUTE_OPTIONS = [
  ALL_ROUTES,
  'Addis Ababa',
  'Hawassa',
  'Adama',
  'Dire Dawa',
  'Bahir Dar',
  'Mekelle',
  'Jimma',
  'Gondar',
];

const CARGO_OPTIONS = [
  ALL_CARGO,
  'Agricultural Produce',
  'Electronics',
  'Construction Materials',
  'General Goods',
  'Coffee Beans',
  'Textiles',
];

const DISTANCE_OPTIONS = [
  ALL_DISTANCE,
  'Under 50 km (Nearby)',
  'Under 300 km',
  '300 – 500 km',
  'Over 500 km',
];

/* ── Helpers ─────────────────────────────────────────────── */
function formatBudget(value: number | string): string {
  return Number(value || 0).toLocaleString('en-US');
}

/* ── Chat SVG icon ───────────────────────────────────────── */
function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export default function IncomingRequests() {
  const user = getStoredUser();
  const { loads, loading, error, refresh } = useAvailableLoads();

  const initials = (user?.full_name ?? 'Abebe Driver')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  /* Filters */
  const [routeFilter, setRouteFilter] = useState(ALL_ROUTES);
  const [cargoFilter, setCargoFilter] = useState(ALL_CARGO);
  const [distanceFilter, setDistanceFilter] = useState(ALL_DISTANCE);

  /* Bid & Chat modal state */
  const [bidTarget, setBidTarget] = useState<AvailableLoad | null>(null);
  const [chatTarget, setChatTarget] = useState<AvailableLoad | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidNote, setBidNote] = useState('');
  const [submittingBid, setSubmittingBid] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  /* Filter logic */
  const filtered = useMemo(() => {
    return loads.filter((r) => {
      // Route filter — matches origin or destination
      if (routeFilter !== ALL_ROUTES) {
        if (
          !r.origin_city.toLowerCase().includes(routeFilter.toLowerCase()) &&
          !r.destination_city.toLowerCase().includes(routeFilter.toLowerCase())
        ) {
          return false;
        }
      }
      // Cargo filter
      if (cargoFilter !== ALL_CARGO) {
        if (!r.cargo_description.toLowerCase().includes(cargoFilter.toLowerCase())) {
          return false;
        }
      }
      // Distance filter
      const dist = r.distance_km ?? 0;
      if (distanceFilter === 'Under 50 km (Nearby)' && dist > 50) return false;
      if (distanceFilter === 'Under 300 km' && dist >= 300) return false;
      if (distanceFilter === '300 – 500 km' && (dist < 300 || dist > 500)) return false;
      if (distanceFilter === 'Over 500 km' && dist <= 500) return false;

      return true;
    });
  }, [loads, routeFilter, cargoFilter, distanceFilter]);

  /* Handlers */
  const openBidModal = (request: AvailableLoad) => {
    setBidTarget(request);
    setBidAmount(String(request.offered_price_etb));
    setBidNote('');
    setActionError(null);
  };

  const closeBidModal = () => {
    setBidTarget(null);
    setActionError(null);
  };

  const handleSubmitBid = async () => {
    if (!bidTarget || !bidAmount) return;
    setSubmittingBid(true);
    setActionError(null);

    try {
      await post('/bids', {
        load_id: bidTarget.id,
        bid_amount_etb: Number(bidAmount),
        note: bidNote || undefined,
      });

      setActionSuccess(`Bid of ETB ${formatBudget(bidAmount)} submitted successfully!`);
      closeBidModal();
      refresh();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      console.error('Error submitting bid:', err);
      setActionError(err.message || 'Failed to submit bid.');
    } finally {
      setSubmittingBid(false);
    }
  };

  const handleAcceptPrice = async (request: AvailableLoad) => {
    if (!window.confirm(`Accept job ${request.origin_city} → ${request.destination_city} at ETB ${formatBudget(request.offered_price_etb)}?`)) {
      return;
    }

    try {
      await post(`/driver/loads/${request.id}/accept`, {});
      setActionSuccess(`Load accepted! Shipment assigned for ${request.origin_city} → ${request.destination_city}.`);
      refresh();
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      console.error('Error accepting price:', err);
      alert(err.message || 'Failed to accept load. Please make sure you have an active verified vehicle.');
    }
  };

  return (
    <div className="dr-page">
      {/* ── Top Header ─────────────────────────────────────────── */}
      <div className="dr-header" style={{ justifyContent: 'space-between', padding: '10px 0' }}>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Available Load Requests</h1>
          <p className="text-xs text-slate-500">Nearby shipments posted by shippers</p>
        </div>
        <div className="dr-header-right">
          <div className="dr-status-badge">
            <span className="dr-status-dot" />
            Online &amp; Available
          </div>
          <div className="dr-avatar" title={user?.full_name ?? 'Driver Account'}>
            {initials}
          </div>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl mb-4 text-sm font-semibold">
          ✅ {actionSuccess}
        </div>
      )}

      {/* ── Filter bar ─────────────────────────────────────── */}
      <div className="dr-filters">
        <select
          className="dr-filter-select"
          value={routeFilter}
          onChange={(e) => setRouteFilter(e.target.value)}
          aria-label="Filter by route"
        >
          {ROUTE_OPTIONS.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>

        <select
          className="dr-filter-select"
          value={cargoFilter}
          onChange={(e) => setCargoFilter(e.target.value)}
          aria-label="Filter by cargo type"
        >
          {CARGO_OPTIONS.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>

        <select
          className="dr-filter-select"
          value={distanceFilter}
          onChange={(e) => setDistanceFilter(e.target.value)}
          aria-label="Filter by distance"
        >
          {DISTANCE_OPTIONS.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </div>

      {/* ── Request cards ──────────────────────────────────── */}
      {loading ? (
        <div className="py-12 text-center text-slate-400">Loading nearby shipment requests...</div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="dr-empty">
          <div className="dr-empty-icon">📦</div>
          <h3>No matching requests</h3>
          <p>Try adjusting your filters to see available freight requests.</p>
        </div>
      ) : (
        <div className="dr-cards">
          {filtered.map((req) => (
            <div className="dr-card" key={req.id}>
              <div className="dr-card-top">
                <div>
                  <p className="dr-route">
                    {req.origin_city} <span className="dr-route-arrow">→</span> {req.destination_city}
                    {req.distance_km !== undefined && (
                      <span className="ml-2 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        📍 {req.distance_km} km away
                      </span>
                    )}
                  </p>
                  <p className="dr-cargo-details">
                    {req.cargo_description} <span>·</span> {req.weight_tons} tons <span>·</span> {req.bidCount || 0} bids
                  </p>
                  <p className="dr-shipper">
                    Shipper: <strong>{req.shipper_name || 'Verified Shipper'}</strong> ({req.shipper_phone || '+251 9XX XXX XXX'})
                  </p>
                </div>
                <div className="dr-price-section">
                  <p className="dr-price">ETB {formatBudget(req.offered_price_etb)}</p>
                  <p className="dr-price-label">Posted budget</p>
                </div>
              </div>

              <div className="dr-actions">
                <button className="dr-btn-bid" onClick={() => openBidModal(req)}>
                  Submit Bid
                </button>
                <button className="dr-btn-accept" onClick={() => handleAcceptPrice(req)}>
                  Accept Price
                </button>
                <button
                  className="dr-btn-chat"
                  aria-label="Message shipper"
                  title="Message shipper"
                  onClick={() => setChatTarget(req)}
                >
                  <ChatIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Bid Modal ──────────────────────────────────────── */}
      {bidTarget && (
        <div className="dr-modal-overlay" onClick={closeBidModal}>
          <div className="dr-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Submit Your Bid</h2>
            <p className="dr-modal-route">
              {bidTarget.origin_city} → {bidTarget.destination_city} · {bidTarget.cargo_description}
            </p>

            {actionError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs mb-3">{actionError}</div>
            )}

            <label className="dr-modal-label">Your bid amount (ETB)</label>
            <div className="dr-modal-input-group">
              <span className="dr-modal-currency">ETB</span>
              <input
                className="dr-modal-input"
                type="number"
                placeholder="Enter amount"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                autoFocus
              />
            </div>
            <p className="dr-modal-posted">
              Posted budget: <strong>ETB {formatBudget(bidTarget.offered_price_etb)}</strong>
            </p>

            <label className="dr-modal-label">Note (optional)</label>
            <textarea
              className="dr-modal-textarea"
              placeholder="Add a message to the shipper..."
              value={bidNote}
              onChange={(e) => setBidNote(e.target.value)}
            />

            <div className="dr-modal-actions">
              <button className="dr-modal-cancel" onClick={closeBidModal} disabled={submittingBid}>
                Cancel
              </button>
              <button className="dr-modal-submit" onClick={handleSubmitBid} disabled={submittingBid}>
                {submittingBid ? 'Submitting...' : 'Submit Bid'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Chat Modal ────────────────────────────────────── */}
      {chatTarget && (
        <ChatModal
          isOpen={!!chatTarget}
          onClose={() => setChatTarget(null)}
          receiverId={chatTarget.shipper_id || ''}
          receiverName={chatTarget.shipper_name || 'Shipper'}
          receiverPhone={chatTarget.shipper_phone}
          loadTitle={`${chatTarget.origin_city} → ${chatTarget.destination_city}`}
        />
      )}
    </div>
  );
}
