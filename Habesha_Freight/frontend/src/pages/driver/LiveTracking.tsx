import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GoogleMapView, { LocationPoint, resolveCityCoords } from '../../components/GoogleMapView';
import PageHeader from '../../components/PageHeader';
import { useDriverShipments } from '../../hooks/useDriverShipments';
import { get, post } from '../../services/api';

interface TrackingPayload {
  shipment_id: string;
  status: string;
  breadcrumbs?: Array<{ lat?: number; lng?: number; latitude?: number; longitude?: number; speed?: number | null }>;
  latestPoint?: { latitude?: number; longitude?: number; lat?: number; lng?: number; speed?: number };
}

function toNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function haversineKm(a: LocationPoint, b: LocationPoint): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)) * 10) / 10;
}

export default function LiveTracking() {
  const navigate = useNavigate();
  const { shipments, loading, error, refresh } = useDriverShipments();

  const activeShipment = useMemo(
    () =>
      shipments.find((s) => ['IN_TRANSIT', 'DISPATCHED', 'ASSIGNED'].includes(s.status)) ||
      shipments[0] ||
      null,
    [shipments]
  );

  const [isBroadcasting, setIsBroadcasting] = useState(true);
  const [driverPos, setDriverPos] = useState<LocationPoint | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<LocationPoint[]>([]);
  const [speed, setSpeed] = useState(0);
  const [lastUpdate, setLastUpdate] = useState('—');
  const [broadcastStatus, setBroadcastStatus] = useState('Connecting GPS…');
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const driverPosRef = useRef<LocationPoint | null>(null);

  const origin = useMemo<LocationPoint | null>(() => {
    if (!activeShipment) return null;
    const lat = toNumber((activeShipment as any).origin_lat, NaN);
    const lng = toNumber((activeShipment as any).origin_lng, NaN);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng, label: activeShipment.origin_city || 'Pickup' };
    }
    return {
      ...resolveCityCoords(activeShipment.origin_city || '', 9.03, 38.74),
      label: activeShipment.origin_city || 'Pickup',
    };
  }, [activeShipment]);

  const destination = useMemo<LocationPoint | null>(() => {
    if (!activeShipment) return null;
    const lat = toNumber((activeShipment as any).destination_lat, NaN);
    const lng = toNumber((activeShipment as any).destination_lng, NaN);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng, label: activeShipment.destination_city || 'Destination' };
    }
    return {
      ...resolveCityCoords(activeShipment.destination_city || '', 9.6, 41.86),
      label: activeShipment.destination_city || 'Destination',
    };
  }, [activeShipment]);

  const fetchTracking = useCallback(async () => {
    if (!activeShipment?.id) return;
    try {
      const data = await get<TrackingPayload>(`/tracking/${activeShipment.id}`);
      const trail = (data.breadcrumbs || [])
        .map((b) => ({
          lat: toNumber(b.lat ?? b.latitude, NaN),
          lng: toNumber(b.lng ?? b.longitude, NaN),
        }))
        .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
      setBreadcrumbs(trail);

      const latest = data.latestPoint;
      if (latest) {
        const lat = toNumber(latest.lat ?? latest.latitude, NaN);
        const lng = toNumber(latest.lng ?? latest.longitude, NaN);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          const point = { lat, lng, label: 'Your truck' };
          driverPosRef.current = point;
          setDriverPos(point);
          if (latest.speed != null) setSpeed(Math.round(Number(latest.speed)));
        }
      }

      if (destination && trail.length > 0) {
        setDistanceKm(haversineKm(trail[trail.length - 1], destination));
      }
    } catch {
      // keep last known map state
    }
  }, [activeShipment?.id, destination]);

  useEffect(() => {
    fetchTracking();
    const poll = window.setInterval(fetchTracking, 10000);
    return () => window.clearInterval(poll);
  }, [fetchTracking]);

  useEffect(() => {
    if (!isBroadcasting || !activeShipment?.id) {
      if (watchIdRef.current != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    const shipmentId = activeShipment.id;

    const pushPoint = async (lat: number, lng: number, nextSpeed: number) => {
      const point = { lat, lng, label: 'Your truck' };
      driverPosRef.current = point;
      setDriverPos(point);
      setSpeed(nextSpeed);
      setLastUpdate(new Date().toLocaleTimeString());
      try {
        await post('/tracking/location', {
          shipment_id: shipmentId,
          latitude: lat,
          longitude: lng,
          speed: nextSpeed,
        });
        setBroadcastStatus('Live GPS broadcasted ✓');
        setBreadcrumbs((prev) => [...prev, { lat, lng }]);
        if (destination) setDistanceKm(haversineKm(point, destination));
      } catch (err: any) {
        setBroadcastStatus(err?.message || 'Broadcast failed');
      }
    };

    if (!navigator.geolocation) {
      setBroadcastStatus('Geolocation unavailable — simulating route pings');
      const timer = window.setInterval(() => {
        if (!origin || !destination) return;
        const current = driverPosRef.current || origin;
        const nextLat = current.lat + (destination.lat - origin.lat) * 0.015;
        const nextLng = current.lng + (destination.lng - origin.lng) * 0.015;
        void pushPoint(nextLat, nextLng, 55 + Math.floor(Math.random() * 20));
      }, 8000);
      return () => window.clearInterval(timer);
    }

    setBroadcastStatus('Broadcasting live GPS…');
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const nextSpeed =
          pos.coords.speed != null && pos.coords.speed > 0
            ? Math.round(pos.coords.speed * 3.6)
            : 0;
        void pushPoint(pos.coords.latitude, pos.coords.longitude, nextSpeed);
      },
      () => setBroadcastStatus('GPS permission denied — enable location access'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isBroadcasting, activeShipment?.id, origin, destination]);

  if (loading) {
    return <div className="p-4 sm:p-5 text-slate-500">Loading active shipment for tracking…</div>;
  }

  if (!activeShipment) {
    return (
      <div className="p-4 sm:p-5 max-w-3xl mx-auto">
        <PageHeader title="Live GPS Tracking" subtitle="No active shipment assigned to you yet." />
        <button
          onClick={() => navigate('/driver/requests/loads')}
          className="mt-4 px-4 py-2 bg-amber-500 text-slate-950 rounded-xl text-sm font-bold"
        >
          Browse available loads
        </button>
      </div>
    );
  }

  const etaHours =
    distanceKm != null
      ? (distanceKm / (speed > 5 ? speed : 60)).toFixed(1)
      : '—';

  return (
    <div className="p-4 sm:p-5 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <PageHeader
          title="Live GPS Tracking"
          subtitle={`${activeShipment.origin_city || 'Origin'} → ${activeShipment.destination_city || 'Destination'}`}
        />
        <div className="flex gap-2">
          <button
            onClick={() => refresh()}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700"
          >
            Refresh
          </button>
          <button
            onClick={() => setIsBroadcasting((v) => !v)}
            className={`px-4 py-2 rounded-xl text-xs font-bold ${
              isBroadcasting ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-slate-950'
            }`}
          >
            {isBroadcasting ? 'Broadcasting GPS' : 'Resume Broadcast'}
          </button>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="bg-white rounded-2xl p-4 border border-slate-200 mb-4 flex flex-col md:flex-row justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Shipment</p>
          <p className="font-mono text-sm font-bold text-slate-900">{activeShipment.id}</p>
          <p className="text-xs text-slate-500 mt-1">{activeShipment.status.replace(/_/g, ' ')}</p>
        </div>
        <div className="md:text-right">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Broadcast</p>
          <p className="text-xs font-bold text-emerald-600 mt-0.5">{broadcastStatus}</p>
        </div>
      </div>

      <div className="mb-6">
        <GoogleMapView
          driverPos={driverPos || origin}
          originPos={origin}
          destinationPos={destination}
          breadcrumbs={breadcrumbs}
          speed={speed}
          height="450px"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200">
          <p className="text-2xl font-bold">
            {speed || 0} <span className="text-xs text-slate-400">km/h</span>
          </p>
          <p className="text-xs font-bold text-slate-400 uppercase">Speed</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200">
          <p className="text-2xl font-bold">
            {distanceKm ?? '—'} <span className="text-xs text-slate-400">km</span>
          </p>
          <p className="text-xs font-bold text-slate-400 uppercase">Distance remaining</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200">
          <p className="text-2xl font-bold">
            {etaHours} <span className="text-xs text-slate-400">hrs</span>
          </p>
          <p className="text-xs font-bold text-slate-400 uppercase">ETA</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200">
          <p className="text-sm font-bold truncate">{lastUpdate}</p>
          <p className="text-xs font-bold text-slate-400 uppercase">Last ping</p>
        </div>
      </div>
    </div>
  );
}
