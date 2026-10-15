const express = require("express");
const Trip = require("../model/Trip");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| GET TRIP
|--------------------------------------------------------------------------
*/

router.get("/:tripId", async (req, res) => {
  try {
    const { tripId } = req.params;

    // Validate tripId format
    if (!tripId || typeof tripId !== "string" || tripId.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Invalid trip ID format",
      });
    }

    const trip = await Trip.findOne({
      tripId: tripId.toUpperCase(),
    }).lean();

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found. Please check the tracking ID.",
      });
    }

    res.json({
      success: true,
      tripId: trip.tripId,
      driverId: trip.driverId,
      status: trip.status,
      destination: trip.destination,
      currentLocation: trip.currentLocation,
      createdAt: trip.createdAt,
      updatedAt: trip.updatedAt,
    });
  } catch (error) {
    console.error(
      "Get trip error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to retrieve trip information. Please try again later.",
    });
  }
});

module.exports = router;