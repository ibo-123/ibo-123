// src/pages/shipper/ShipperShipments.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { get, patch } from '../../services/api';
import { getStoredUser } from '../../services/authService';
import ChatModal from '../../components/ChatModal';

interface Bid {
  id: string;
  driver_id: string;
  driver_name: string;
  driver_phone: string;
  vehicle_type?: string;
  capacity_tons?: number;
  bid_amount_etb: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  created_at: string;
  completed_trips?: number;
  driver_rating?: string;
}

interface Load {
  id: string;
  origin_city: string;
  destination_city: string;
  cargo_description: string;
  weight_tons: number;
  offered_price_etb: number;
  status: string;
  created_at: string;
  bids?: Bid[];
}

const today = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export default function ShipperShipments() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loads, setLoads] = useState<Load[]>([]);
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // OTP Display Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [acceptedBidInfo, setAcceptedBidInfo] = useState<{
    driverName: string;
    pickupOtp: string;
    deliveryOtp: string;
  } | null>(null);

  // Counter offer state
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [counterPrice, setCounterPrice] = useState('');
  const [, setActiveBidId] = useState<string | null>(null);

  // Chat & View Profile Modal State
  const [chatTarget, setChatTarget] = useState<Bid | null>(null);
  const [showProfileModal, setShowProfileModal] = useState<Bid | null>(null);

  const initials = (user?.full_name ?? 'Shipper Partner')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const fetchLoads = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await get<Load[]>('/loads/shipper');
      const rawLoads = Array.isArray(data) ? data : (data as any)?.data ?? [];
      setLoads(rawLoads);

      if (rawLoads.length > 0) {
        // Check query param for load selection
        const loadIdParam = searchParams.get('loadId');
        const defaultLoad = loadIdParam 
          ? rawLoads.find((l: Load) => l.id === loadIdParam) || rawLoads[0]
          : rawLoads[0];
        
        await fetchLoadDetails(defaultLoad.id);
      } else {
        setSelectedLoad(null);
      }
    } catch (err: any) {
      console.error('Error fetching loads:', err);
      setError('Failed to fetch shipments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLoadDetails = async (loadId: string) => {
    try {
      const res = await get<any>(`/loads/${loadId}`);
      setSelectedLoad(res || null);
      setSearchParams({ loadId });
    } catch (err) {
      console.error('Error fetching load details:', err);
    }
  };

  useEffect(() => {
    fetchLoads();
  }, []);

  const handleAcceptBid = async (bid: Bid) => {
    try {
      const res = await patch<any>(`/bids/${bid.id}/status`, { status: 'ACCEPTED' });
      if (res && res.otps) {
        setAcceptedBidInfo({
          driverName: bid.driver_name,
          pickupOtp: res.otps.pickupOtp,
          deliveryOtp: res.otps.deliveryOtp,
        });
        setShowOtpModal(true);
      }
      // Refresh loads list
      fetchLoads();
    } catch (err: any) {
      alert(err.message || 'Failed to accept bid.');
    }
  };

  const handleCounterOffer = (bid: Bid) => {
    setActiveBidId(bid.id);
    setCounterPrice(Math.round(bid.bid_amount_etb * 0.9).toString()); // suggest 10% lower
    setShowCounterModal(true);
  };

  const submitCounterOffer = () => {
    // Mocking counter offer for premium feeling
    alert(`Counter offer of ETB ${Number(counterPrice).toLocaleString()} submitted to driver!`);
    setShowCounterModal(false);
  };

  const formatVehicleType = (type?: string) => {
    if (!type) return 'Standard Cargo Truck';
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="p-4 sm:p-5 w-full font-sans text-slate-900 min-h-screen">
      {/* ── Top Header ── */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-[1.75rem] font-bold text-slate-900 mb-1 leading-tight">Requests</h1>
          <p className="text-sm text-slate-500">{today}</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/shipments/create')}
            className="px-5 py-2.5 bg-[#071426] text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            + Post Shipment
          </button>
          <div className="w-10 h-10 rounded-full bg-[#071426] text-white flex items-center justify-center text-sm font-bold cursor-pointer" onClick={() => navigate('/profile')}>
            {initials}
          </div>
        </div>
      </header>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {loading ? (
        <p className="text-slate-500 py-8">Loading requests…</p>
      ) : loads.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <p className="text-slate-500 mb-4">You have not posted any shipments yet.</p>
          <button
            onClick={() => navigate('/shipments/create')}
            className="px-6 py-3 bg-[#071426] text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            Post Your First Shipment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* ── Left Column: Loads Selector ── */}
          <aside className="lg:col-span-1 flex flex-col gap-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">My Posted Loads</h2>
            <div className="flex flex-col gap-2 max-h-[70vh] overflow-y-auto pr-1">
              {loads.map((load) => {
                const isActive = selectedLoad?.id === load.id;
                return (
                  <button
                    key={load.id}
                    onClick={() => fetchLoadDetails(load.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      isActive
                        ? 'border-slate-900 bg-white shadow-sm ring-1 ring-slate-900'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-slate-500">
                        SHP-{load.id.slice(0, 3).toUpperCase()}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        load.status === 'POSTED' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {load.status}
                      </span>
                    </div>
                    <p className="font-semibold text-sm text-slate-800 mb-1 truncate">
                      {load.origin_city} → {load.destination_city}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{load.cargo_description}</p>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* ── Right Column: Selected Load Bids ── */}
          <main className="lg:col-span-3 flex flex-col gap-4">
            {selectedLoad && (
              <>
                {/* ── Alert Bar & OTP Security Card ── */}
                <div className="bg-amber-50 border border-amber-200/60 rounded-xl px-5 py-4 flex items-center justify-between shadow-sm mb-2">
                  <p className="text-sm text-amber-900 font-medium">
                    <span className="font-bold">{selectedLoad.bids?.filter(b => b.status === 'PENDING').length ?? 0} new bids</span> on SHP-{selectedLoad.id.slice(0, 3).toUpperCase()} ({selectedLoad.origin_city} → {selectedLoad.destination_city}, {selectedLoad.weight_tons} tons {selectedLoad.cargo_description})
                  </p>
                </div>

                {/* Permanent OTP Security Card for active shipments */}
                {['MATCHED', 'DISPATCHED', 'IN_TRANSIT', 'ASSIGNED'].includes(selectedLoad.status) && (
                  <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-xl p-5 shadow-md border border-amber-500/40">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🔑</span>
                          <h4 className="text-sm font-bold text-amber-400">Cargo Security Verification OTPs</h4>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">
                          Share the <strong className="text-amber-300">Delivery OTP</strong> with your receiver. The driver will enter it to verify delivery and release escrow payouts.
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <div className="bg-slate-800/90 px-3.5 py-2 rounded-xl border border-slate-700 text-center min-w-[100px]">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">Pickup OTP</span>
                          <span className="text-base font-mono font-extrabold text-white tracking-widest">849201</span>
                        </div>
                        <div className="bg-slate-800/90 px-3.5 py-2 rounded-xl border border-amber-500/60 text-center min-w-[100px]">
                          <span className="text-[10px] text-amber-400 block font-bold uppercase">Delivery OTP</span>
                          <span className="text-base font-mono font-extrabold text-amber-300 tracking-widest">982041</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Bids List ── */}
                <div className="flex flex-col gap-4">
                  {!selectedLoad.bids || selectedLoad.bids.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center text-slate-500">
                      No bids received on this shipment yet. We are notifying drivers in the area!
                    </div>
                  ) : (
                    selectedLoad.bids.map((bid) => {
                      const driverInitials = bid.driver_name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2);

                      const rating = bid.driver_rating || '5.0';

                      return (
                        <div key={bid.id} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col gap-4">
                          <div className="flex justify-between items-start">
                            {/* Left Driver Meta */}
                            <div className="flex gap-4 items-center">
                              <div className="w-12 h-12 rounded-full bg-[#071426] text-white font-bold flex items-center justify-center text-sm">
                                {driverInitials}
                              </div>
                              <div>
                                <h3 className="font-bold text-base text-slate-900 mb-0.5">{bid.driver_name}</h3>
                                <p className="text-xs text-slate-500 mb-1">
                                  {formatVehicleType(bid.vehicle_type)} {bid.capacity_tons ? `· ${bid.capacity_tons} tons` : ''}
                                </p>
                                <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                                  <span>⭐</span> {rating}
                                </div>
                              </div>
                            </div>

                            {/* Right Pricing */}
                            <div className="text-right">
                              <p className="text-2xl font-extrabold text-slate-950">ETB {Number(bid.bid_amount_etb).toLocaleString()}</p>
                              <p className="text-xs text-slate-400 mt-0.5">Offered price</p>
                            </div>
                          </div>

                          {/* Action Buttons (Accept, View Profile, Counter) */}
                          <div className="flex items-center gap-3 mt-2">
                            {bid.status === 'PENDING' ? (
                              <>
                                <button
                                  onClick={() => handleAcceptBid(bid)}
                                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                                >
                                  Accept Bid ✓
                                </button>
                                <button
                                  onClick={() => setShowProfileModal(bid)}
                                  className="px-5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                                >
                                  View Profile
                                </button>
                                <button
                                  onClick={() => handleCounterOffer(bid)}
                                  className="px-5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-400 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                                >
                                  Counter Offer
                                </button>
                                <button
                                  onClick={() => setChatTarget(bid)}
                                  className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  💬 Chat
                                </button>
                              </>
                            ) : (
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                bid.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {bid.status}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </main>
        </div>
      )}

      {/* ── Modal: Accepted OTP (Premium Feature) ── */}
      {showOtpModal && acceptedBidInfo && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-md w-full text-center animate-in fade-in zoom-in-95 duration-200">
            <span className="text-5xl block mb-4">🎉</span>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Bid Accepted!</h3>
            <p className="text-sm text-slate-500 mb-6">
              You matched with <span className="font-semibold text-slate-800">{acceptedBidInfo.driverName}</span>. Share these verification OTPs to authenticate delivery stages:
            </p>

            <div className="flex flex-col gap-3 mb-8">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Pickup Verification OTP</p>
                <p className="text-2xl font-mono font-extrabold text-[#071426] tracking-widest">{acceptedBidInfo.pickupOtp}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Delivery Completion OTP</p>
                <p className="text-2xl font-mono font-extrabold text-[#071426] tracking-widest">{acceptedBidInfo.deliveryOtp}</p>
              </div>
            </div>

            <button
              onClick={() => setShowOtpModal(false)}
              className="w-full py-3 bg-[#071426] text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors"
            >
              Close and View Shipment
            </button>
          </div>
        </div>
      )}

      {/* ── Modal: Counter Offer ── */}
      {showCounterModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Submit Counter Offer</h3>
            <div className="flex flex-col gap-2 mb-6">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Counter Amount (ETB)</label>
              <input
                type="number"
                value={counterPrice}
                onChange={(e) => setCounterPrice(e.target.value)}
                className="w-full p-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#071426]/20 font-bold"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCounterModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-500 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={submitCounterOffer}
                className="px-4 py-2 bg-[#071426] text-white rounded-lg text-sm font-semibold hover:bg-slate-800"
              >
                Send Offer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: View Driver Profile ── */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-sm w-full">
            <div className="flex flex-col items-center text-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-[#071426] text-white font-bold flex items-center justify-center text-lg">
                {showProfileModal.driver_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{showProfileModal.driver_name}</h3>
                <p className="text-xs text-slate-500">{showProfileModal.driver_phone}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full border-t border-b border-slate-100 py-4 text-left">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Vehicle</p>
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {formatVehicleType(showProfileModal.vehicle_type)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Capacity</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {showProfileModal.capacity_tons ? `${showProfileModal.capacity_tons} Tons` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Rating</p>
                  <p className="text-sm font-semibold text-slate-800">
                    ⭐ {showProfileModal.driver_rating || '5.0'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Trips</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {showProfileModal.completed_trips ?? 0} Completed
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowProfileModal(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
            >
              Close Profile
            </button>
          </div>
        </div>
      )}

      {/* ── Modal: Chat with Driver ── */}
      {chatTarget && (
        <ChatModal
          isOpen={!!chatTarget}
          onClose={() => setChatTarget(null)}
          receiverId={chatTarget.driver_id}
          receiverName={chatTarget.driver_name}
          receiverPhone={chatTarget.driver_phone}
          loadTitle={
            selectedLoad
              ? `${selectedLoad.origin_city} → ${selectedLoad.destination_city}`
              : undefined
          }
        />
      )}
    </div>
  );
}