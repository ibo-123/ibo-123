const router = require("express").Router();
const c = require("../controllers/achievement.controller");
const auth = require("../middleware");

// =========================
//  ACHIEVEMENT ROUTES
// =========================

// Create achievement (protected)
router.post("/", auth.protect, c.createAchievement);

// Get all achievements (optional auth for public view)
router.get("/", auth.optionalAuth, c.getAchievements);

// Get single achievement by ID (public if achievement isPublic)
router.get("/:id", auth.optionalAuth, c.getAchievement);

// Update achievement (protected: admin or owner)
router.put("/:id", auth.protect, c.updateAchievement);

// Delete achievement (protected: admin or owner)
router.delete("/:id", auth.protect, c.deleteAchievement);

// Verify / approve achievement (admin only)
router.patch("/:id/verify", auth.protect, auth.adminOnly, c.verifyAchievement);

// Toggle like on achievement (protected)
router.post("/:id/like", auth.protect, c.toggleLike);

// Add comment to achievement (protected)
router.post("/:id/comment", auth.protect, c.addComment);

// Get achievements for a specific user
router.get("/user/:userId", auth.optionalAuth, c.getUserAchievements);

// Get achievement statistics (admin only)
router.get("/stats", auth.protect, auth.adminOnly, c.getAchievementStats);

// Get leaderboard (optional auth)
router.get("/leaderboard", auth.optionalAuth, c.getLeaderboard);

module.exports = router;
