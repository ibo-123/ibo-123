const Attendance = require("../model/attendance.model");
const Course = require("../model/course.model");
const User = require("../model/user.model");

exports.markAttendance = async (req, res) => {
  const { courseId } = req.params;
  const { status, date } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  if (!status || !["present", "absent"].includes(status)) {
    return res.status(400).json({ message: "Status must be 'present' or 'absent'." });
  }

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    if (!course.students.some((studentId) => studentId.toString() === userId)) {
      return res.status(403).json({ message: "You are not enrolled in this course." });
    }

    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(attendanceDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const existing = await Attendance.findOne({
      userId,
      courseId,
      date: { $gte: attendanceDate, $lt: nextDay },
    });

    if (existing) {
      return res.status(400).json({ message: "Attendance already recorded for this date." });
    }

    const attendance = new Attendance({ userId, courseId, date: attendanceDate, status });
    await attendance.save();

    res.status(201).json({ message: "Attendance marked successfully.", attendance });
  } catch (error) {
    console.error("Mark attendance error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

exports.getUserAttendance = async (req, res) => {
  const requestedUserId = req.params.userId || req.user?.userId;

  if (!requestedUserId) {
    return res.status(400).json({ message: "User ID is required." });
  }

  if (req.user.role !== "admin" && requestedUserId !== req.user.userId) {
    return res.status(403).json({ message: "Access denied." });
  }

  try {
    const attendance = await Attendance.find({ userId: requestedUserId })
      .populate("courseId", "title instructor")
      .populate("userId", "name email");
    res.json(attendance);
  } catch (error) {
    console.error("Get user attendance error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

exports.getCourseAttendance = async (req, res) => {
  const { courseId } = req.params;

  try {
    const attendance = await Attendance.find({ courseId })
      .populate("userId", "name email")
      .populate("courseId", "title instructor");
    res.json(attendance);
  } catch (error) {
    console.error("Get course attendance error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

exports.getAllAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find()
      .populate("userId", "name email")
      .populate("courseId", "title instructor");
    res.json(attendance);
  } catch (error) {
    console.error("Get all attendance error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};
