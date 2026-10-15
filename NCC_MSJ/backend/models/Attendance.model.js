const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  // User Reference
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User is required"],
    index: true
  },

  // Event Information
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    index: true
  },

  eventName: {
    type: String,
    required: [true, "Event name is required"],
    trim: true
  },

  eventType: {
    type: String,
    enum: ["Training", "Meeting", "Camp", "Competition", "Drill", "Other"],
    default: "Training"
  },

  // Attendance Details
  date: {
    type: Date,
    required: [true, "Date is required"],
    index: true
  },

  timeIn: {
    type: Date,
    default: Date.now
  },

  timeOut: {
    type: Date
  },

  status: {
    type: String,
    enum: ["Present", "Absent", "Late", "Excused", "Half Day"],
    default: "Present"
  },

  // Location Information
  location: {
    type: String,
    trim: true
  },

  coordinates: {
    lat: Number,
    lng: Number
  },

  // Verification
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  verificationMethod: {
    type: String,
    enum: ["Manual", "QR Code", "Biometric", "RFID", "Mobile"],
    default: "Manual"
  },

  verificationNotes: {
    type: String,
    trim: true
  },

  // Notes & Remarks
  notes: {
    type: String,
    trim: true,
    maxlength: [500, "Notes cannot exceed 500 characters"]
  },

  // Performance Metrics
  performanceScore: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },

  participationLevel: {
    type: String,
    enum: ["Excellent", "Good", "Average", "Poor", "Not Participated"],
    default: "Average"
  },

  // Additional Data
  uniformCheck: {
    type: Boolean,
    default: true
  },

  equipmentCheck: {
    type: Boolean,
    default: true
  },

  medicalStatus: {
    type: String,
    enum: ["Fit", "Unfit", "Light Duty", "Resting"],
    default: "Fit"
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for duration
attendanceSchema.virtual("duration").get(function() {
  if (this.timeIn && this.timeOut) {
    const diff = this.timeOut.getTime() - this.timeIn.getTime();
    return Math.floor(diff / (1000 * 60)); // Duration in minutes
  }
  return 0;
});

// Virtual for isVerified
attendanceSchema.virtual("isVerified").get(function() {
  return !!this.verifiedBy;
});

// Compound Indexes
attendanceSchema.index({ user: 1, date: 1 });
attendanceSchema.index({ event: 1, date: 1 });
attendanceSchema.index({ date: 1, status: 1 });
attendanceSchema.index({ user: 1, status: 1 });

// Pre-save middleware
attendanceSchema.pre("save", function(next) {
  // Auto-calculate timeOut if not set and attendance is being marked as present for more than 4 hours
  if (this.timeIn && !this.timeOut && this.status === "Present") {
    const fourHoursLater = new Date(this.timeIn.getTime() + 4 * 60 * 60 * 1000);
    if (new Date() > fourHoursLater) {
      this.timeOut = fourHoursLater;
    }
  }
  
  // Update updatedAt
  this.updatedAt = Date.now();
  next();
});

// Static method to get user attendance summary
attendanceSchema.statics.getUserSummary = async function(userId, startDate, endDate) {
  const matchStage = {
    user: mongoose.Types.ObjectId(userId),
    date: { $gte: startDate, $lte: endDate }
  };

  const result = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalDuration: { $sum: { $ifNull: ["$duration", 0] } }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$count" },
        present: {
          $sum: {
            $cond: [{ $eq: ["$_id", "Present"] }, "$count", 0]
          }
        },
        absent: {
          $sum: {
            $cond: [{ $eq: ["$_id", "Absent"] }, "$count", 0]
          }
        },
        late: {
          $sum: {
            $cond: [{ $eq: ["$_id", "Late"] }, "$count", 0]
          }
        },
        totalDuration: { $sum: "$totalDuration" }
      }
    },
    {
      $project: {
        _id: 0,
        total: 1,
        present: 1,
        absent: 1,
        late: 1,
        attendanceRate: {
          $multiply: [
            { $divide: ["$present", "$total"] },
            100
          ]
        },
        averageDuration: {
          $divide: ["$totalDuration", "$present"]
        }
      }
    }
  ]);

  return result[0] || {
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    attendanceRate: 0,
    averageDuration: 0
  };
};

const Attendance = mongoose.model("Attendance", attendanceSchema);

module.exports = Attendance;