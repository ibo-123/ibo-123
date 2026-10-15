import type { Coordinates } from "@/types";

export interface MapDriverMarker {
  id: string;
  label: string;
  sublabel?: string;
  location: Coordinates;
  live?: boolean;
}

export interface MapDestination {
  label?: string;
  lat: number;
  lng: number;
}

export interface FreightMapProps {
  drivers?: MapDriverMarker[];
  destination?: MapDestination | null;
  /** Draws a straight-line route between driver and destination. */
  showRoute?: boolean;
  autoCenter?: boolean;
  showAccuracy?: boolean;
  zoom?: number;
  className?: string;
  emptyLabel?: string;
}

/** Addis Ababa — used only as an initial viewport, never as a driver position. */
export const DEFAULT_CENTER: [number, number] = [9.0192, 38.7525];

export function haversineKm(a: Coordinates | MapDestination, b: Coordinates | MapDestination) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function etaMinutes(distanceKm: number, avgSpeedKmh = 35) {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return 0;
  return Math.max(1, Math.round((distanceKm / avgSpeedKmh) * 60));
}
