//userRoutes.js
require("dotenv").config();
const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const authMiddleware = require("../middleware/authMiddleware");

// Get user profile (accessible to authenticated users)
router.get("/profile", authMiddleware, userController.getUserProfile);

// Update user profile (accessible to authenticated users)
router.put("/profile", authMiddleware, userController.updateUserProfile);

module.exports = router;        