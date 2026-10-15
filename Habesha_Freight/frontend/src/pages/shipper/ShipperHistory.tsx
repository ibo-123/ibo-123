// src/pages/shipper/ShipperHistory.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, post } from '../../services/api';
import { getStoredUser } from '../../services/authService';

interface Shipment {
  id: string;
  load_id?: string;
  carrier_id?: string;
  status: string;
  cargo_description: string;
  weight_tons?: number;
  origin_city: string;
  destination_city: string;
  offered_price_etb: number;
  shipper_name?: string;
  carrier_name?: string;
  created_at: string;
  code?: string;
  is_fleet?: boolean;
  rated?: boolean;
}

interface Review {
  id: string;
  shipment_id: string;
  rating: number;
  comment?: string;
}

const today = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const formatCurrency = (n: number) => `ETB ${Number(n).toLocaleString()}`;

export default function ShipperHistory() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [historyItems, setHistoryItems] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Rating Modal state
  const [showRateModal, setShowRateModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [ratingValue, setRatingValue] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);

  const initials = (user?.full_name ?? 'Sara Bekele')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch live shipments from API (GET /api/shipments)
      const shipmentsRes = await get<any>('/shipments');
      const allShipments: Shipment[] = Array.isArray(shipmentsRes)
        ? shipmentsRes
        : shipmentsRes?.data ?? [];

      // Filter for delivered or completed shipments
      const completedShipments = allShipments.filter(
        (s) => s.status === 'DELIVERED' || s.status === 'COMPLETED'
      );

      // 2. Fetch live reviews from API (GET /api/reviews)
      let reviewsMap: Record<string, boolean> = {};
      try {
        const reviewsRes = await get<any>('/reviews');
        const reviewsList: Review[] = Array.isArray(reviewsRes)
          ? reviewsRes
          : reviewsRes?.data ?? [];
        reviewsList.forEach((r) => {
          reviewsMap[r.shipment_id] = true;
        });
      } catch (err) {
        console.warn('Could not load live reviews:', err);
      }

      // Map live backend shipments
      const liveItems: Shipment[] = completedShipments.map((s) => {
        const isFleet = (s.carrier_name || '').toLowerCase().includes('fleet') || 
                        (s.carrier_name || '').toLowerCase().includes('logistics') ||
                        (s.carrier_name || '').toLowerCase().includes('transport');
        return {
          ...s,
          code: s.code || `SHP-${s.id.slice(0, 3).toUpperCase()}`,
          is_fleet: isFleet,
          rated: !!reviewsMap[s.id],
        };
      });

      setHistoryItems(liveItems);
    } catch (err: any) {
      console.error('Error fetching live history:', err);
      setError('Unable to load live delivery history. Please try again.');
      setHistoryItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleOpenRateModal = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setRatingValue(5);
    setComment('');
    setRatingError(null);
    setShowRateModal(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedShipment) return;
    setSubmittingRating(true);
    setRatingError(null);

    try {
      // Submit live review via POST /api/reviews
      await post('/reviews', {
        shipment_id: selectedShipment.id,
        reviewee_id: selectedShipment.carrier_id,
        rating: ratingValue,
        comment: comment.trim() || undefined,
      });

      // Update local item state to show rated upon successful API call
      setHistoryItems((prev) =>
        prev.map((item) =>
          item.id === selectedShipment.id ? { ...item, rated: true } : item
        )
      );

      setShowRateModal(false);
    } catch (err: any) {
      console.error('Submit review error:', err);
      setRatingError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmittingRating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="p-4 sm:p-5 w-full font-sans text-slate-900 min-h-screen">
      {/* ── Top Header ── */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-[1.75rem] font-bold text-slate-900 mb-1 leading-tight">History</h1>
          <p className="text-sm text-slate-500">{today}</p>
        </div>
        <div className="flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-full bg-[#071426] text-white flex items-center justify-center text-sm font-bold cursor-pointer"
            onClick={() => navigate('/profile')}
          >
            {initials}
          </div>
        </div>
      </header>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {/* ── Delivery History Card Container ── */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold text-slate-900 mb-6">Delivery History</h2>

        {loading ? (
          <p className="text-slate-500 py-8 text-center">Loading live delivery history…</p>
        ) : historyItems.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No completed delivery history found.
          </div>
        ) : (
          <div className="flex flex-col">
            {historyItems.map((item, idx) => {
              const isLast = idx === historyItems.length - 1;
              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between py-4 ${
                    !isLast ? 'border-b border-slate-100' : ''
                  }`}
                >
                  {/* Left Column: Icon + Details */}
                  <div className="flex items-center gap-4">
                    {/* Item Icon */}
                    <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-xl shrink-0">
                      {item.is_fleet ? '🏢' : '📦'}
                    </div>

                    <div>
                      {/* Code & Route */}
                      <div className="font-bold text-slate-900 text-sm">
                        {item.code} · {item.origin_city} → {item.destination_city}
                      </div>
                      {/* Subtitle & Date */}
                      <div className="text-xs text-slate-400 mt-0.5">
                        {item.cargo_description} · {formatDate(item.created_at)}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Price & Status/Rate Action */}
                  <div className="text-right flex flex-col items-end">
                    <div className="font-bold text-slate-900 text-sm">
                      {formatCurrency(item.offered_price_etb)}
                    </div>

                    <div className="mt-1">
                      {item.rated ? (
                        <span className="text-emerald-600 text-xs font-semibold flex items-center gap-1">
                          ✓ Rated
                        </span>
                      ) : (
                        <button
                          onClick={() => handleOpenRateModal(item)}
                          className="text-amber-600 hover:text-amber-700 text-xs font-semibold cursor-pointer bg-transparent border-none p-0 transition-colors"
                        >
                          Rate now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Rate Now Modal ── */}
      {showRateModal && selectedShipment && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-sm w-full animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Rate Driver & Service</h3>
            <p className="text-xs text-slate-500 mb-4">
              {selectedShipment.code} · {selectedShipment.origin_city} → {selectedShipment.destination_city}
            </p>

            {ratingError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-xs font-semibold">
                {ratingError}
              </div>
            )}

            {/* Star Rating selector */}
            <div className="flex flex-col items-center gap-2 mb-6">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Tap to Select Rating
              </span>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverRating || ratingValue) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRatingValue(star)}
                      className={`text-2xl transition-transform cursor-pointer ${
                        active ? 'scale-110 text-amber-400' : 'text-slate-300'
                      }`}
                    >
                      ★
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Comment text area */}
            <div className="flex flex-col gap-2 mb-6">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Review Comment (Optional)
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share feedback on driver timeliness, cargo safety..."
                className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-800"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowRateModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitReview}
                disabled={submittingRating}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {submittingRating ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
