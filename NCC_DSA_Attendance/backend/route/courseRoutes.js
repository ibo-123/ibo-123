const express = require("express");
const router = express.Router();
const courseController = require("../controller/courseController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.post("/", authMiddleware, roleMiddleware("admin"), courseController.createCourse);
router.get("/", authMiddleware, courseController.getAllCourses);
router.get("/:id", authMiddleware, courseController.getCourseById);
router.post("/:courseId/enroll", authMiddleware, courseController.enrollStudent);
router.put("/:id", authMiddleware, roleMiddleware("admin"), courseController.updateCourse);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), courseController.deleteCourse);

module.exports = router;
