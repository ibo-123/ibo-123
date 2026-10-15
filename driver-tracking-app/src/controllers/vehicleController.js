import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import Vehicle from "../model/Vehicle.js";
import { generateVehicleId } from "../utils/generateId.js";

export const listVehicles = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.type) filter.type = req.query.type;

  const vehicles = await Vehicle.find(filter).populate({
    path: "driverId",
    populate: { path: "userId", select: "name phone" },
  });

  res.status(200).json({ success: true, count: vehicles.length, data: vehicles });
});

export const getVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id).populate({
    path: "driverId",
    populate: { path: "userId", select: "name phone" },
  });
  if (!vehicle) throw new ApiError(404, "Vehicle not found.");
  res.status(200).json({ success: true, data: vehicle });
});

export const createVehicle = asyncHandler(async (req, res) => {
  const { plateNumber, model, type, capacity, driverId } = req.body;
  if (!plateNumber || !model || !type) {
    throw new ApiError(400, "plateNumber, model, and type are required.");
  }

  const vehicle = await Vehicle.create({
    vehicleId: generateVehicleId(),
    plateNumber,
    model,
    type,
    capacity,
    driverId: driverId || null,
    status: "available",
  });

  res.status(201).json({ success: true, data: vehicle });
});

export const updateVehicle = asyncHandler(async (req, res) => {
  const allowedFields = ["plateNumber", "model", "type", "capacity", "driverId", "status"];
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!vehicle) throw new ApiError(404, "Vehicle not found.");

  res.status(200).json({ success: true, data: vehicle });
});

export default { listVehicles, getVehicle, createVehicle, updateVehicle };
