const mongoose = require("mongoose");

const achievementSchema = new mongoose.Schema({
  // User Reference
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User is required"],
    index: true
  },

  // Achievement Details
  title: {
    type: String,
    required: [true, "Achievement title is required"],
    trim: true,
    maxlength: [200, "Title cannot exceed 200 characters"]
  },

  description: {
    type: String,
    required: [true, "Achievement description is required"],
    trim: true
  },

  shortDescription: {
    type: String,
    maxlength: [100, "Short description cannot exceed 100 characters"],
    trim: true
  },

  // Achievement Classification
  category: {
    type: String,
    enum: ["Sports", "Academic", "Leadership", "Cultural", "NCC", "Community", "Technical", "Other"],
    default: "NCC"
  },

  subCategory: {
    type: String,
    trim: true
  },

  level: {
    type: String,
    enum: ["College", "University", "State", "National", "International"],
    default: "College"
  },

  // Achievement Metadata
  date: {
    type: Date,
    required: [true, "Achievement date is required"],
    index: true
  },

  venue: {
    type: String,
    trim: true
  },

  organizer: {
    type: String,
    trim: true
  },

  // Media & Evidence
  evidence: [{
    type: String, // URLs to images/documents
    description: String
  }],

  certificate: {
    url: String,
    issuedBy: String,
    issueDate: Date,
    certificateId: String
  },

  // Verification System
  verified: {
    type: Boolean,
    default: false,
    index: true
  },

  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  verifiedAt: Date,

  verificationNotes: {
    type: String,
    trim: true
  },

  // Points & Recognition
  points: {
    type: Number,
    default: 0,
    min: 0
  },

  recognitionLevel: {
    type: String,
    enum: ["Appreciation", "Certificate", "Medal", "Trophy", "Scholarship", "Promotion"],
    default: "Certificate"
  },

  // References
  event: {
    type: mongoose.Schema.Types.String,
    ref: "Event"
  },

  course: {
    type: mongoose.Schema.Types.String,
    ref: "Course"
  },

  // Tags for searchability
  tags: [{
    type: String,
    trim: true
  }],

  // Visibility & Sharing
  isPublic: {
    type: Boolean,
    default: true
  },

  canShare: {
    type: Boolean,
    default: true
  },

  // Statistics
  views: {
    type: Number,
    default: 0
  },

  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],

  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

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

// Virtual for total likes
achievementSchema.virtual("totalLikes").get(function() {
  return this.likes.length;
});

// Virtual for total comments
achievementSchema.virtual("totalComments").get(function() {
  return this.comments.length;
});

// Virtual for achievement age
achievementSchema.virtual("ageInDays").get(function() {
  const diff = Date.now() - this.createdAt.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

// Indexes
achievementSchema.index({ title: "text", description: "text", tags: "text" });
achievementSchema.index({ user: 1, date: -1 });
achievementSchema.index({ category: 1, level: 1 });
achievementSchema.index({ verified: 1, createdAt: -1 });
achievementSchema.index({ points: -1 });
achievementSchema.index({ "user": 1, "verified": 1 });

// Pre-save middleware
achievementSchema.pre("save", function(next) {
  // Auto-calculate points based on level
  if (this.isModified("level") || this.isNew) {
    const pointsMap = {
      "College": 10,
      "University": 25,
      "State": 50,
      "National": 100,
      "International": 200
    };
    
    if (!this.points || this.points === 0) {
      this.points = pointsMap[this.level] || 10;
    }
  }

  // Update verifiedAt if verification status changes
  if (this.isModified("verified") && this.verified) {
    this.verifiedAt = new Date();
  }

  this.updatedAt = Date.now();
  // next();
});

// Method to verify achievement
achievementSchema.methods.verify = async function(verifiedBy, notes = "") {
  this.verified = true;
  this.verifiedBy = verifiedBy;
  this.verifiedAt = new Date();
  this.verificationNotes = notes;
  return await this.save();
};

// Method to add comment
achievementSchema.methods.addComment = async function(userId, text) {
  this.comments.push({
    user: userId,
    text: text
  });
  return await this.save();
};

// Static method to get user's total points
achievementSchema.statics.getUserTotalPoints = async function(userId) {
  const result = await this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId), verified: true } },
    { $group: { _id: "$user", totalPoints: { $sum: "$points" } } }
  ]);
  
  return result.length > 0 ? result[0].totalPoints : 0;
};

// Static method to get leaderboard
achievementSchema.statics.getLeaderboard = async function(limit = 10, category = null) {
  const matchStage = { verified: true };
  if (category) {
    matchStage.category = category;
  }

  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: "$user",
        totalPoints: { $sum: "$points" },
        totalAchievements: { $sum: 1 }
      }
    },
    { $sort: { totalPoints: -1 } },
    { $limit: limit },
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
        totalPoints: 1,
        totalAchievements: 1
      }
    }
  ];

  return await this.aggregate(pipeline);
};

const Achievement = mongoose.model("Achievement", achievementSchema);

module.exports = Achievement;