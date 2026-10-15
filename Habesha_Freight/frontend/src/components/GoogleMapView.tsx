import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface LocationPoint {
  lat: number;
  lng: number;
  label?: string;
}

interface GoogleMapViewProps {
  driverPos?: LocationPoint | null;
  originPos?: LocationPoint | null;
  destinationPos?: LocationPoint | null;
  breadcrumbs?: LocationPoint[];
  speed?: number;
  height?: string;
  className?: string;
  zoom?: number;
}

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'addis ababa': { lat: 9.03, lng: 38.74 },
  adama: { lat: 8.54, lng: 39.27 },
  'dire dawa': { lat: 9.6, lng: 41.86 },
  hawassa: { lat: 7.06, lng: 38.47 },
  mekelle: { lat: 13.49, lng: 39.47 },
  'bahir dar': { lat: 11.59, lng: 37.39 },
  gondar: { lat: 12.6, lng: 37.46 },
  jimma: { lat: 7.67, lng: 36.83 },
  djibouti: { lat: 11.588, lng: 43.145 },
};

export function resolveCityCoords(
  name: string,
  fallbackLat: number,
  fallbackLng: number
): { lat: number; lng: number } {
  if (!name) return { lat: fallbackLat, lng: fallbackLng };
  const key = name.trim().toLowerCase();
  for (const city in CITY_COORDS) {
    if (key.includes(city)) return CITY_COORDS[city];
  }
  return { lat: fallbackLat, lng: fallbackLng };
}

function markerIcon(color: string, emoji: string) {
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${color};
      color:#fff;
      width:32px;height:32px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);
      font-size:14px;line-height:1;
    ">${emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

function isValidPoint(p?: LocationPoint | null): p is LocationPoint {
  return !!p && Number.isFinite(p.lat) && Number.isFinite(p.lng);
}

export default function GoogleMapView({
  driverPos,
  originPos,
  destinationPos,
  breadcrumbs = [],
  speed = 0,
  height = '360px',
  className = '',
  zoom = 8,
}: GoogleMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center: L.LatLngExpression = isValidPoint(driverPos)
      ? [driverPos.lat, driverPos.lng]
      : isValidPoint(originPos)
        ? [originPos.lat, originPos.lng]
        : [9.03, 38.74];

    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // Leaflet needs a resize after mount in flex/modals
    const t = window.setTimeout(() => map.invalidateSize(), 80);
    return () => {
      window.clearTimeout(t);
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layers = layerRef.current;
    if (!map || !layers) return;

    layers.clearLayers();
    const bounds: L.LatLngExpression[] = [];

    if (isValidPoint(originPos)) {
      L.marker([originPos.lat, originPos.lng], { icon: markerIcon('#10B981', 'A') })
        .bindPopup(originPos.label || 'Pickup')
        .addTo(layers);
      bounds.push([originPos.lat, originPos.lng]);
    }

    if (isValidPoint(destinationPos)) {
      L.marker([destinationPos.lat, destinationPos.lng], { icon: markerIcon('#EF4444', 'B') })
        .bindPopup(destinationPos.label || 'Destination')
        .addTo(layers);
      bounds.push([destinationPos.lat, destinationPos.lng]);
    }

    if (isValidPoint(driverPos)) {
      L.marker([driverPos.lat, driverPos.lng], { icon: markerIcon('#C8933A', '🚚') })
        .bindPopup(driverPos.label || 'Driver')
        .addTo(layers);
      bounds.push([driverPos.lat, driverPos.lng]);
    }

    const trail = breadcrumbs.filter((b) => Number.isFinite(b.lat) && Number.isFinite(b.lng));
    if (trail.length >= 2) {
      const path = trail.map((b) => [b.lat, b.lng] as L.LatLngExpression);
      L.polyline(path, { color: '#2563EB', weight: 4, opacity: 0.85 }).addTo(layers);
      path.forEach((p) => bounds.push(p));
    } else if (isValidPoint(originPos) && isValidPoint(destinationPos)) {
      const path: L.LatLngExpression[] = [
        [originPos.lat, originPos.lng],
        ...(isValidPoint(driverPos) ? [[driverPos.lat, driverPos.lng] as L.LatLngExpression] : []),
        [destinationPos.lat, destinationPos.lng],
      ];
      L.polyline(path, { color: '#C8933A', weight: 4, opacity: 0.75, dashArray: '8 6' }).addTo(layers);
    }

    if (bounds.length >= 2) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [36, 36], maxZoom: 12 });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], Math.max(zoom, 10));
    }

    window.setTimeout(() => map.invalidateSize(), 50);
  }, [driverPos, originPos, destinationPos, breadcrumbs, zoom]);

  const statusLabel = isValidPoint(driverPos)
    ? `${driverPos.lat.toFixed(4)}, ${driverPos.lng.toFixed(4)}`
    : 'Waiting for GPS…';

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-slate-100 ${className}`}
      style={{ height }}
    >
      <div ref={containerRef} className="w-full h-full z-0" />
      <div className="absolute top-3 left-3 right-3 z-[5] flex justify-between gap-2 pointer-events-none">
        <div className="bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 shadow text-xs font-bold text-emerald-700 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live Map
        </div>
        <div className="bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 shadow text-xs font-semibold text-slate-600">
          {speed > 0 ? `${speed} km/h · ` : ''}
          {statusLabel}
        </div>
      </div>
    </div>
  );
}
