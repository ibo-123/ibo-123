const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema(
  {
    tripId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    driverId: {
      type: String,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "tracking",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },

    destination: {
      latitude: {
        type: Number,
        required: true,
      },

      longitude: {
        type: Number,
        required: true,
      },

      address: {
        type: String,
        default: "",
      },
    },

    currentLocation: {
      latitude: Number,
      longitude: Number,
      accuracy: Number,
      updatedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Trip",
  tripSchema
);