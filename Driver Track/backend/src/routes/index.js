import { Router } from "express";
import authRoutes from "./authRoutes.js";
import tripRoutes from "./tripRoutes.js";
import driverRoutes from "./driverRoutes.js";
import vehicleRoutes from "./vehicleRoutes.js";
import customerRoutes from "./customerRoutes.js";
import locationRoutes from "./locationRoutes.js";
import userRoutes from "./userRoutes.js";
import analyticsRoutes from "./analyticsRoutes.js";
import notificationRoutes from "./notificationRoutes.js";

const router = Router();

router.get("/health", (req, res) => res.json({ success: true, message: "OK" }));

router.use("/auth", authRoutes);
router.use("/trips", tripRoutes);
router.use("/drivers", driverRoutes);
router.use("/vehicles", vehicleRoutes);
router.use("/customers", customerRoutes);
router.use("/locations", locationRoutes);
router.use("/users", userRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/notifications", notificationRoutes);

export default router;
