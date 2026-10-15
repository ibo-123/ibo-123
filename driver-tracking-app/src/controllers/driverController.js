import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import Driver from "../model/Driver.js";
import User from "../model/User.js";
import { generateDriverId } from "../utils/generateId.js";

/** GET /api/drivers - admin/dispatcher list, optionally filtered by status. */
export const listDrivers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const drivers = await Driver.find(filter)
    .populate({ path: "userId", select: "name email phone isActive" })
    .populate({ path: "vehicleId" });

  res.status(200).json({ success: true, count: drivers.length, data: drivers });
});

/** GET /api/drivers/:id */
export const getDriver = asyncHandler(async (req, res) => {
  const driver = await Driver.findById(req.params.id)
    .populate({ path: "userId", select: "name email phone isActive" })
    .populate({ path: "vehicleId" });
  if (!driver) throw new ApiError(404, "Driver not found.");
  res.status(200).json({ success: true, data: driver });
});

/**
 * POST /api/drivers - admin/dispatcher registers a driver profile for an
 * existing user account (created via /auth/register with role "driver",
 * or via admin user management).
 */
export const createDriver = asyncHandler(async (req, res) => {
  const { userId, licenseNumber, vehicleId } = req.body;

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found.");
  if (user.role !== "driver") throw new ApiError(400, "User must have the 'driver' role.");

  const existing = await Driver.findOne({ userId });
  if (existing) throw new ApiError(409, "This user already has a driver profile.");

  const driver = await Driver.create({
    userId,
    driverId: generateDriverId(),
    licenseNumber,
    vehicleId: vehicleId || null,
    status: "offline",
  });

  res.status(201).json({ success: true, data: driver });
});

/** PUT /api/drivers/:id - update assignment, license, or status. */
export const updateDriver = asyncHandler(async (req, res) => {
  const allowedFields = ["licenseNumber", "vehicleId", "status"];
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const driver = await Driver.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!driver) throw new ApiError(404, "Driver not found.");

  res.status(200).json({ success: true, data: driver });
});

export default { listDrivers, getDriver, createDriver, updateDriver };
