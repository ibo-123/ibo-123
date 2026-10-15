import Driver from "../model/Driver.js";
import { normalizeTripId } from "../utils/generateId.js";

const TIMEOUT_MS = Number(process.env.DRIVER_INACTIVITY_TIMEOUT_MS) || 30000;

// driverId -> { timer, tripId, io }
const timers = new Map();

/**
 * Call this whenever a driver's socket sends activity (connects, starts
 * tracking, sends a location ping). Resets the inactivity countdown.
 * If the timer fires, the trip room is told the driver looks offline -
 * the trip and its last known location are left untouched.
 */
export function touchDriverActivity(io, driverId, tripId) {
  const existing = timers.get(driverId);
  if (existing) clearTimeout(existing.timer);

  const timer = setTimeout(async () => {
    timers.delete(driverId);
    try {
      const room = `trip:${normalizeTripId(tripId)}`;
      io.to(room).emit("driver:connectionStatus", {
        tripId: normalizeTripId(tripId),
        status: "offline",
        message: "Driver connection appears inactive.",
      });
    } catch {
      // best-effort notification only
    }
  }, TIMEOUT_MS);

  timers.set(driverId, { timer, tripId, io });
}

/**
 * Call on explicit stop/complete/disconnect. By default this simply clears
 * the pending inactivity timer. When keepLastLocation is true (a bare
 * socket disconnect, e.g. the phone lost signal) we still let the timeout
 * fire naturally rather than immediately flipping the driver offline -
 * a brief reconnect shouldn't interrupt tracking.
 */
export function clearDriverActivity(driverId, { keepLastLocation = false } = {}) {
  if (keepLastLocation) return; // let the existing timer run its course
  const existing = timers.get(driverId);
  if (existing) {
    clearTimeout(existing.timer);
    timers.delete(driverId);
  }
}

export default { touchDriverActivity, clearDriverActivity };
