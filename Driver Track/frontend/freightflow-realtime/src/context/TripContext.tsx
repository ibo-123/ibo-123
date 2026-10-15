import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Trip } from "@/types";

interface TripContextValue {
  /** The trip the driver is currently tracking (created by the backend). */
  activeTrip: Trip | null;
  setActiveTrip: (trip: Trip | null) => void;
  /** Last trip a customer looked up, so navigating back keeps context. */
  watchedTripId: string | null;
  setWatchedTripId: (tripId: string | null) => void;
  patchActiveTrip: (patch: Partial<Trip>) => void;
}

const TripContext = createContext<TripContextValue | null>(null);

export function TripProvider({ children }: { children: ReactNode }) {
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [watchedTripId, setWatchedTripId] = useState<string | null>(null);

  const patchActiveTrip = useCallback((patch: Partial<Trip>) => {
    setActiveTrip((current) => (current ? { ...current, ...patch } : current));
  }, []);

  const value = useMemo<TripContextValue>(
    () => ({ activeTrip, setActiveTrip, watchedTripId, setWatchedTripId, patchActiveTrip }),
    [activeTrip, watchedTripId, patchActiveTrip],
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTripContext() {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error("useTripContext must be used inside TripProvider");
  return ctx;
}
