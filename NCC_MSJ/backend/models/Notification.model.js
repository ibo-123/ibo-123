const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  // Recipient
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  // Sender (optional)
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  // Notification Content
  title: {
    type: String,
    required: [true, "Notification title is required"],
    trim: true,
    maxlength: [100, "Title cannot exceed 100 characters"]
  },

  message: {
    type: String,
    required: [true, "Notification message is required"],
    trim: true,
    maxlength: [500, "Message cannot exceed 500 characters"]
  },

  // Notification Type
  type: {
    type: String,
    enum: [
      "info", "success", "warning", "error",
      "attendance", "achievement", "event", 
      "course", "announcement", "system"
    ],
    default: "info"
  },

  // Action (if clickable)
  action: {
    type: String,
    enum: ["view", "edit", "delete", "approve", "reject", "register", "attend", "complete"],
    default: "view"
  },

  actionUrl: {
    type: String,
    trim: true
  },

  // Reference to related document
  relatedTo: {
    model: {
      type: String,
      enum: ["User", "Event", "Attendance", "Achievement", "Course", "Notification"]
    },
    id: {
      type: mongoose.Schema.Types.ObjectId
    }
  },

  // Priority
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium"
  },

  // Status
  status: {
    type: String,
    enum: ["unread", "read", "archived", "deleted"],
    default: "unread",
    index: true
  },

  readAt: Date,

  // Delivery Settings
  channels: [{
    type: String,
    enum: ["in_app", "email", "sms", "push"],
    default: ["in_app"]
  }],

  delivered: {
    in_app: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: false }
  },

  deliveryAttempts: {
    type: Number,
    default: 0
  },

  // Expiry
  expiresAt: Date,

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
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

// Virtual for isExpired
notificationSchema.virtual("isExpired").get(function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Virtual for isUnread
notificationSchema.virtual("isUnread").get(function() {
  return this.status === "unread";
});

// Indexes
notificationSchema.index({ recipient: 1, status: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ type: 1, priority: 1 });
notificationSchema.index({ "relatedTo.model": 1, "relatedTo.id": 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Pre-save middleware
notificationSchema.pre("save", function(next) {
  // Set default expiry (7 days from creation)
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  // Auto-mark as read if opened
  if (this.isModified("status") && this.status === "read" && !this.readAt) {
    this.readAt = new Date();
  }

  this.updatedAt = Date.now();
  next();
});

// Method to mark as read
notificationSchema.methods.markAsRead = async function() {
  this.status = "read";
  this.readAt = new Date();
  return await this.save();
};

// Method to mark as archived
notificationSchema.methods.markAsArchived = async function() {
  this.status = "archived";
  return await this.save();
};

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  return await notification.save();
};

// Static method to get user notifications
notificationSchema.statics.getUserNotifications = async function(userId, options = {}) {
  const {
    limit = 20,
    skip = 0,
    status = null,
    type = null,
    unreadOnly = false
  } = options;

  const query = { recipient: userId };

  if (status) {
    query.status = status;
  } else if (unreadOnly) {
    query.status = "unread";
  }

  if (type) {
    query.type = type;
  }

  return await this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("sender", "name email")
    .lean();
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = async function(userId) {
  return await this.updateMany(
    { recipient: userId, status: "unread" },
    { 
      $set: { 
        status: "read",
        readAt: new Date()
      }
    }
  );
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({
    recipient: userId,
    status: "unread"
  });
};

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;