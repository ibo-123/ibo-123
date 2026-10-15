const Attendance = require("../models/Attendance.model");
const User = require("../models/User.model");
const Event = require("../models/event.model");
const AuditLog = require("../models/AuditLog.model");

// @desc    Get all attendance records
// @route   GET /api/attendance
// @access  Private/Admin
exports.getAttendances = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.date.$lte = new Date(req.query.endDate);
    }

    // Other filters
    if (req.query.userId) filter.user = req.query.userId;
    if (req.query.eventId) filter.event = req.query.eventId;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.eventType) filter.eventType = req.query.eventType;
    if (req.query.location) filter.location = { $regex: req.query.location, $options: "i" };

    // Search by user name or event name
    if (req.query.search) {
      const users = await User.find({
        $or: [
          { name: { $regex: req.query.search, $options: "i" } },
          { studentId: { $regex: req.query.search, $options: "i" } }
        ]
      }).select("_id");

      const userIds = users.map(user => user._id);
      
      filter.$or = [
        { user: { $in: userIds } },
        { eventName: { $regex: req.query.search, $options: "i" } }
      ];
    }

    // Sorting
    let sort = { date: -1 };
    if (req.query.sortBy) {
      const parts = req.query.sortBy.split(":");
      sort = { [parts[0]]: parts[1] === "desc" ? -1 : 1 };
    }

    // Execute query
    const attendances = await Attendance.find(filter)
      .populate("user", "name studentId department")
      .populate("event", "title")
      .populate("verifiedBy", "name")
      .skip(skip)
      .limit(limit)
      .sort(sort)
      .lean();

    const total = await Attendance.countDocuments(filter);

    // Calculate statistics for the filtered set
    const stats = await Attendance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalDuration: { $sum: "$duration" }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: attendances.length,
      total,
      stats: stats.reduce((acc, curr) => {
        acc[curr._id] = { count: curr.count, totalDuration: curr.totalDuration };
        return acc;
      }, {}),
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit),
        next: page * limit < total ? page + 1 : null,
        prev: page > 1 ? page - 1 : null
      },
      data: attendances
    });
  } catch (error) {
    console.error("Get attendances error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance records"
    });
  }
};

// @desc    Get single attendance record
// @route   GET /api/attendance/:id
// @access  Private
exports.getAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id)
      .populate("user", "name studentId department year profileImage")
      .populate("event", "title description location")
      .populate("verifiedBy", "name email")
      .lean();

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found"
      });
    }

    // Check permissions (admin, verifier, or own attendance)
    const isOwner = attendance.user?._id?.toString() === req.user.id;
    const isVerifier = attendance.verifiedBy?._id?.toString() === req.user.id;
    
    if (req.user.role !== "admin" && !isOwner && !isVerifier) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this attendance record"
      });
    }

    res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    console.error("Get attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance record"
    });
  }
};

// @desc    Create attendance record (Admin only)
// @route   POST /api/attendance
// @access  Private/Admin
exports.createAttendance = async (req, res) => {
  try {
    const { userId, eventId, ...attendanceData } = req.body;

    // Validate required fields
    if (!userId && !attendanceData.user) {
      return res.status(400).json({
        success: false,
        message: "User is required"
      });
    }

    // Check if user exists
    const user = await User.findById(userId || attendanceData.user);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if event exists (if provided)
    if (eventId || attendanceData.event) {
      const event = await Event.findById(eventId || attendanceData.event);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found"
        });
      }
    }

    // Check for duplicate attendance for same day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await Attendance.findOne({
      user: userId || attendanceData.user,
      event: eventId || attendanceData.event,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: "Attendance already marked for today"
      });
    }

    // Set default date to today if not provided
    if (!attendanceData.date) {
      attendanceData.date = new Date();
    }

    // Add verifiedBy if not provided
    if (!attendanceData.verifiedBy) {
      attendanceData.verifiedBy = req.user.id;
    }

    // Create attendance record
    const attendance = await Attendance.create({
      ...attendanceData,
      user: userId || attendanceData.user,
      event: eventId || attendanceData.event
    });

    // Update user's activeness score
    if (attendance.status === "Present") {
      user.activeness = Math.min(100, user.activeness + 5);
      await user.save();
    }

    // Populate for response
    await attendance.populate("user", "name studentId department");
    await attendance.populate("event", "title");

    // Log the action
    await AuditLog.log({
      userId: req.user.id,
      action: "create",
      resource: "Attendance",
      resourceId: attendance._id,
      resourceName: `${user.name} - ${attendance.eventName || "Attendance"}`,
      changes: {
        after: {
          userName: user.name,
          eventName: attendance.eventName,
          status: attendance.status,
          date: attendance.date
        }
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    res.status(201).json({
      success: true,
      message: "Attendance marked successfully",
      data: attendance
    });
  } catch (error) {
    console.error("Create attendance error:", error);
    
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", ")
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to mark attendance"
    });
  }
};

