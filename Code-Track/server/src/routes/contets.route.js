import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
  getUpcomingContests,
  getContestHistory,
} from "../controller/contest.controller.js";

const router = express.Router();

router.get(
  "/upcoming",
  authMiddleware,
  getUpcomingContests
);

router.get(
  "/history",
  authMiddleware,
  getContestHistory
);

export default router;