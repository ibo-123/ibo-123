import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import Location from "../model/Location.js";
import Driver from "../model/Driver.js";
import { normalizeTripId } from "../utils/generateId.js";
import Trip from "../model/Trip.js";

/**
 * GET /api/locations/:tripId - full GPS breadcrumb trail for a trip,
 * used to reconstruct the route on the trip-history page.
 */
export const getTripLocationHistory = asyncHandler(async (req, res) => {
  const tripId = normalizeTripId(req.params.tripId);

  const trip = await Trip.findOne({ tripId });
  if (!trip) throw new ApiError(404, "Trip not found.");

  // Same access rules as getTrip: customers/drivers may only see their own trip.
  if (req.user.role === "customer" && trip.customerId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You do not have access to this trip.");
  }
  if (req.user.role === "driver") {
    const driver = await Driver.findOne({ userId: req.user._id });
    if (!driver || !trip.driverId || trip.driverId.toString() !== driver._id.toString()) {
      throw new ApiError(403, "You do not have access to this trip.");
    }
  }

  const points = await Location.find({ tripId }).sort({ timestamp: 1 });
  res.status(200).json({ success: true, count: points.length, data: points });
});

export default { getTripLocationHistory };
