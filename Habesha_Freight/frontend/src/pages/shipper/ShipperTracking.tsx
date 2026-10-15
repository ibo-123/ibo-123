// src/pages/shipper/ShipperTracking.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, post } from '../../services/api';
import { getStoredUser } from '../../services/authService';
import GoogleMapView, { LocationPoint, resolveCityCoords } from '../../components/GoogleMapView';

interface Shipment {
  id: string;
  load_id: string;
  carrier_id: string;
  vehicle_id?: string;
  status: 'ASSIGNED' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED';
  cargo_description: string;
  weight_tons: number;
  origin_city: string;
  destination_city: string;
  origin_lat?: number;
  origin_lng?: number;
  destination_lat?: number;
  destination_lng?: number;
  offered_price_etb: number;
  shipper_name: string;
  carrier_name: string;
  created_at: string;
}

const today = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const formatCurrency = (n: number) => `ETB ${Number(n).toLocaleString()}`;

export default function ShipperTracking() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [activeShipmentId, setActiveShipmentId] = useState<string | null>(null);
  const [deliveryOtp, setDeliveryOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Live Track Modal State
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [trackingShipment, setTrackingShipment] = useState<Shipment | null>(null);
  const [trackingPoints, setTrackingPoints] = useState<LocationPoint[]>([]);
  const [driverPos, setDriverPos] = useState<LocationPoint | null>(null);
  const [trackSpeed, setTrackSpeed] = useState(0);
  const [loadingTracking, setLoadingTracking] = useState(false);

  const initials = (user?.full_name ?? 'Sara Bekele')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const fetchShipments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await get<Shipment[]>('/shipments');
      const raw = Array.isArray(res) ? res : (res as any)?.data ?? [];
      setShipments(raw);
    } catch (err: any) {
      console.error('Error fetching shipments:', err);
      setError('Unable to load deliveries. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const handleOpenOtp = (shipmentId: string) => {
    setActiveShipmentId(shipmentId);
    setDeliveryOtp('');
    setOtpError(null);
    setShowOtpModal(true);
  };

  const handleVerifyOtp = async () => {
    if (!deliveryOtp.trim()) {
      setOtpError('OTP is required.');
      return;
    }
    setVerifying(true);
    setOtpError(null);
    try {
      await post(`/shipments/${activeShipmentId}/delivery-verify`, {
        delivery_otp: deliveryOtp,
      });
      setShowOtpModal(false);
      fetchShipments(); // refresh
    } catch (err: any) {
      setOtpError(err.message || 'Invalid Delivery OTP code. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const loadTrackingData = async (shipment: Shipment) => {
    setLoadingTracking(true);
    try {
      const res = await get<any>(`/tracking/${shipment.id}`);
      const crumbs: LocationPoint[] = (res?.breadcrumbs || []).map((b: any) => ({
        lat: Number(b.lat ?? b.latitude),
        lng: Number(b.lng ?? b.longitude),
      })).filter((p: LocationPoint) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
      setTrackingPoints(crumbs);

      const latest = res?.latestPoint;
      if (latest) {
        const lat = Number(latest.lat ?? latest.latitude);
        const lng = Number(latest.lng ?? latest.longitude);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          setDriverPos({ lat, lng, label: `Driver: ${shipment.carrier_name}` });
        }
        if (latest.speed != null) setTrackSpeed(Math.round(Number(latest.speed)));
      } else if (crumbs.length > 0) {
        const last = crumbs[crumbs.length - 1];
        setDriverPos({ ...last, label: `Driver: ${shipment.carrier_name}` });
      } else {
        setDriverPos(null);
      }
    } catch (err) {
      console.error('Error fetching tracking:', err);
      setTrackingPoints([]);
      setDriverPos(null);
    } finally {
      setLoadingTracking(false);
    }
  };

  const handleTrack = async (shipment: Shipment) => {
    setTrackingShipment(shipment);
    setShowTrackModal(true);
    setTrackingPoints([]);
    setDriverPos(null);
    await loadTrackingData(shipment);
  };

  useEffect(() => {
    if (!showTrackModal || !trackingShipment) return;
    const poll = window.setInterval(() => {
      void loadTrackingData(trackingShipment);
    }, 8000);
    return () => window.clearInterval(poll);
  }, [showTrackModal, trackingShipment?.id]);

  const getStatusBadgeColor = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'IN_TRANSIT') return 'bg-blue-100 text-blue-800';
    if (s === 'ASSIGNED') return 'bg-pink-100 text-pink-800';
    if (s === 'DISPATCHED') return 'bg-yellow-100 text-yellow-800';
    if (s === 'DELIVERED') return 'bg-emerald-100 text-emerald-800';
    return 'bg-purple-100 text-purple-800';
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Determine progress bar state based on shipment status
  const getProgressState = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'DELIVERED') return 4;
    if (s === 'IN_TRANSIT') return 2.5; // halfway between Picked Up and Out for Delivery
    if (s === 'DISPATCHED') return 2;
    return 1; // ASSIGNED
  };

  const isFleetCompany = (name: string) => {
    const lower = name.toLowerCase();
    return lower.includes('solutions') || lower.includes('transport') || lower.includes('logistics') || lower.includes('company') || lower.includes('fleet');
  };

  return (
    <div className="p-4 sm:p-5 w-full font-sans text-slate-900 min-h-screen">
      {/* ── Top Header ── */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-[1.75rem] font-bold text-slate-900 mb-1 leading-tight">Deliveries</h1>
          <p className="text-sm text-slate-500">{today}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#071426] text-white flex items-center justify-center text-sm font-bold cursor-pointer" onClick={() => navigate('/profile')}>
            {initials}
          </div>
        </div>
      </header>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {loading ? (
        <p className="text-slate-500 py-8">Loading deliveries…</p>
      ) : shipments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center text-slate-500">
          No active shipments or deliveries found.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {shipments.map((shipment) => {
            const progress = getProgressState(shipment.status);
            const isFleet = isFleetCompany(shipment.carrier_name);

            return (
              <div key={shipment.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col gap-6">
                {/* Top Info row */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base font-bold text-slate-900">
                        SHP-{shipment.id.slice(0, 3).toUpperCase()}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeColor(shipment.status)}`}>
                        {getStatusLabel(shipment.status)}
                      </span>
                      {isFleet && (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                          Fleet
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-800 mb-0.5">
                      {shipment.origin_city} → {shipment.destination_city} · {shipment.cargo_description}
                    </p>
                    <p className="text-xs text-slate-400">
                      {shipment.carrier_name}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-bold text-slate-950">{formatCurrency(shipment.offered_price_etb)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(shipment.created_at)}</p>
                  </div>
                </div>

                {/* Progress track */}
                <div className="relative flex flex-col gap-2 mt-2">
                  <div className="absolute top-1.5 left-0 right-0 h-1 bg-slate-100 rounded-full z-0" />
                  <div 
                    className="absolute top-1.5 left-0 h-1 bg-slate-900 rounded-full z-0 transition-all duration-500" 
                    style={{ width: `${((progress - 1) / 3) * 100}%` }}
                  />

                  <div className="relative flex justify-between z-10">
                    {/* Node 1 */}
                    <div className="flex flex-col items-center">
                      <div className={`w-4 h-4 rounded-full border-4 ${
                        progress >= 1 ? 'border-blue-600 bg-white' : 'border-slate-200 bg-white'
                      }`} />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">Assigned</span>
                    </div>

                    {/* Node 2 */}
                    <div className="flex flex-col items-center">
                      <div className={`w-4 h-4 rounded-full border-4 ${
                        progress >= 2 ? 'border-blue-600 bg-white' : 'border-slate-200 bg-white'
                      }`} />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">In Transit</span>
                    </div>

                    {/* Node 3 */}
                    <div className="flex flex-col items-center">
                      <div className={`w-4 h-4 rounded-full border-4 ${
                        progress >= 3 ? 'border-blue-600 bg-white' : 'border-slate-200 bg-white'
                      }`} />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">Out For Delivery</span>
                    </div>

                    {/* Node 4 */}
                    <div className="flex flex-col items-center">
                      <div className={`w-4 h-4 rounded-full border-4 ${
                        progress >= 4 ? 'border-blue-600 bg-white' : 'border-slate-200 bg-white'
                      }`} />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">Delivered</span>
                    </div>
                  </div>
                </div>

                {/* Actions row */}
                <div className="flex gap-4 mt-2">
                  <button
                    onClick={() => handleTrack(shipment)}
                    className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer bg-white"
                  >
                    📍 Track
                  </button>
                  {shipment.status !== 'DELIVERED' && (
                    <button
                      onClick={() => handleOpenOtp(shipment.id)}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      Confirm Delivery ✓
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal: Enter Delivery OTP ── */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-sm w-full animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Confirm Shipment Delivery</h3>
            <p className="text-xs text-slate-500 mb-6">
              Enter the 6-digit Delivery Completion OTP to confirm successful receipt and release escrow funds.
            </p>

            {otpError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-xs font-semibold">{otpError}</div>
            )}

            <div className="flex flex-col gap-2 mb-6">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">6-Digit OTP</label>
              <input
                type="text"
                maxLength={6}
                value={deliveryOtp}
                onChange={(e) => setDeliveryOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 584920"
                className="w-full p-3 rounded-lg border border-slate-200 text-center tracking-widest text-lg font-extrabold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowOtpModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-500 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyOtp}
                disabled={verifying}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
              >
                {verifying ? 'Confirming...' : 'Verify & Complete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Live GPS Tracking ── */}
      {showTrackModal && trackingShipment && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Tracking SHP-{trackingShipment.id.slice(0, 3).toUpperCase()}
                </h3>
                <p className="text-xs text-slate-500">
                  {trackingShipment.origin_city} → {trackingShipment.destination_city}
                </p>
              </div>
              <button 
                onClick={() => setShowTrackModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Live map with real breadcrumbs */}
            <div className="mb-6">
              {loadingTracking && trackingPoints.length === 0 && !driverPos ? (
                <p className="text-xs text-slate-500 py-8 text-center">Loading live GPS…</p>
              ) : (
                <GoogleMapView
                  originPos={{
                    ...(Number.isFinite(Number(trackingShipment.origin_lat))
                      ? { lat: Number(trackingShipment.origin_lat), lng: Number(trackingShipment.origin_lng) }
                      : resolveCityCoords(trackingShipment.origin_city, 9.03, 38.74)),
                    label: trackingShipment.origin_city,
                  }}
                  destinationPos={{
                    ...(Number.isFinite(Number(trackingShipment.destination_lat))
                      ? {
                          lat: Number(trackingShipment.destination_lat),
                          lng: Number(trackingShipment.destination_lng),
                        }
                      : resolveCityCoords(trackingShipment.destination_city, 9.6, 41.86)),
                    label: trackingShipment.destination_city,
                  }}
                  driverPos={
                    driverPos || {
                      ...resolveCityCoords(trackingShipment.origin_city, 9.03, 38.74),
                      label: `Driver: ${trackingShipment.carrier_name}`,
                    }
                  }
                  breadcrumbs={trackingPoints}
                  speed={trackSpeed}
                  height="260px"
                />
              )}
              <p className="text-[11px] text-slate-400 mt-2 text-center">
                {trackingPoints.length > 0
                  ? `${trackingPoints.length} GPS points · live refresh every 8s`
                  : 'Waiting for driver GPS broadcasts…'}
              </p>
            </div>

            {/* Tracking timeline */}
            <div className="flex flex-col gap-4 max-h-[30vh] overflow-y-auto">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status History</h4>
              <div className="flex flex-col gap-3 relative pl-4 border-l border-slate-200">
                {/* Completed status steps */}
                {trackingShipment.status === 'DELIVERED' && (
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <p className="text-xs font-bold text-slate-800">Delivered</p>
                    <p className="text-[10px] text-slate-400">Escrow released & cargo received</p>
                  </div>
                )}
                {['IN_TRANSIT', 'DELIVERED'].includes(trackingShipment.status) && (
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <p className="text-xs font-bold text-slate-800">In Transit</p>
                    <p className="text-[10px] text-slate-400">Cargo picked up by driver</p>
                  </div>
                )}
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-900" />
                  <p className="text-xs font-bold text-slate-800">Assigned</p>
                  <p className="text-[10px] text-slate-400">Driver confirmed and matching complete</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}