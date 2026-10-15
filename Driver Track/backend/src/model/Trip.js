import mongoose from "mongoose";

const TRIP_STATUSES = [
  "created",
  "assigned",
  "tracking",
  "in_transit",
  "arrived",
  "delivered",
  "cancelled",
  "completed",
];

const pointSchema = new mongoose.Schema(
  {
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 },
    address: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const tripSchema = new mongoose.Schema(
  {
    tripId: { type: String, required: true, unique: true, uppercase: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", default: null },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    origin: { type: pointSchema, required: true },
    destination: { type: pointSchema, required: true },

    status: { type: String, enum: TRIP_STATUSES, default: "created" },

    currentLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      accuracy: { type: Number, default: null },
      speed: { type: Number, default: null },
      heading: { type: Number, default: null },
      updatedAt: { type: Date, default: null },
    },

    distanceKm: { type: Number, default: null },
    etaMinutes: { type: Number, default: null },

    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancelReason: { type: String, default: null },
  },
  { timestamps: true }
);

tripSchema.index({ status: 1 });
tripSchema.index({ customerId: 1 });
tripSchema.index({ driverId: 1 });

export const TRIP_STATUS_VALUES = TRIP_STATUSES;
export default mongoose.model("Trip", tripSchema);
