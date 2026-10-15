import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useSocket } from "@/context/SocketContext";
import useGeolocation from "@/hooks/useGeolocation";
import type { Coordinates, Trip } from "@/types";

export interface TrackingState {
  live: boolean;
  location: Coordinates | null;
  lastUpdate: number | null;
  error: string | null;
}

/**
 * Customer side: joins the Socket.IO room for a Trip ID and receives the real
 * driver locations broadcast by the backend.
 */
export function useTripWatcher(tripId: string | null) {
  const { socket, connected } = useSocket();
  const [state, setState] = useState<TrackingState>({
    live: false,
    location: null,
    lastUpdate: null,
    error: null,
  });

  useEffect(() => {
    if (!socket || !tripId) return;

    const onLocation = (payload: { tripId?: string; location?: Coordinates } & Coordinates) => {
      if (payload?.tripId && payload.tripId !== tripId) return;
      const location = payload.location ?? (payload as Coordinates);
      if (typeof location?.lat !== "number" || typeof location?.lng !== "number") return;
      setState({
        live: true,
        location,
        lastUpdate: location.timestamp ?? Date.now(),
        error: null,
      });
    };

    const onStopped = (payload: { tripId?: string }) => {
      if (payload?.tripId && payload.tripId !== tripId) return;
      setState((prev) => ({ ...prev, live: false }));
    };

    const onError = (payload: { message?: string }) => {
      setState((prev) => ({ ...prev, error: payload?.message ?? "Tracking error" }));
    };

    socket.emit("customer:watchTrip", { tripId });
    socket.on("driver:currentLocation", onLocation);
    socket.on("driver:locationUpdated", onLocation);
    socket.on("driver:trackingStopped", onStopped);
    socket.on("tracking:error", onError);

    return () => {
      socket.off("driver:currentLocation", onLocation);
      socket.off("driver:locationUpdated", onLocation);
      socket.off("driver:trackingStopped", onStopped);
      socket.off("tracking:error", onError);
    };
  }, [socket, tripId, connected]);

  // Re-join the room after a reconnect.
  useEffect(() => {
    if (connected && socket && tripId) socket.emit("customer:watchTrip", { tripId });
  }, [connected, socket, tripId]);

  return state;
}

/**
 * Driver side: streams real device GPS into the trip room over Socket.IO.
 */
export function useTripTracking(trip: Trip | null) {
  const { socket, connected } = useSocket();
  const geo = useGeolocation();
  const [tracking, setTracking] = useState(false);
  const [pointsSent, setPointsSent] = useState(0);
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);
  const trackingRef = useRef(false);

  useEffect(() => {
    if (!socket) return;
    const onStarted = (payload: { tripId?: string }) => {
      trackingRef.current = true;
      setTracking(true);
      toast.success(`Tracking started for ${payload?.tripId ?? trip?.tripId ?? "trip"}`);
    };
    const onStopped = () => {
      trackingRef.current = false;
      setTracking(false);
    };
    const onError = (payload: { message?: string }) => {
      toast.error(payload?.message ?? "Tracking error from server");
    };
    socket.on("driver:trackingStarted", onStarted);
    socket.on("driver:trackingStopped", onStopped);
    socket.on("tracking:error", onError);
    return () => {
      socket.off("driver:trackingStarted", onStarted);
      socket.off("driver:trackingStopped", onStopped);
      socket.off("tracking:error", onError);
    };
  }, [socket, trip?.tripId]);

  const startTracking = useCallback(
    async (tripId: string, driverId?: string) => {
      if (!socket) {
        toast.error("No realtime connection. Check VITE_SOCKET_URL.");
        return false;
      }
      socket.emit("driver:startTracking", { tripId, driverId });

      const ok = await geo.start((coords) => {
        socket.emit("driver:locationUpdate", {
          tripId,
          driverId,
          location: coords,
          lat: coords.lat,
          lng: coords.lng,
          accuracy: coords.accuracy,
          speed: coords.speed,
          heading: coords.heading,
          timestamp: coords.timestamp ?? Date.now(),
        });
        setPointsSent((n) => n + 1);
        setLastSentAt(Date.now());
      });

      if (!ok) {
        socket.emit("driver:stopTracking", { tripId });
        return false;
      }
      trackingRef.current = true;
      setTracking(true);
      return true;
    },
    [geo, socket],
  );

  const stopTracking = useCallback(
    (tripId?: string) => {
      geo.stop();
      if (socket && tripId) socket.emit("driver:stopTracking", { tripId });
      trackingRef.current = false;
      setTracking(false);
    },
    [geo, socket],
  );

  return {
    tracking,
    connected,
    pointsSent,
    lastSentAt,
    position: geo.position,
    permission: geo.permission,
    gpsError: geo.error,
    startTracking,
    stopTracking,
  };
}

export default useTripTracking;
