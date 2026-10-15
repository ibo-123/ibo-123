import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { getAnalytics, getHeatmap, getProblemDistribution } from "../controller/analytics.controller.js";

const router = express.Router();

router.get("/", authMiddleware, getAnalytics);
router.get("/heatmap", authMiddleware, getHeatmap);
router.get("/distribution", authMiddleware, getProblemDistribution);

export default router;