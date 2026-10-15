import { Router } from "express";
import * as vehicleController from "../controllers/vehicleController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

router.use(protect);

router.get("/", authorize("admin", "dispatcher"), vehicleController.listVehicles);
router.post("/", authorize("admin", "dispatcher"), vehicleController.createVehicle);
router.get("/:id", authorize("admin", "dispatcher"), vehicleController.getVehicle);
router.put("/:id", authorize("admin", "dispatcher"), vehicleController.updateVehicle);

export default router;