// @desc    Mark bulk attendance (Admin only)
// @route   POST /api/attendance/bulk
// @access  Private/Admin
exports.createBulkAttendance = async (req, res) => {
  try {
    const { users, eventId, eventName, eventType, date, status = "Present" } = req.body;

    if (!users || !Array.isArray(users) || users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Users array is required"
      });
    }

    if (!eventName) {
      return res.status(400).json({
        success: false,
        message: "Event name is required"
      });
    }

    const attendanceDate = date ? new Date(date) : new Date();
    const today = new Date(attendanceDate);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const results = {
      success: [],
      failed: []
    };

    // Process each user
    for (const userId of users) {
      try {
        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
          results.failed.push({ userId, error: "User not found" });
          continue;
        }

        // Check for duplicate
        const existingAttendance = await Attendance.findOne({
          user: userId,
          event: eventId,
          eventName,
          date: {
            $gte: today,
            $lt: tomorrow
          }
        });

        if (existingAttendance) {
          results.failed.push({ userId, error: "Attendance already marked" });
          continue;
        }

        // Create attendance record
        const attendance = await Attendance.create({
          user: userId,
          event: eventId,
          eventName,
          eventType: eventType || "Training",
          date: attendanceDate,
          status,
          verifiedBy: req.user.id
        });

        // Update user activeness
        if (status === "Present") {
          user.activeness = Math.min(100, user.activeness + 5);
          await user.save();
        }

        results.success.push({
          userId,
          attendanceId: attendance._id,
          userName: user.name
        });

      } catch (error) {
        results.failed.push({ userId, error: error.message });
      }
    }

    // Log the bulk action
    await AuditLog.log({
      userId: req.user.id,
      action: "create",
      resource: "Attendance",
      resourceName: `Bulk attendance for ${eventName}`,
      changes: {
        after: {
          eventName,
          totalUsers: users.length,
          successful: results.success.length,
          failed: results.failed.length
        }
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    res.status(201).json({
      success: true,
      message: `Bulk attendance completed. Success: ${results.success.length}, Failed: ${results.failed.length}`,
      data: results
    });
  } catch (error) {
    console.error("Bulk attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark bulk attendance"
    });
  }
};

// @desc    Update attendance record
// @route   PUT /api/attendance/:id
// @access  Private/Admin
exports.updateAttendance = async (req, res) => {
  try {
    let attendance = await Attendance.findById(req.params.id)
      .populate("user", "name studentId");

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found"
      });
    }

    // Store old data for audit
    const oldData = {
      status: attendance.status,
      timeIn: attendance.timeIn,
      timeOut: attendance.timeOut,
      performanceScore: attendance.performanceScore
    };

    // Update attendance
    attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    )
    .populate("user", "name studentId department")
    .populate("verifiedBy", "name");

    // Update user activeness if status changed
    if (req.body.status && req.body.status !== oldData.status) {
      const user = await User.findById(attendance.user._id);
      if (user) {
        if (req.body.status === "Present" && oldData.status !== "Present") {
          user.activeness = Math.min(100, user.activeness + 5);
        } else if (req.body.status !== "Present" && oldData.status === "Present") {
          user.activeness = Math.max(0, user.activeness - 5);
        }
        await user.save();
      }
    }

    // Log the action
    await AuditLog.log({
      userId: req.user.id,
      action: "update",
      resource: "Attendance",
      resourceId: attendance._id,
      resourceName: `${attendance.user.name} - ${attendance.eventName}`,
      changes: {
        before: oldData,
        after: {
          status: attendance.status,
          timeIn: attendance.timeIn,
          timeOut: attendance.timeOut,
          performanceScore: attendance.performanceScore
        },
        fields: Object.keys(req.body)
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    res.status(200).json({
      success: true,
      message: "Attendance updated successfully",
      data: attendance
    });
  } catch (error) {
    console.error("Update attendance error:", error);
    
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", ")
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update attendance"
    });
  }
};

// @desc    Delete attendance record
// @route   DELETE /api/attendance/:id
// @access  Private/Admin
exports.deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id)
      .populate("user", "name studentId");

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found"
      });
    }

    // Store data for audit
    const attendanceData = {
      userName: attendance.user.name,
      eventName: attendance.eventName,
      date: attendance.date,
      status: attendance.status
    };

    // Update user activeness
    if (attendance.status === "Present") {
      const user = await User.findById(attendance.user._id);
      if (user) {
        user.activeness = Math.max(0, user.activeness - 5);
        await user.save();
      }
    }

    // Delete attendance
    await attendance.deleteOne();

    // Log the action
    await AuditLog.log({
      userId: req.user.id,
      action: "delete",
      resource: "Attendance",
      resourceId: attendance._id,
      resourceName: `${attendanceData.userName} - ${attendanceData.eventName}`,
      changes: {
        before: attendanceData
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    res.status(200).json({
      success: true,
      message: "Attendance record deleted successfully",
      data: {}
    });
  } catch (error) {
    console.error("Delete attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete attendance record"
    });
  }
};

