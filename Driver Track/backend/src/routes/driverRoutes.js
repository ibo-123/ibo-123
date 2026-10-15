import { Router } from "express";
import * as driverController from "../controllers/driverController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

router.use(protect);

router.get("/", authorize("admin", "dispatcher"), driverController.listDrivers);
router.post("/", authorize("admin", "dispatcher"), driverController.createDriver);
router.get("/:id", authorize("admin", "dispatcher"), driverController.getDriver);
router.put("/:id", authorize("admin", "dispatcher"), driverController.updateDriver);

export default router;
