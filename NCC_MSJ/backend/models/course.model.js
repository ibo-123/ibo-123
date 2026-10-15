const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  // Course Information
  title: {
    type: String,
    required: [true, "Course title is required"],
    trim: true,
    maxlength: [200, "Title cannot exceed 200 characters"]
  },

  description: {
    type: String,
    required: [true, "Course description is required"],
    trim: true
  },

  shortDescription: {
    type: String,
    maxlength: [150, "Short description cannot exceed 150 characters"],
    trim: true
  },

  // Course Details
  category: {
    type: String,
    enum: ["Training", "Academic", "Leadership", "Technical", "General", "NCC"],
    default: "NCC"
  },

  level: {
    type: String,
    enum: ["Beginner", "Intermediate", "Advanced", "All Levels"],
    default: "All Levels"
  },

  tags: [{
    type: String,
    trim: true
  }],

  // Media & Content
  thumbnail: {
    type: String,
    default: ""
  },

  content: {
    type: String,
    required: [true, "Course content is required"]
  },

  attachments: [{
    filename: String,
    url: String,
    fileType: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  links: [{
    title: String,
    url: String,
    description: String
  }],

  // Course Metadata
  duration: {
    type: Number, // in minutes
    default: 0
  },

  chapters: [{
    title: String,
    content: String,
    duration: Number,
    order: Number
  }],

  // Enrollment & Progress
  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],

  completedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    completedAt: {
      type: Date,
      default: Date.now
    },
    score: Number
  }],

  // Ratings & Reviews
  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },

  totalReviews: {
    type: Number,
    default: 0
  },

  // Course Settings
  isPublished: {
    type: Boolean,
    default: false
  },

  isFeatured: {
    type: Boolean,
    default: false
  },

  isFree: {
    type: Boolean,
    default: true
  },

  price: {
    type: Number,
    default: 0,
    min: 0
  },

  // Creator Information
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // Statistics
  views: {
    type: Number,
    default: 0
  },

  totalEnrollments: {
    type: Number,
    default: 0
  },

  completionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },

  publishedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total chapters
courseSchema.virtual("totalChapters").get(function() {
  return this.chapters.length;
});

// Virtual for total duration in hours
courseSchema.virtual("durationHours").get(function() {
  return (this.duration / 60).toFixed(1);
});

// Indexes
courseSchema.index({ title: "text", description: "text", tags: "text" });
courseSchema.index({ category: 1 });
courseSchema.index({ isPublished: 1 });
courseSchema.index({ isFeatured: 1 });
courseSchema.index({ averageRating: -1 });
courseSchema.index({ createdAt: -1 });
courseSchema.index({ createdBy: 1 });

// Middleware to update average rating
courseSchema.pre("save", function(next) {
  if (this.ratings && this.ratings.length > 0) {
    const total = this.ratings.reduce((sum, rating) => sum + rating.rating, 0);
    this.averageRating = total / this.ratings.length;
    this.totalReviews = this.ratings.length;
  }
  next();
});

// Method to add enrollment
courseSchema.methods.addEnrollment = async function(userId) {
  if (!this.enrolledStudents.includes(userId)) {
    this.enrolledStudents.push(userId);
    this.totalEnrollments += 1;
    await this.save();
  }
};

// Method to mark as completed
courseSchema.methods.markCompleted = async function(userId, score = null) {
  const existing = this.completedBy.find(comp => comp.user.toString() === userId.toString());
  
  if (!existing) {
    this.completedBy.push({
      user: userId,
      score: score
    });
    
    // Update completion rate
    if (this.totalEnrollments > 0) {
      this.completionRate = (this.completedBy.length / this.totalEnrollments) * 100;
    }
    
    await this.save();
  }
};

// Static method to get popular courses
courseSchema.statics.getPopularCourses = function(limit = 10) {
  return this.find({ isPublished: true })
    .sort({ totalEnrollments: -1, averageRating: -1 })
    .limit(limit)
    .populate("createdBy", "name email");
};

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;