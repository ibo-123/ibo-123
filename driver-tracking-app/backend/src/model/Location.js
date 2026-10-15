const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
  tripId: {
    type: String,
    required: true,
    index: true,
  },

  driverId: {
    type: String,
    required: true,
    index: true,
  },

  latitude: {
    type: Number,
    required: true,
  },

  longitude: {
    type: Number,
    required: true,
  },

  accuracy: {
    type: Number,
    default: null,
  },

  recordedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

module.exports = mongoose.model(
  "Location",
  locationSchema
);