import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { getAchievements } from "../controller/achievement.controller.js";

const router = express.Router();

router.get("/", authMiddleware, getAchievements);

export default router;
