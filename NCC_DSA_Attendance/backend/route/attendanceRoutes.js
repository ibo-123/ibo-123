const express = require("express");
const router = express.Router();
const attendanceController = require("../controller/attendance.controller");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.post("/:courseId/mark", authMiddleware, attendanceController.markAttendance);
router.get("/me", authMiddleware, attendanceController.getUserAttendance);
router.get("/user/:userId", authMiddleware, attendanceController.getUserAttendance);
router.get("/course/:courseId", authMiddleware, attendanceController.getCourseAttendance);
router.get("/all", authMiddleware, roleMiddleware("admin"), attendanceController.getAllAttendance);

module.exports = router;

