import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { getRecentSubmissions } from "../controller/submission.controller.js";

const router = express.Router();

router.get("/recent", authMiddleware, getRecentSubmissions);

export default router;
