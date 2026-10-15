const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, "Event title is required"],
    trim: true,
    maxlength: [200, "Title cannot exceed 200 characters"]
  },

  description: {
    type: String,
    required: [true, "Event description is required"],
    trim: true
  },

  shortDescription: {
    type: String,
    maxlength: [150, "Short description cannot exceed 150 characters"],
    trim: true
  },

  // Event Details
  type: {
    type: String,
    enum: ["Training", "Meeting", "Camp", "Competition", "Workshop", "Seminar", "Social", "Other"],
    default: "Training"
  },

  category: {
    type: String,
    enum: ["Mandatory", "Optional", "Special", "Regular"],
    default: "Regular"
  },

  // Date & Time
  startDate: {
    type: Date,
    required: [true, "Start date is required"],
    index: true
  },

  endDate: {
    type: Date,
    required: [true, "End date is required"]
  },

  startTime: {
    type: String,
    required: [true, "Start time is required"]
  },

  endTime: {
    type: String,
    required: [true, "End time is required"]
  },

  // Recurring Events
  isRecurring: {
    type: Boolean,
    default: false
  },

  recurrencePattern: {
    type: String,
    enum: ["Daily", "Weekly", "Monthly", "Yearly", "Custom"],
    default: "Weekly"
  },

  recurrenceDays: [{
    type: String,
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  }],

  recurrenceEndDate: Date,

  // Location
  location: {
    type: String,
    required: [true, "Location is required"],
    trim: true
  },

  venue: {
    type: String,
    trim: true
  },

  coordinates: {
    lat: Number,
    lng: Number
  },

  // Attendance & Participation
  maxAttendees: {
    type: Number,
    min: 0,
    default: 0 // 0 means unlimited
  },

  minAttendees: {
    type: Number,
    min: 0,
    default: 0
  },

  attendees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ["Registered", "Attended", "Absent", "Cancelled"],
      default: "Registered"
    },
    checkInTime: Date,
    checkOutTime: Date
  }],

  // Requirements
  uniformRequired: {
    type: Boolean,
    default: true
  },

  equipmentRequired: {
    type: String,
    trim: true
  },

  prerequisites: [{
    type: String,
    trim: true
  }],

  // Media & Resources
  bannerImage: {
    type: String,
    default: ""
  },

  images: [{
    url: String,
    caption: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  documents: [{
    filename: String,
    url: String,
    fileType: String,
    size: Number,
    description: String
  }],

  links: [{
    title: String,
    url: String,
    description: String
  }],

  // Status & Visibility
  status: {
    type: String,
    enum: ["Draft", "Published", "Ongoing", "Completed", "Cancelled", "Postponed"],
    default: "Draft",
    index: true
  },

  isPublic: {
    type: Boolean,
    default: true
  },

  // Organization
  organizers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // Budget & Resources
  budget: {
    allocated: Number,
    spent: Number,
    currency: {
      type: String,
      default: "INR"
    }
  },

  resources: [{
    name: String,
    quantity: Number,
    available: Number,
    description: String
  }],

  // Feedback & Evaluation
  feedback: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
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

  // Statistics
  totalRegistrations: {
    type: Number,
    default: 0
  },

  totalAttendance: {
    type: Number,
    default: 0
  },

  attendanceRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  // Tags for searchability
  tags: [{
    type: String,
    trim: true
  }],

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },

  publishedAt: Date,
  completedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
eventSchema.virtual("isFull").get(function() {
  return this.maxAttendees > 0 && this.attendees.length >= this.maxAttendees;
});

eventSchema.virtual("availableSpots").get(function() {
  if (this.maxAttendees === 0) return "Unlimited";
  return Math.max(0, this.maxAttendees - this.attendees.length);
});

eventSchema.virtual("duration").get(function() {
  const start = new Date(`${this.startDate.toDateString()} ${this.startTime}`);
  const end = new Date(`${this.endDate.toDateString()} ${this.endTime}`);
  return Math.round((end - start) / (1000 * 60 * 60)); // Duration in hours
});

eventSchema.virtual("isUpcoming").get(function() {
  const now = new Date();
  const eventStart = new Date(`${this.startDate.toDateString()} ${this.startTime}`);
  return eventStart > now && this.status === "Published";
});

eventSchema.virtual("isPast").get(function() {
  const now = new Date();
  const eventEnd = new Date(`${this.endDate.toDateString()} ${this.endTime}`);
  return eventEnd < now;
});

// Indexes
eventSchema.index({ title: "text", description: "text", tags: "text" });
eventSchema.index({ startDate: 1, endDate: 1 });
eventSchema.index({ status: 1, startDate: 1 });
eventSchema.index({ type: 1, category: 1 });
eventSchema.index({ location: 1 });
eventSchema.index({ createdBy: 1 });
eventSchema.index({ "attendees.user": 1 });

// Pre-save middleware
eventSchema.pre("save", function(next) {
  // Auto-update status based on dates
  const now = new Date();
  const eventStart = new Date(`${this.startDate.toDateString()} ${this.startTime}`);
  const eventEnd = new Date(`${this.endDate.toDateString()} ${this.endTime}`);

  if (this.status === "Published") {
    if (now >= eventStart && now <= eventEnd) {
      this.status = "Ongoing";
    } else if (now > eventEnd) {
      this.status = "Completed";
      this.completedAt = now;
    }
  }

  // Update statistics
  if (this.attendees) {
    this.totalRegistrations = this.attendees.length;
    const attended = this.attendees.filter(a => a.status === "Attended").length;
    this.totalAttendance = attended;
    
    if (this.totalRegistrations > 0) {
      this.attendanceRate = (attended / this.totalRegistrations) * 100;
    }
  }

  // Update average rating
  if (this.feedback && this.feedback.length > 0) {
    const total = this.feedback.reduce((sum, fb) => sum + fb.rating, 0);
    this.averageRating = total / this.feedback.length;
  }

  this.updatedAt = Date.now();
  next();
});

// Method to register user
eventSchema.methods.registerUser = async function(userId) {
  if (this.isFull) {
    throw new Error("Event is full");
  }

  const existingRegistration = this.attendees.find(
    attendee => attendee.user.toString() === userId.toString()
  );

  if (!existingRegistration) {
    this.attendees.push({
      user: userId,
      status: "Registered"
    });
    await this.save();
  }
};

// Method to check in user
eventSchema.methods.checkInUser = async function(userId) {
  const attendance = this.attendees.find(
    attendee => attendee.user.toString() === userId.toString()
  );

  if (attendance) {
    attendance.status = "Attended";
    attendance.checkInTime = new Date();
    await this.save();
  }
};

// Method to check out user
eventSchema.methods.checkOutUser = async function(userId) {
  const attendance = this.attendees.find(
    attendee => attendee.user.toString() === userId.toString()
  );

  if (attendance && attendance.status === "Attended") {
    attendance.checkOutTime = new Date();
    await this.save();
  }
};

// Static method to get upcoming events
eventSchema.statics.getUpcomingEvents = function(limit = 10) {
  const now = new Date();
  return this.find({
    status: "Published",
    startDate: { $gte: now }
  })
  .sort({ startDate: 1 })
  .limit(limit)
  .populate("createdBy", "name email")
  .populate("organizers", "name");
};

// Static method to get events by date range
eventSchema.statics.getEventsByDateRange = function(startDate, endDate) {
  return this.find({
    startDate: { $gte: startDate },
    endDate: { $lte: endDate },
    status: { $in: ["Published", "Ongoing"] }
  })
  .sort({ startDate: 1 })
  .populate("attendees.user", "name studentId");
};

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;