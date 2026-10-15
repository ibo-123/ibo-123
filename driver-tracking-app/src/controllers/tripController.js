import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import Trip from "../model/Trip.js";
import Driver from "../model/Driver.js";
import * as tripService from "../services/tripService.js";
import { normalizeTripId } from "../utils/generateId.js";

/** GET /api/trips - list trips, scoped by role, with optional filters. */
export const listTrips = asyncHandler(async (req, res) => {
  const { status, driverId, customerId, vehicleId, from, to, tripId } = req.query;
  const filter = {};

  // Scope results so customers/drivers only ever see their own trips,
  // regardless of what query params they pass.
  if (req.user.role === "customer") {
    filter.customerId = req.user._id;
  } else if (req.user.role === "driver") {
    const driver = await Driver.findOne({ userId: req.user._id });
    filter.driverId = driver ? driver._id : null;
  } else {
    if (customerId) filter.customerId = customerId;
    if (driverId) filter.driverId = driverId;
  }

  if (status) filter.status = status;
  if (vehicleId) filter.vehicleId = vehicleId;
  if (tripId) filter.tripId = normalizeTripId(tripId);
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const trips = await Trip.find(filter)
    .sort({ createdAt: -1 })
    .populate({ path: "driverId", populate: { path: "userId", select: "name phone" } })
    .populate({ path: "vehicleId" })
    .populate({ path: "customerId", select: "name email phone" });

  res.status(200).json({ success: true, count: trips.length, data: trips });
});

/** GET /api/trips/:tripId - fetch a single trip by human-readable ID. */
export const getTrip = asyncHandler(async (req, res) => {
  const trip = await tripService.findTripByTripId(req.params.tripId);

  // A customer may only view their own trip - prevents ID-guessing from
  // exposing another customer's delivery.
  if (req.user.role === "customer" && trip.customerId._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You do not have access to this trip.");
  }
  if (req.user.role === "driver") {
    const driver = await Driver.findOne({ userId: req.user._id });
    if (!driver || !trip.driverId || trip.driverId._id.toString() !== driver._id.toString()) {
      throw new ApiError(403, "You do not have access to this trip.");
    }
  }

  res.status(200).json({ success: true, data: trip });
});

/** POST /api/trips - dispatcher/admin creates a trip. */
export const createTrip = asyncHandler(async (req, res) => {
  const trip = await tripService.createTrip({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, data: trip });
});

/** PUT /api/trips/:tripId - update mutable trip fields (assignment, destination edits, etc). */
export const updateTrip = asyncHandler(async (req, res) => {
  const allowedFields = ["driverId", "vehicleId", "destination", "status"];
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const trip = await Trip.findOneAndUpdate(
    { tripId: normalizeTripId(req.params.tripId) },
    updates,
    { new: true, runValidators: true }
  );
  if (!trip) throw new ApiError(404, "Trip not found.");

  if (updates.driverId) await Driver.findByIdAndUpdate(updates.driverId, { status: "on_trip" });

  res.status(200).json({ success: true, data: trip });
});

/** DELETE /api/trips/:tripId - admin only, hard delete (rare; prefer cancel). */
export const deleteTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findOneAndDelete({ tripId: normalizeTripId(req.params.tripId) });
  if (!trip) throw new ApiError(404, "Trip not found.");
  res.status(200).json({ success: true, message: "Trip deleted." });
});

/** POST /api/trips/:tripId/start - driver starts their assigned trip. */
export const startTrip = asyncHandler(async (req, res) => {
  const driver = await Driver.findOne({ userId: req.user._id });
  if (!driver) throw new ApiError(403, "No driver profile found for this account.");
  const trip = await tripService.startTrip(req.params.tripId, driver._id);
  res.status(200).json({ success: true, data: trip });
});

/** POST /api/trips/:tripId/complete - driver completes their trip. */
export const completeTrip = asyncHandler(async (req, res) => {
  const driver = await Driver.findOne({ userId: req.user._id });
  if (!driver) throw new ApiError(403, "No driver profile found for this account.");
  const trip = await tripService.completeTrip(req.params.tripId, driver._id);
  res.status(200).json({ success: true, data: trip });
});

/** POST /api/trips/:tripId/cancel - admin/dispatcher/owning customer cancels. */
export const cancelTrip = asyncHandler(async (req, res) => {
  const trip = await tripService.cancelTrip(req.params.tripId, {
    reason: req.body.reason,
    actingUser: req.user,
  });
  res.status(200).json({ success: true, data: trip });
});

export default {
  listTrips,
  getTrip,
  createTrip,
  updateTrip,
  deleteTrip,
  startTrip,
  completeTrip,
  cancelTrip,
};
