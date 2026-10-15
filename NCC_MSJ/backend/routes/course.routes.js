
// course.routes

const router = require("express").Router();
const c = require("../controllers/course.controller");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Public/Private routes
router.get("/", protect, c.getCourses);

// Admin/Instructor routes
router.post("/", protect, c.createCourse);
router.put("/:id", protect, c.updateCourse);
router.delete("/:id", protect, c.deleteCourse);

// User/Admin routes
router.get("/stats", protect, adminOnly, c.getCourseStats);
router.get("/my-courses", protect, c.getMyCourses);

// Routes with dynamic :id (must come last)
router.get("/:id", protect, c.getCourse);
router.post("/:id/enroll", protect, c.enrollInCourse);
router.post("/:id/complete", protect, c.completeCourse);
router.post("/:id/rate", protect, c.rateCourse);

module.exports = router;
