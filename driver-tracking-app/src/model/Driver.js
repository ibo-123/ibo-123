import mongoose from "mongoose";

const DRIVER_STATUSES = ["available", "on_trip", "offline", "inactive"];

const driverSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    driverId: { type: String, required: true, unique: true },
    licenseNumber: { type: String, required: true, trim: true },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", default: null },
    status: { type: String, enum: DRIVER_STATUSES, default: "offline" },
    currentLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      updatedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

driverSchema.index({ status: 1 });

export const DRIVER_STATUS_VALUES = DRIVER_STATUSES;
export default mongoose.model("Driver", driverSchema);
