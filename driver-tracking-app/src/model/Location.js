import mongoose from "mongoose";

const locationSchema = new mongoose.Schema(
  {
    tripId: { type: String, required: true, uppercase: true, index: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true, index: true },
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 },
    accuracy: { type: Number, default: null },
    speed: { type: Number, default: null },
    heading: { type: Number, default: null },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

locationSchema.index({ tripId: 1, timestamp: 1 });

export default mongoose.model("Location", locationSchema);
