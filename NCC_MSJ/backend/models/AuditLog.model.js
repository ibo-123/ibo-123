const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  // User who performed the action
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  // User information (cached for performance)
  userInfo: {
    name: String,
    email: String,
    studentId: String,
    role: String
  },

  // Action Details
  action: {
    type: String,
    required: true,
    enum: [
      "create", "read", "update", "delete",
      "login", "logout", "register", "approve",
      "reject", "verify", "export", "import",
      "backup", "restore", "config_change"
    ],
    index: true
  },

  // Resource Details
  resource: {
    type: String,
    required: true,
    enum: [
      "User", "Course", "Attendance", "Achievement",
      "Event", "Notification", "Settings", "System"
    ],
    index: true
  },

  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },

  resourceName: String,

  // Changes made
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed,
    fields: [String]
  },

  // IP Address & Location
  ipAddress: String,
  userAgent: String,
  location: {
    country: String,
    city: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },

  // Status
  status: {
    type: String,
    enum: ["success", "failure", "warning"],
    default: "success",
    index: true
  },

  errorMessage: String,
  errorStack: String,

  // Performance
  executionTime: Number, // in milliseconds
  memoryUsage: Number,   // in MB

  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });
auditLogSchema.index({ action: 1, resource: 1 });
auditLogSchema.index({ status: 1, timestamp: -1 });

// TTL index for auto-deletion (keep logs for 90 days)
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Pre-save middleware to cache user info
auditLogSchema.pre("save", async function(next) {
  if (this.isNew && this.userId && !this.userInfo) {
    try {
      const User = mongoose.model("User");
      const user = await User.findById(this.userId)
        .select("name email studentId role")
        .lean();
      
      if (user) {
        this.userInfo = {
          name: user.name,
          email: user.email,
          studentId: user.studentId,
          role: user.role
        };
      }
    } catch (error) {
      // Silently fail - we still want to save the audit log
      console.error("Error caching user info:", error);
    }
  }
  // next();
});

// Static method to log an action
auditLogSchema.statics.log = async function(data) {
  const log = new this(data);
  return await log.save();
};

// Static method to get logs with filters
auditLogSchema.statics.getLogs = async function(filters = {}, options = {}) {
  const {
    page = 1,
    limit = 50,
    sortBy = "timestamp",
    sortOrder = "desc"
  } = options;

  const query = this.find(filters);

  // Sorting
  const sort = {};
  sort[sortBy] = sortOrder === "desc" ? -1 : 1;
  query.sort(sort);

  // Pagination
  const skip = (page - 1) * limit;
  query.skip(skip).limit(limit);

  // Populate user info if not cached
  query.populate("userId", "name email role");

  const [logs, total] = await Promise.all([
    query.lean(),
    this.countDocuments(filters)
  ]);

  return {
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    limit
  };
};

// Static method to clean old logs
auditLogSchema.statics.cleanOldLogs = async function(days = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const result = await this.deleteMany({
    timestamp: { $lt: cutoffDate }
  });

  return result;
};

// Static method to get statistics
auditLogSchema.statics.getStatistics = async function(startDate, endDate) {
  const matchStage = {
    timestamp: { $gte: startDate, $lte: endDate }
  };

  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: {
          action: "$action",
          resource: "$resource",
          status: "$status"
        },
        count: { $sum: 1 },
        avgExecutionTime: { $avg: "$executionTime" }
      }
    },
    {
      $group: {
        _id: {
          action: "$_id.action",
          resource: "$_id.resource"
        },
        total: { $sum: "$count" },
        success: {
          $sum: {
            $cond: [{ $eq: ["$_id.status", "success"] }, "$count", 0]
          }
        },
        failure: {
          $sum: {
            $cond: [{ $eq: ["$_id.status", "failure"] }, "$count", 0]
          }
        },
        avgExecutionTime: { $avg: "$avgExecutionTime" }
      }
    },
    {
      $project: {
        _id: 0,
        action: "$_id.action",
        resource: "$_id.resource",
        total: 1,
        success: 1,
        failure: 1,
        successRate: {
          $multiply: [
            { $divide: ["$success", "$total"] },
            100
          ]
        },
        avgExecutionTime: 1
      }
    },
    { $sort: { total: -1 } }
  ];

  return await this.aggregate(pipeline);
};

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

module.exports = AuditLog;