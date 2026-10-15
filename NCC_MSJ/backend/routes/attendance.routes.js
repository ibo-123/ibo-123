const router = require("express").Router();
const c = require("../controllers/attendance.controller");
const { protect } = require("../middleware/authMiddleware");

// Mark attendance
router.post("/", protect, c.createAttendance);

// Get all attendance records
router.get("/", protect, c.getAttendances);

// Get single attendance record by ID
router.get("/:id", protect, c.getAttendance);

// Update attendance record
router.put("/:id", protect, c.updateAttendance);

// Delete attendance record
router.delete("/:id", protect, c.deleteAttendance);

module.exports = router;
