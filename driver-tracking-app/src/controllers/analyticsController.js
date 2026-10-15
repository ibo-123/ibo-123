import asyncHandler from "../utils/asyncHandler.js";
import Trip from "../model/Trip.js";
import Driver from "../model/Driver.js";
import Vehicle from "../model/Vehicle.js";
import User from "../model/User.js";

/** GET /api/analytics/overview - top-line counts for the admin dashboard. */
export const getOverview = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalDrivers,
    totalCustomers,
    totalVehicles,
    activeTrips,
    completedTrips,
    cancelledTrips,
    availableDrivers,
    driversOnTrip,
    offlineDrivers,
  ] = await Promise.all([
    User.countDocuments({}),
    Driver.countDocuments({}),
    User.countDocuments({ role: "customer" }),
    Vehicle.countDocuments({}),
    Trip.countDocuments({ status: { $in: ["created", "assigned", "tracking", "in_transit", "arrived"] } }),
    Trip.countDocuments({ status: { $in: ["delivered", "completed"] } }),
    Trip.countDocuments({ status: "cancelled" }),
    Driver.countDocuments({ status: "available" }),
    Driver.countDocuments({ status: "on_trip" }),
    Driver.countDocuments({ status: { $in: ["offline", "inactive"] } }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalDrivers,
      totalCustomers,
      totalVehicles,
      activeTrips,
      completedTrips,
      cancelledTrips,
      availableDrivers,
      driversOnTrip,
      offlineDrivers,
    },
  });
});

/** GET /api/analytics/trips-per-day?days=14 */
export const getTripsPerDay = asyncHandler(async (req, res) => {
  const days = Math.min(parseInt(req.query.days, 10) || 14, 90);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const results = await Trip.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.status(200).json({ success: true, data: results });
});

/** GET /api/analytics/trips-by-status */
export const getTripsByStatus = asyncHandler(async (req, res) => {
  const results = await Trip.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
  res.status(200).json({ success: true, data: results });
});

/** GET /api/analytics/delivery-performance - avg delivery time & distance. */
export const getDeliveryPerformance = asyncHandler(async (req, res) => {
  const results = await Trip.aggregate([
    { $match: { status: "completed", startedAt: { $ne: null }, completedAt: { $ne: null } } },
    {
      $project: {
        durationMinutes: { $divide: [{ $subtract: ["$completedAt", "$startedAt"] }, 60000] },
        distanceKm: 1,
      },
    },
    {
      $group: {
        _id: null,
        avgDurationMinutes: { $avg: "$durationMinutes" },
        avgDistanceKm: { $avg: "$distanceKm" },
        count: { $sum: 1 },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: results[0] || { avgDurationMinutes: 0, avgDistanceKm: 0, count: 0 },
  });
});

export default { getOverview, getTripsPerDay, getTripsByStatus, getDeliveryPerformance };
