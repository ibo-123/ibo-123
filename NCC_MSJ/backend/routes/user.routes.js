const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getAllUsers,
  getUser,
  getMe,
  createUser,
  updateUser,
  deleteUser,
  getUsersForDropdown,
  updateUserStatus,
  updateUserRole,
  getUserStats
} = require("../controllers/user.controller");

// All routes are protected
router.use(protect);

// Get current user profile
router.get("/me", getMe);

// Get users for dropdown (available for all authenticated users)
router.get("/dropdown", getUsersForDropdown);

// Admin-only routes
router.get("/", authorize("admin"), getAllUsers);
router.get("/stats", authorize("admin"), getUserStats);
router.post("/", authorize("admin"), createUser);

// Single user routes with mixed permissions
router.get("/:id", getUser); // User can view own profile, admin can view any
router.put("/:id", updateUser); // User can update own, admin can update any
router.delete("/:id", authorize("admin"), deleteUser); // Admin only

// Admin-only status and role management
router.patch("/:id/status", authorize("admin"), updateUserStatus);
router.patch("/:id/role", authorize("admin"), updateUserRole);

module.exports = router;