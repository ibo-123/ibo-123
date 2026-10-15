import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { DEFAULT_CENTER, type FreightMapProps } from "@/components/map/map-types";
import { cn } from "@/lib/utils";

function driverIcon(live?: boolean) {
  const pulse = live
    ? '<span class="gps-pulse" style="position:absolute;inset:0;border-radius:9999px;background:color-mix(in oklab, var(--color-success) 55%, transparent);"></span>'
    : "";
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:36px;height:36px;">${pulse}
      <span style="position:absolute;inset:5px;border-radius:9999px;display:grid;place-items:center;background:var(--color-primary);color:var(--color-primary-foreground);font-size:15px;box-shadow:0 6px 16px rgba(0,0,0,.3);">&#128666;</span>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -16],
  });
}

const destinationIcon = () =>
  L.divIcon({
    className: "",
    html: `<div style="width:30px;height:30px;border-radius:9999px 9999px 9999px 2px;transform:rotate(-45deg);display:grid;place-items:center;background:var(--color-accent);color:var(--color-accent-foreground);box-shadow:0 6px 16px rgba(0,0,0,.28);">
      <span style="transform:rotate(45deg);font-size:14px;">&#127937;</span></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 28],
    popupAnchor: [0, -24],
  });

function ViewportController({
  points,
  autoCenter,
  zoom,
}: {
  points: Array<[number, number]>;
  autoCenter?: boolean;
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!autoCenter || points.length === 0) return;
    const first = points[0]!;
    if (points.length === 1) {
      map.setView(first, Math.max(map.getZoom(), zoom), { animate: true });
      return;
    }
    map.fitBounds(L.latLngBounds(points).pad(0.25), { animate: true });
  }, [map, autoCenter, zoom, JSON.stringify(points)]);

  return null;
}

export default function FreightMap({
  drivers = [],
  destination = null,
  showRoute = false,
  autoCenter = true,
  showAccuracy = true,
  zoom = 13,
  className,
  emptyLabel = "Waiting for a live GPS signal…",
}: FreightMapProps) {
  const points = useMemo(() => {
    const list: Array<[number, number]> = drivers.map((d) => [d.location.lat, d.location.lng]);
    if (destination) list.push([destination.lat, destination.lng]);
    return list;
  }, [drivers, destination]);

  const center = points[0] ?? DEFAULT_CENTER;
  const primaryDriver = drivers[0];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border",
        className ?? "h-[420px] w-full",
      )}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        className="h-full w-full"
        attributionControl
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />

        {drivers.map((driver) => (
          <Marker
            key={driver.id}
            position={[driver.location.lat, driver.location.lng]}
            icon={driverIcon(driver.live)}
          >
            <Popup>
              <div className="space-y-1 text-xs">
                <p className="font-semibold">{driver.label}</p>
                {driver.sublabel ? <p className="opacity-70">{driver.sublabel}</p> : null}
                <p className="opacity-70">
                  {driver.location.lat.toFixed(5)}, {driver.location.lng.toFixed(5)}
                </p>
                {driver.location.accuracy ? (
                  <p className="opacity-70">±{Math.round(driver.location.accuracy)} m accuracy</p>
                ) : null}
              </div>
            </Popup>
          </Marker>
        ))}

        {showAccuracy && primaryDriver?.location.accuracy ? (
          <Circle
            center={[primaryDriver.location.lat, primaryDriver.location.lng]}
            radius={primaryDriver.location.accuracy}
            pathOptions={{ color: "var(--color-info)", weight: 1, fillOpacity: 0.12 }}
          />
        ) : null}

        {destination ? (
          <Marker position={[destination.lat, destination.lng]} icon={destinationIcon()}>
            <Popup>
              <p className="text-xs font-semibold">{destination.label ?? "Destination"}</p>
            </Popup>
          </Marker>
        ) : null}

        {showRoute && destination && primaryDriver ? (
          <Polyline
            positions={[
              [primaryDriver.location.lat, primaryDriver.location.lng],
              [destination.lat, destination.lng],
            ]}
            pathOptions={{
              color: "var(--color-accent)",
              weight: 4,
              opacity: 0.85,
              dashArray: "8 10",
            }}
          />
        ) : null}

        <ViewportController points={points} autoCenter={autoCenter} zoom={zoom} />
      </MapContainer>

      {drivers.length === 0 && !destination ? (
        <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-lg bg-card/90 px-3 py-2 text-center text-xs text-muted-foreground backdrop-blur">
          {emptyLabel}
        </div>
      ) : null}
    </div>
  );
}