// @desc    Get user's attendance
// @route   GET /api/attendance/user/:userId
// @access  Private
exports.getUserAttendance = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;

    // Check permissions (admin or own attendance)
    if (req.user.role !== "admin" && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this user's attendance"
      });
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Date range filter
    const filter = { user: userId };
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.date.$lte = new Date(req.query.endDate);
    }

    if (req.query.status) filter.status = req.query.status;
    if (req.query.eventType) filter.eventType = req.query.eventType;

    // Get attendance records
    const attendances = await Attendance.find(filter)
      .populate("event", "title")
      .populate("verifiedBy", "name")
      .skip(skip)
      .limit(limit)
      .sort({ date: -1 })
      .lean();

    const total = await Attendance.countDocuments(filter);

    // Get attendance summary
    const summary = await Attendance.getUserSummary(
      userId,
      req.query.startDate ? new Date(req.query.startDate) : new Date(0),
      req.query.endDate ? new Date(req.query.endDate) : new Date()
    );

    res.status(200).json({
      success: true,
      data: {
        summary,
        records: attendances,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error("Get user attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user attendance"
    });
  }
};

// @desc    Get today's attendance
// @route   GET /api/attendance/today
// @access  Private/Admin
exports.getTodayAttendance = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendances = await Attendance.find({
      date: {
        $gte: today,
        $lt: tomorrow
      }
    })
    .populate("user", "name studentId department")
    .populate("event", "title")
    .sort({ timeIn: -1 })
    .lean();

    // Get today's stats
    const stats = await Attendance.aggregate([
      {
        $match: {
          date: {
            $gte: today,
            $lt: tomorrow
          }
        }
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        date: today,
        total: attendances.length,
        stats: stats.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        attendances
      }
    });
  } catch (error) {
    console.error("Get today attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch today's attendance"
    });
  }
};

// @desc    Get attendance statistics
// @route   GET /api/attendance/stats
// @access  Private/Admin
exports.getAttendanceStats = async (req, res) => {
  try {
    // Date range
    const startDate = req.query.startDate 
      ? new Date(req.query.startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
    const endDate = req.query.endDate 
      ? new Date(req.query.endDate)
      : new Date();

    // Overall statistics
    const overallStats = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] }
          },
          absent: {
            $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] }
          },
          late: {
            $sum: { $cond: [{ $eq: ["$status", "Late"] }, 1, 0] }
          },
          averageDuration: { $avg: "$duration" },
          totalDuration: { $sum: "$duration" }
        }
      },
      {
        $project: {
          _id: 0,
          totalRecords: 1,
          present: 1,
          absent: 1,
          late: 1,
          attendanceRate: {
            $multiply: [
              { $divide: ["$present", "$totalRecords"] },
              100
            ]
          },
          averageDuration: { $round: ["$averageDuration", 2] },
          totalDuration: 1
        }
      }
    ]);

    // Daily attendance trend
    const dailyTrend = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$date" }
          },
          present: {
            $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] }
          },
          total: { $sum: 1 }
        }
      },
      {
        $project: {
          date: "$_id",
          present: 1,
          total: 1,
          rate: {
            $multiply: [
              { $divide: ["$present", "$total"] },
              100
            ]
          }
        }
      },
      { $sort: { date: 1 } },
      { $limit: 30 }
    ]);

    // Event type statistics
    const eventTypeStats = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: "$eventType",
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          eventType: "$_id",
          total: 1,
          present: 1,
          attendanceRate: {
            $multiply: [
              { $divide: ["$present", "$total"] },
              100
            ]
          }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Top attendees
    const topAttendees = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
          status: "Present"
        }
      },
      {
        $group: {
          _id: "$user",
          attendanceCount: { $sum: 1 },
          averageDuration: { $avg: "$duration" }
        }
      },
      { $sort: { attendanceCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo"
        }
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          name: "$userInfo.name",
          studentId: "$userInfo.studentId",
          department: "$userInfo.department",
          attendanceCount: 1,
          averageDuration: { $round: ["$averageDuration", 2] }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        period: { startDate, endDate },
        overall: overallStats[0] || {
          totalRecords: 0,
          present: 0,
          absent: 0,
          late: 0,
          attendanceRate: 0,
          averageDuration: 0,
          totalDuration: 0
        },
        dailyTrend,
        byEventType: eventTypeStats,
        topAttendees
      }
    });
  } catch (error) {
    console.error("Get attendance stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance statistics"
    });
  }
};