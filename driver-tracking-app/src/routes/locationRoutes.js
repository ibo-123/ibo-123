import { Router } from "express";
import * as locationController from "../controllers/locationController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.use(protect);

router.get("/:tripId", locationController.getTripLocationHistory);

export default router;
