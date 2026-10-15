import mongoose from "mongoose";

const VEHICLE_STATUSES = ["available", "on_trip", "maintenance", "inactive"];
const VEHICLE_TYPES = ["Truck", "Van", "Pickup", "Container Truck", "Motorcycle", "Other"];

const vehicleSchema = new mongoose.Schema(
  {
    vehicleId: { type: String, required: true, unique: true },
    plateNumber: { type: String, required: true, unique: true, trim: true },
    model: { type: String, required: true, trim: true },
    type: { type: String, enum: VEHICLE_TYPES, required: true },
    capacity: { type: String, trim: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", default: null },
    status: { type: String, enum: VEHICLE_STATUSES, default: "available" },
    currentLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      updatedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

export const VEHICLE_STATUS_VALUES = VEHICLE_STATUSES;
export const VEHICLE_TYPE_VALUES = VEHICLE_TYPES;
export default mongoose.model("Vehicle", vehicleSchema);
