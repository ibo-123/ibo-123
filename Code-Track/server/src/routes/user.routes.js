import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
  getProfile,
  updateProfile,
  changePassword,
  syncCodeforces,
} from "../controller/user.controller.js";
import upload from "../middlewares/upload.middleware.js";

const router = express.Router();

// GET /api/users/profile - Get current user profile
router.get("/profile", authMiddleware, getProfile);

// PUT /api/users/profile - Update profile with optional avatar
router.put("/profile", authMiddleware, upload.single("avatar"), updateProfile);

// PUT /api/users/password - Change password
router.put("/password", authMiddleware, changePassword);

// GET /api/users/me - Alias for profile
router.get("/me", authMiddleware, getProfile);

// POST /api/users/sync - Sync Codeforces Data
router.post("/sync", authMiddleware, syncCodeforces);

export default router;