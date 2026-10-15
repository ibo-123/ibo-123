import api from "./api";
import type { Trip, TripStatus } from "@/types";

function unwrapTrip(payload: unknown): Trip {
  const data = payload as { trip?: Trip; data?: Trip } & Trip;
  return (data?.trip ?? data?.data ?? data) as Trip;
}

function unwrapTrips(payload: unknown): Trip[] {
  const data = payload as { trips?: Trip[]; data?: Trip[] } | Trip[];
  if (Array.isArray(data)) return data;
  return data?.trips ?? data?.data ?? [];
}

export const tripService = {
  /** Public tracking lookup for an exact Trip ID (e.g. TRIP-H5UGGP). */
  async getTrip(tripId: string): Promise<Trip> {
    const { data } = await api.get(`/trips/${encodeURIComponent(tripId)}`);
    return unwrapTrip(data);
  },
  async listTrips(params?: {
    status?: TripStatus | "all";
    driverId?: string;
    customerId?: string;
    search?: string;
    limit?: number;
  }): Promise<Trip[]> {
    const { data } = await api.get("/trips", { params });
    return unwrapTrips(data);
  },
  async myTrips(params?: { status?: TripStatus | "all" }): Promise<Trip[]> {
    const { data } = await api.get("/trips/me", { params });
    return unwrapTrips(data);
  },
  /** Backend generates and returns the Trip ID. */
  async startTrip(payload: {
    destination?: { label?: string; lat?: number; lng?: number };
    cargo?: string;
    weightKg?: number;
    customerId?: string;
  }): Promise<Trip> {
    const { data } = await api.post("/trips", payload);
    return unwrapTrip(data);
  },
  async updateTripStatus(tripId: string, status: TripStatus): Promise<Trip> {
    const { data } = await api.patch(`/trips/${encodeURIComponent(tripId)}/status`, { status });
    return unwrapTrip(data);
  },
  async assignTrip(tripId: string, driverId: string): Promise<Trip> {
    const { data } = await api.patch(`/trips/${encodeURIComponent(tripId)}/assign`, { driverId });
    return unwrapTrip(data);
  },
  async tripHistory(params?: { limit?: number }): Promise<Trip[]> {
    const { data } = await api.get("/trips/history", { params });
    return unwrapTrips(data);
  },
};

export default tripService;
