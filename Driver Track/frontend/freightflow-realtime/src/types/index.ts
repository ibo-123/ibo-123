export type Role = "customer" | "driver" | "dispatcher" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  avatarUrl?: string;
  status?: "active" | "suspended" | "pending";
  createdAt?: string;
}

export type TripStatus =
  | "pending"
  | "assigned"
  | "in_transit"
  | "delayed"
  | "completed"
  | "cancelled";

export interface Coordinates {
  lat: number;
  lng: number;
  accuracy?: number;
  speed?: number | null;
  heading?: number | null;
  timestamp?: number;
}

export interface Trip {
  tripId: string;
  status: TripStatus;
  origin?: { label?: string; lat?: number; lng?: number };
  destination?: { label?: string; lat?: number; lng?: number };
  driver?: { id?: string; name?: string; phone?: string; vehicle?: string };
  customer?: { id?: string; name?: string; phone?: string };
  cargo?: string;
  weightKg?: number;
  distanceKm?: number;
  etaMinutes?: number;
  currentLocation?: Coordinates | null;
  lastUpdate?: string | number | null;
  createdAt?: string;
  completedAt?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  vehicle?: string;
  plate?: string;
  status: "available" | "on_delivery" | "offline";
  rating?: number;
  activeTripId?: string | null;
  totalTrips?: number;
  totalDistanceKm?: number;
  currentLocation?: Coordinates | null;
}

export interface NotificationItem {
  id: string;
  title: string;
  body?: string;
  createdAt: string;
  read?: boolean;
  level?: "info" | "success" | "warning" | "error";
}
