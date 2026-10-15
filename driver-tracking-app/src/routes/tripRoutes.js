import { Router } from "express";
import * as tripController from "../controllers/tripController.js";
import { protect, authorize } from "../middleware/auth.js";
import { createTripValidator } from "../validators/tripValidators.js";

const router = Router();

router.use(protect);

router.get("/", tripController.listTrips);
router.post("/", authorize("admin", "dispatcher"), createTripValidator, tripController.createTrip);

router.get("/:tripId", tripController.getTrip);
router.put("/:tripId", authorize("admin", "dispatcher"), tripController.updateTrip);
router.delete("/:tripId", authorize("admin"), tripController.deleteTrip);

router.post("/:tripId/start", authorize("driver"), tripController.startTrip);
router.post("/:tripId/complete", authorize("driver"), tripController.completeTrip);
router.post("/:tripId/cancel", authorize("admin", "dispatcher", "customer"), tripController.cancelTrip);

export default router;
