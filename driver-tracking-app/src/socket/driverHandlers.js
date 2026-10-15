import * as tripService from "../services/tripService.js";
import Driver from "../model/Driver.js";
import { normalizeTripId } from "../utils/generateId.js";
import { touchDriverActivity, clearDriverActivity } from "./inactivityMonitor.js";

const tripRoom = (tripId) => `trip:${normalizeTripId(tripId)}`;

export function registerDriverHandlers(io, socket) {
  /**
   * driver:startTracking { tripId }
   * Driver joins the trip's room so their subsequent location updates are
   * scoped to it, and confirms ownership before allowing anything further.
   */
  socket.on("driver:startTracking", async ({ tripId } = {}) => {
    try {
      if (!socket.driver) throw new Error("No driver profile associated with this account.");
      if (!tripId) throw new Error("tripId is required.");

      await tripService.assertDriverOwnsTrip(tripId, socket.driver._id);

      const room = tripRoom(tripId);
      socket.join(room);
      socket.data.activeTripId = normalizeTripId(tripId);

      await Driver.findByIdAndUpdate(socket.driver._id, { status: "on_trip" });
      touchDriverActivity(io, socket.driver._id.toString(), normalizeTripId(tripId));

      socket.emit("driver:trackingStarted", { tripId: normalizeTripId(tripId) });
      io.to(room).emit("trip:statusUpdated", { tripId: normalizeTripId(tripId), status: "tracking" });
    } catch (err) {
      socket.emit("tracking:error", { message: err.message });
    }
  });

  /**
   * driver:locationUpdate { tripId, latitude, longitude, accuracy, speed, heading }
   * Validates coordinates, persists a location-history point, updates the
   * trip's live snapshot, and broadcasts only to that trip's room.
   */
  socket.on("driver:locationUpdate", async (payload = {}) => {
    try {
      if (!socket.driver) throw new Error("No driver profile associated with this account.");
      const { tripId, latitude, longitude, accuracy, speed, heading } = payload;
      if (!tripId) throw new Error("tripId is required.");

      const trip = await tripService.recordLocationUpdate({
        tripId,
        driverDocId: socket.driver._id,
        latitude,
        longitude,
        accuracy,
        speed,
        heading,
      });

      touchDriverActivity(io, socket.driver._id.toString(), trip.tripId);

      const room = tripRoom(trip.tripId);
      io.to(room).emit("driver:locationUpdated", {
        tripId: trip.tripId,
        latitude,
        longitude,
        accuracy,
        speed,
        heading,
        distanceKm: trip.distanceKm,
        etaMinutes: trip.etaMinutes,
        status: trip.status,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      socket.emit("tracking:error", { message: err.message });
    }
  });

  /** driver:stopTracking { tripId } - leaves the room without completing the trip. */
  socket.on("driver:stopTracking", async ({ tripId } = {}) => {
    try {
      if (!tripId) throw new Error("tripId is required.");
      const room = tripRoom(tripId);
      socket.leave(room);
      socket.data.activeTripId = null;

      if (socket.driver) clearDriverActivity(socket.driver._id.toString());

      socket.emit("driver:trackingStopped", { tripId: normalizeTripId(tripId) });
      io.to(room).emit("trip:statusUpdated", { tripId: normalizeTripId(tripId), status: "paused" });
    } catch (err) {
      socket.emit("tracking:error", { message: err.message });
    }
  });

  /** driver:completeTrip { tripId } - marks trip completed and closes the room. */
  socket.on("driver:completeTrip", async ({ tripId } = {}) => {
    try {
      if (!socket.driver) throw new Error("No driver profile associated with this account.");
      if (!tripId) throw new Error("tripId is required.");

      const trip = await tripService.completeTrip(tripId, socket.driver._id);
      clearDriverActivity(socket.driver._id.toString());

      const room = tripRoom(trip.tripId);
      io.to(room).emit("trip:statusUpdated", { tripId: trip.tripId, status: "completed" });
      socket.leave(room);
      socket.data.activeTripId = null;
    } catch (err) {
      socket.emit("tracking:error", { message: err.message });
    }
  });

  socket.on("disconnect", () => {
    if (socket.driver) {
      // Don't immediately mark offline/delete anything - the inactivity
      // monitor will flag the driver as disconnected only after the
      // configured timeout, and the trip retains its last known location.
      clearDriverActivity(socket.driver._id.toString(), { keepLastLocation: true });
    }
  });
}

export default registerDriverHandlers;
