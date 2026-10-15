const AuditLog = require("../models/AuditLog.model");

// @desc    Get audit logs
// @route   GET /api/audit-logs
// @access  Private/Admin
exports.getAuditLogs = async (req, res) => {
  try {
    // Build filter
    const filter = {};

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      filter.timestamp = {};
      if (req.query.startDate) filter.timestamp.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.timestamp.$lte = new Date(req.query.endDate);
    }

    // Other filters
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.action) filter.action = req.query.action;
    if (req.query.resource) filter.resource = req.query.resource;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.ipAddress) filter.ipAddress = req.query.ipAddress;

    // Search by user name or resource name
    if (req.query.search) {
      filter.$or = [
        { "userInfo.name": { $regex: req.query.search, $options: "i" } },
        { resourceName: { $regex: req.query.search, $options: "i" } }
      ];
    }

    // Get logs with pagination
    const result = await AuditLog.getLogs(filter, {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      sortBy: req.query.sortBy || "timestamp",
      sortOrder: req.query.sortOrder || "desc"
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Get audit logs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch audit logs"
    });
  }
};

// @desc    Get audit log statistics
// @route   GET /api/audit-logs/stats
// @access  Private/Admin
exports.getAuditStats = async (req, res) => {
  try {
    // Date range (default: last 30 days)
    const startDate = req.query.startDate 
      ? new Date(req.query.startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate 
      ? new Date(req.query.endDate)
      : new Date();

    const stats = await AuditLog.getStatistics(startDate, endDate);

    // Get top users by activity
    const topUsers = await AuditLog.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: "$userId",
          count: { $sum: 1 },
          success: {
            $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] }
          },
          failure: {
            $sum: { $cond: [{ $eq: ["$status", "failure"] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } },
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
          email: "$userInfo.email",
          role: "$userInfo.role",
          activityCount: "$count",
          successRate: {
            $multiply: [
              { $divide: ["$success", "$count"] },
              100
            ]
          }
        }
      }
    ]);

    // Get hourly activity distribution
    const hourlyActivity = await AuditLog.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $hour: "$timestamp" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        period: { startDate, endDate },
        statistics: stats,
        topUsers,
        hourlyActivity
      }
    });
  } catch (error) {
    console.error("Get audit stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch audit statistics"
    });
  }
};

// @desc    Clean old audit logs
// @route   DELETE /api/audit-logs/cleanup
// @access  Private/Admin
exports.cleanupAuditLogs = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 90;

    if (days < 1) {
      return res.status(400).json({
        success: false,
        message: "Days must be at least 1"
      });
    }

    const result = await AuditLog.cleanOldLogs(days);

    // Log the cleanup action
    await AuditLog.log({
      userId: req.user.id,
      action: "delete",
      resource: "AuditLog",
      resourceName: `Cleanup older than ${days} days`,
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    res.status(200).json({
      success: true,
      message: `Cleaned up audit logs older than ${days} days`,
      data: result
    });
  } catch (error) {
    console.error("Cleanup audit logs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clean up audit logs"
    });
  }
};

// @desc    Export audit logs
// @route   GET /api/audit-logs/export
// @access  Private/Admin
exports.exportAuditLogs = async (req, res) => {
  try {
    // Date range (default: last 30 days)
    const startDate = req.query.startDate 
      ? new Date(req.query.startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate 
      ? new Date(req.query.endDate)
      : new Date();

    // Get logs for export
    const logs = await AuditLog.find({
      timestamp: { $gte: startDate, $lte: endDate }
    })
    .populate("userId", "name email role")
    .sort({ timestamp: -1 })
    .lean();

    // Format logs for CSV/JSON export
    const formattedLogs = logs.map(log => ({
      timestamp: log.timestamp,
      user: log.userId?.name || log.userInfo?.name,
      email: log.userId?.email || log.userInfo?.email,
      role: log.userId?.role || log.userInfo?.role,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      resourceName: log.resourceName,
      status: log.status,
      ipAddress: log.ipAddress,
      location: log.location?.city ? `${log.location.city}, ${log.location.country}` : null,
      executionTime: log.executionTime
    }));

    // Log the export action
    await AuditLog.log({
      userId: req.user.id,
      action: "export",
      resource: "AuditLog",
      resourceName: `Export from ${startDate.toISOString()} to ${endDate.toISOString()}`,
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    // Determine export format
    const format = req.query.format || 'json';

    if (format === 'csv') {
      // Convert to CSV
      const fields = ['timestamp', 'user', 'email', 'role', 'action', 'resource', 'resourceName', 'status', 'ipAddress', 'location', 'executionTime'];
      const csvData = [
        fields.join(','),
        ...formattedLogs.map(log => fields.map(field => {
          const value = log[field];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
      return res.send(csvData);
    }

    // Default to JSON
    res.status(200).json({
      success: true,
      data: {
        period: { startDate, endDate },
        total: formattedLogs.length,
        logs: formattedLogs
      }
    });
  } catch (error) {
    console.error("Export audit logs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export audit logs"
    });
  }
};