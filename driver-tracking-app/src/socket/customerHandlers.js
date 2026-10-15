import * as tripService from "../services/tripService.js";
import { normalizeTripId } from "../utils/generateId.js";

const tripRoom = (tripId) => `trip:${normalizeTripId(tripId)}`;

export function registerCustomerHandlers(io, socket) {
  /**
   * customer:watchTrip { tripId }
   * A customer joins a trip's room to receive its live location updates.
   * Access is checked server-side: a customer may only watch a trip that
   * belongs to them (admin/dispatcher may watch any trip for oversight).
   */
  socket.on("customer:watchTrip", async ({ tripId } = {}) => {
    try {
      if (!tripId) throw new Error("tripId is required.");

      const trip = await tripService.findTripByTripId(tripId);

      const isOwner = trip.customerId?._id?.toString() === socket.user._id.toString();
      const isPrivileged = ["admin", "dispatcher"].includes(socket.user.role);
      if (!isOwner && !isPrivileged) {
        throw new Error("You do not have access to this trip.");
      }

      socket.join(tripRoom(trip.tripId));
      socket.emit("driver:currentLocation", {
        tripId: trip.tripId,
        currentLocation: trip.currentLocation,
        status: trip.status,
        distanceKm: trip.distanceKm,
        etaMinutes: trip.etaMinutes,
      });
    } catch (err) {
      socket.emit("tracking:error", { message: err.message });
    }
  });

  /** customer:stopWatching { tripId } */
  socket.on("customer:stopWatching", ({ tripId } = {}) => {
    if (!tripId) return;
    socket.leave(tripRoom(tripId));
  });
}

export default registerCustomerHandlers;
