import { Router } from "express";
import * as analyticsController from "../controllers/analyticsController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

router.use(protect, authorize("admin", "dispatcher"));

router.get("/overview", analyticsController.getOverview);
router.get("/trips-per-day", analyticsController.getTripsPerDay);
router.get("/trips-by-status", analyticsController.getTripsByStatus);
router.get("/delivery-performance", analyticsController.getDeliveryPerformance);

export default router;
