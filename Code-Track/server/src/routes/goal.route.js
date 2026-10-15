import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { getGoals, createGoal, updateGoal, deleteGoal } from "../controller/goal.controller.js";

const router = express.Router();

router.get("/", authMiddleware, getGoals);
router.post("/", authMiddleware, createGoal);
router.patch("/:id", authMiddleware, updateGoal);
router.delete("/:id", authMiddleware, deleteGoal);

export default router;
