import { useEffect, useState } from 'react';
import { get, patch, post } from '../../services/api';
import ChatModal from '../../components/ChatModal';

export interface ShipperBid {
  id: string;
  load_id: string;
  driver_id: string;
  bid_amount_etb: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED';
  created_at: string;
  origin_city?: string;
  destination_city?: string;
  cargo_description?: string;
  offered_price_etb?: number;
  driver_name?: string;
  driver_phone?: string;
  driver_photo?: string;
  vehicle_type?: string;
  capacity_tons?: number;
  completed_trips?: number;
  driver_rating?: string;
}

export default function ShipperBids() {
  const [bids, setBids] = useState<ShipperBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [chatTarget, setChatTarget] = useState<ShipperBid | null>(null);
  const [counterTarget, setCounterTarget] = useState<ShipperBid | null>(null);
  const [counterAmount, setCounterAmount] = useState('');
  const [counterNote, setCounterNote] = useState('');
  const [submittingCounter, setSubmittingCounter] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchBids = async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await get('/shipper/bids');
      const list = Array.isArray(res) ? res : res?.data ?? [];
      setBids(list);
    } catch (err: any) {
      console.warn('Failed to load shipper bids from /shipper/bids:', err);
      // Fallback: try fetching shipper requests and gather bids
      try {
        const reqRes: any = await get('/shipper/requests');
        const requests = Array.isArray(reqRes) ? reqRes : reqRes?.data ?? [];
        const allBids: ShipperBid[] = [];
        for (const req of requests) {
          try {
            const bRes: any = await get(`/shipper/requests/${req.id}/bids`);
            const bList = Array.isArray(bRes) ? bRes : bRes?.data ?? [];
            bList.forEach((b: any) => {
              allBids.push({
                ...b,
                origin_city: req.origin_city,
                destination_city: req.destination_city,
                cargo_description: req.cargo_description,
                offered_price_etb: req.offered_price_etb,
              });
            });
          } catch (_) {}
        }
        setBids(allBids);
      } catch (fallbackErr: any) {
        setError(fallbackErr?.message || 'Unable to load bids.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBids();
  }, []);

  const handleAccept = async (bid: ShipperBid) => {
    try {
      await patch(`/shipper/requests/${bid.load_id}/bids/${bid.id}/accept`, {});
      setActionSuccess('Bid accepted successfully!');
      fetchBids();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err?.message || 'Failed to accept bid.');
    }
  };

  const handleReject = async (bid: ShipperBid) => {
    try {
      await patch(`/shipper/requests/${bid.load_id}/bids/${bid.id}/reject`, {});
      setActionSuccess('Bid rejected.');
      fetchBids();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err?.message || 'Failed to reject bid.');
    }
  };

  const handleCounterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterTarget || !counterAmount) return;

    setSubmittingCounter(true);
    try {
      await post(`/shipper/requests/${counterTarget.load_id}/bids/${counterTarget.id}/counter`, {
        counter_amount_etb: Number(counterAmount),
        note: counterNote || undefined,
      });
      setActionSuccess('Counter offer sent to driver!');
      setCounterTarget(null);
      setCounterAmount('');
      setCounterNote('');
      fetchBids();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err?.message || 'Failed to submit counter offer.');
    } finally {
      setSubmittingCounter(false);
    }
  };

  return (
    <div className="p-4 sm:p-5 w-full font-sans min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bids & Driver Proposals</h1>
          <p className="text-sm text-slate-500">Review driver bids, make counter offers, and negotiate live</p>
        </div>
        <button
          onClick={fetchBids}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
        >
          🔄 Refresh
        </button>
      </div>

      {actionSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-sm font-semibold">
          ✅ {actionSuccess}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-500">Loading incoming driver bids...</div>
      ) : error ? (
        <div className="py-16 text-center text-red-500 font-semibold">{error}</div>
      ) : bids.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm max-w-md mx-auto my-8">
          <div className="text-4xl mb-3">🏷️</div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No Driver Bids Yet</h3>
          <p className="text-sm text-slate-500 mb-4">
            When drivers submit bids for your posted freight requests, they will appear here for review.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bids.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                {/* Header: Route + Status */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block mb-0.5">
                      {b.cargo_description || 'General Goods'}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base">
                      {b.origin_city && b.destination_city
                        ? `${b.origin_city} → ${b.destination_city}`
                        : `Load #${b.load_id.slice(0, 8)}`}
                    </h3>
                  </div>
                  <span
                    className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                      b.status === 'ACCEPTED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : b.status === 'REJECTED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>

                {/* Driver Profile Summary */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#071426] text-white font-bold flex items-center justify-center text-sm">
                    {(b.driver_name || 'Driver').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-900 truncate">
                      {b.driver_name || 'Verified Driver'}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <span>⭐ {b.driver_rating || '5.0'}</span>
                      <span>•</span>
                      <span>{b.completed_trips ?? 0} Completed Jobs</span>
                    </div>
                  </div>
                </div>

                {/* Price Details */}
                <div className="space-y-2 text-sm border-t border-b border-slate-100 py-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Posted Budget:</span>
                    <span className="font-semibold text-slate-700">
                      ETB {Number(b.offered_price_etb || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Driver Bid:</span>
                    <span className="font-bold text-lg text-emerald-600">
                      ETB {Number(b.bid_amount_etb || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => setChatTarget(b)}
                  className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  💬 Chat with Driver
                </button>

                {b.status === 'PENDING' && (
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleAccept(b)}
                      className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => setCounterTarget(b)}
                      className="py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Counter
                    </button>
                    <button
                      onClick={() => handleReject(b)}
                      className="py-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Chat Modal ── */}
      {chatTarget && (
        <ChatModal
          isOpen={!!chatTarget}
          onClose={() => setChatTarget(null)}
          receiverId={chatTarget.driver_id}
          receiverName={chatTarget.driver_name || 'Driver'}
          receiverPhone={chatTarget.driver_phone}
          loadTitle={
            chatTarget.origin_city && chatTarget.destination_city
              ? `${chatTarget.origin_city} → ${chatTarget.destination_city}`
              : undefined
          }
        />
      )}

      {/* ── Counter Offer Modal ── */}
      {counterTarget && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Make Counter Offer</h3>
            <p className="text-xs text-slate-500 mb-4">
              Submit your proposed price to {counterTarget.driver_name || 'the driver'}
            </p>

            <form onSubmit={handleCounterSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Driver's Bid
                </label>
                <div className="p-3 bg-slate-50 rounded-xl text-slate-800 font-bold text-sm">
                  ETB {Number(counterTarget.bid_amount_etb).toLocaleString()}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Your Counter Offer (ETB)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="100"
                  placeholder="Enter counter offer amount"
                  value={counterAmount}
                  onChange={(e) => setCounterAmount(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Note to Driver (optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain terms or conditions..."
                  value={counterNote}
                  onChange={(e) => setCounterNote(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-900"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setCounterTarget(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCounter}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submittingCounter ? 'Submitting...' : 'Send Counter Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}