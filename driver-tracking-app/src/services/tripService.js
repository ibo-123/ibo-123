import Trip from "../model/Trip.js";
import Driver from "../model/Driver.js";
import Vehicle from "../model/Vehicle.js";
import Location from "../model/Location.js";
import ApiError from "../utils/ApiError.js";
import { generateTripId, normalizeTripId } from "../utils/generateId.js";
import { isValidCoordinate } from "../utils/geo.js";
import { estimateRoute } from "./routingService.js";
import { notifyUser } from "./notificationService.js";

const MAX_ID_ATTEMPTS = 5;

/** Creates a trip with a guaranteed-unique, human-readable trip ID. */
export async function createTrip({ customerId, driverId, vehicleId, origin, destination, createdBy }) {
  const { distanceKm, etaMinutes } = await estimateRoute(origin, destination);

  let lastError;
  for (let attempt = 0; attempt < MAX_ID_ATTEMPTS; attempt++) {
    try {
      const trip = await Trip.create({
        tripId: generateTripId(),
        customerId,
        driverId: driverId || null,
        vehicleId: vehicleId || null,
        origin,
        destination,
        status: driverId ? "assigned" : "created",
        distanceKm,
        etaMinutes,
        createdBy,
      });

      if (driverId) {
        await Driver.findByIdAndUpdate(driverId, { status: "on_trip" });
        if (vehicleId) await Vehicle.findByIdAndUpdate(vehicleId, { status: "on_trip" });
        await notifyUser(customerId, {
          type: "trip_assigned",
          title: "Driver assigned",
          message: `A driver has been assigned to your delivery ${trip.tripId}.`,
          metadata: { tripId: trip.tripId },
        });
      }

      return trip;
    } catch (err) {
      if (err.code === 11000 && err.keyValue?.tripId) {
        lastError = err;
        continue; // collision on the human-readable ID, retry with a new one
      }
      throw err;
    }
  }
  throw lastError || new ApiError(500, "Failed to generate a unique trip ID. Please try again.");
}

/** Looks up a trip by its human-readable ID (case-insensitive). */
export async function findTripByTripId(rawTripId) {
  const tripId = normalizeTripId(rawTripId);
  const trip = await Trip.findOne({ tripId })
    .populate({ path: "driverId", populate: { path: "userId", select: "name phone" } })
    .populate({ path: "vehicleId" })
    .populate({ path: "customerId", select: "name email phone" });
  if (!trip) throw new ApiError(404, `No trip found with ID ${tripId}.`);
  return trip;
}

/**
 * Confirms that the given authenticated driver actually owns the given trip
 * before allowing them to mutate it. Prevents a driver from spoofing another
 * driver's trip ID.
 */
export async function assertDriverOwnsTrip(tripId, driverDocId) {
  const tripDoc = await Trip.findOne({ tripId: normalizeTripId(tripId) });
  if (!tripDoc) throw new ApiError(404, `No trip found with ID ${tripId}.`);
  if (!tripDoc.driverId || tripDoc.driverId.toString() !== driverDocId.toString()) {
    throw new ApiError(403, "You are not assigned to this trip.");
  }
  return tripDoc;
}

export async function startTrip(tripId, driverDocId) {
  const trip = await assertDriverOwnsTrip(tripId, driverDocId);
  trip.status = "tracking";
  trip.startedAt = new Date();
  await trip.save();

  await notifyUser(trip.customerId, {
    type: "trip_started",
    title: "Delivery started",
    message: `Your delivery ${trip.tripId} is now in transit.`,
    metadata: { tripId: trip.tripId },
  });

  return trip;
}

export async function completeTrip(tripId, driverDocId) {
  const trip = await assertDriverOwnsTrip(tripId, driverDocId);
  trip.status = "completed";
  trip.completedAt = new Date();
  await trip.save();

  await Driver.findByIdAndUpdate(driverDocId, { status: "available" });
  if (trip.vehicleId) await Vehicle.findByIdAndUpdate(trip.vehicleId, { status: "available" });

  await notifyUser(trip.customerId, {
    type: "trip_completed",
    title: "Delivery completed",
    message: `Your delivery ${trip.tripId} has been completed.`,
    metadata: { tripId: trip.tripId },
  });

  return trip;
}

export async function cancelTrip(tripId, { reason, actingUser }) {
  const trip = await Trip.findOne({ tripId: normalizeTripId(tripId) });
  if (!trip) throw new ApiError(404, `No trip found with ID ${tripId}.`);

  // Only admin/dispatcher, the assigned driver, or the trip's customer may cancel.
  const isPrivileged = ["admin", "dispatcher"].includes(actingUser.role);
  const isOwningCustomer = trip.customerId.toString() === actingUser._id.toString();
  if (!isPrivileged && !isOwningCustomer) {
    throw new ApiError(403, "You are not permitted to cancel this trip.");
  }

  trip.status = "cancelled";
  trip.cancelledAt = new Date();
  trip.cancelReason = reason || null;
  await trip.save();

  if (trip.driverId) await Driver.findByIdAndUpdate(trip.driverId, { status: "available" });
  if (trip.vehicleId) await Vehicle.findByIdAndUpdate(trip.vehicleId, { status: "available" });

  return trip;
}

/**
 * Records a GPS ping: validates coordinates, appends to location history,
 * and updates the trip/driver's current-location snapshot.
 * Shared by the Socket.IO handler so REST and realtime paths stay consistent.
 */
export async function recordLocationUpdate({ tripId, driverDocId, latitude, longitude, accuracy, speed, heading }) {
  if (!isValidCoordinate(latitude, longitude)) {
    throw new ApiError(400, "Invalid GPS coordinates.");
  }

  const trip = await assertDriverOwnsTrip(tripId, driverDocId);
  const timestamp = new Date();

  await Location.create({
    tripId: trip.tripId,
    driverId: driverDocId,
    latitude,
    longitude,
    accuracy,
    speed,
    heading,
    timestamp,
  });

  trip.currentLocation = { latitude, longitude, accuracy, speed, heading, updatedAt: timestamp };
  if (trip.status === "assigned" || trip.status === "created") trip.status = "tracking";

  // Recompute distance/ETA to destination from the driver's live position.
  const { distanceKm, etaMinutes } = await estimateRoute(
    { latitude, longitude },
    trip.destination
  );
  trip.distanceKm = distanceKm;
  trip.etaMinutes = etaMinutes;

  await trip.save();
  await Driver.findByIdAndUpdate(driverDocId, {
    currentLocation: { latitude, longitude, updatedAt: timestamp },
  });

  return trip;
}

export default {
  createTrip,
  findTripByTripId,
  assertDriverOwnsTrip,
  startTrip,
  completeTrip,
  cancelTrip,
  recordLocationUpdate,
};
