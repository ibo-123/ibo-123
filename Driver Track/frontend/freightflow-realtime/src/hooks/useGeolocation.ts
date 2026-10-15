import { useCallback, useEffect, useRef, useState } from "react";
import type { Coordinates } from "@/types";

export type GeoPermission = "unknown" | "prompt" | "granted" | "denied" | "unsupported";

interface UseGeolocationResult {
  position: Coordinates | null;
  error: string | null;
  watching: boolean;
  permission: GeoPermission;
  /** Starts navigator.geolocation.watchPosition (real device GPS only). */
  start: (onUpdate?: (coords: Coordinates) => void) => Promise<boolean>;
  stop: () => void;
}

/** Real browser GPS. No simulated coordinates anywhere. */
export function useGeolocation(options?: PositionOptions): UseGeolocationResult {
  const [position, setPosition] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [watching, setWatching] = useState(false);
  const [permission, setPermission] = useState<GeoPermission>("unknown");
  const watchIdRef = useRef<number | null>(null);
  const callbackRef = useRef<((coords: Coordinates) => void) | undefined>(undefined);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setPermission("unsupported");
      return;
    }
    if (!navigator.permissions?.query) return;
    let cancelled = false;
    navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((status) => {
        if (cancelled) return;
        setPermission(status.state as GeoPermission);
        status.onchange = () => setPermission(status.state as GeoPermission);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const stop = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    callbackRef.current = undefined;
    setWatching(false);
  }, []);

  const start = useCallback<UseGeolocationResult["start"]>(
    async (onUpdate) => {
      if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
        setPermission("unsupported");
        setError("This device or browser does not support GPS location.");
        return false;
      }
      if (!window.isSecureContext && window.location.hostname !== "localhost") {
        setError(
          "GPS requires a secure context. Open the app over HTTPS or via localhost to share location.",
        );
        return false;
      }

      callbackRef.current = onUpdate;
      setError(null);

      return new Promise<boolean>((resolve) => {
        let settled = false;
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const coords: Coordinates = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              speed: pos.coords.speed,
              heading: pos.coords.heading,
              timestamp: pos.timestamp,
            };
            setPosition(coords);
            setPermission("granted");
            setWatching(true);
            callbackRef.current?.(coords);
            if (!settled) {
              settled = true;
              resolve(true);
            }
          },
          (err) => {
            const message =
              err.code === err.PERMISSION_DENIED
                ? "Location permission denied. Enable GPS access for this site to start tracking."
                : err.code === err.POSITION_UNAVAILABLE
                  ? "GPS position unavailable. Move to an open area and try again."
                  : "Timed out while acquiring a GPS fix.";
            if (err.code === err.PERMISSION_DENIED) setPermission("denied");
            setError(message);
            setWatching(false);
            if (!settled) {
              settled = true;
              resolve(false);
            }
          },
          {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 20000,
            ...options,
          },
        );
      });
    },
    [options],
  );

  useEffect(() => stop, [stop]);

  return { position, error, watching, permission, start, stop };
}

export default useGeolocation;
