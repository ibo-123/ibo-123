const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  // Personal Information
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    minlength: [2, "Name must be at least 2 characters"],
    maxlength: [100, "Name cannot exceed 100 characters"]
  },

  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"]
  },

  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
    select: false // Never return password in queries
  },

  // Student Information
  studentId: {
    type: String,
    required: [true, "Student ID is required"],
    unique: true,
    uppercase: true,
    trim: true
  },

  department: {
    type: String,
    required: [true, "Department is required"],
    trim: true
  },

  year: {
    type: String,
    required: [true, "Year is required"],
    enum: ["First Year", "Second Year", "Third Year", "Fourth Year", "Fifth Year", "Graduated"],
    default: "First Year"
  },

  phone: {
    type: String,
    trim: true,
    match: [/^[0-9]{10}$/, "Please enter a valid 10-digit phone number"]
  },

  dateOfBirth: {
    type: Date
  },

  address: {
    type: String,
    trim: true
  },

  // NCC Specific Information
  nccUnit: {
    type: String,
    trim: true
  },

  nccRank: {
    type: String,
    enum: ["Cadet", "Senior Cadet", "Under Officer", "Cadet Captain", "None"],
    default: "Cadet"
  },

  // System Information
  role: {
    type: String,
    enum: ["admin", "member"],
    default: "member"
  },

  status: {
    type: String,
    enum: ["Active", "Inactive", "Suspended", "Graduated"],
    default: "Active"
  },

  activeness: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  // Profile Information
  profileImage: {
    type: String,
    default: ""
  },

  bio: {
    type: String,
    maxlength: [500, "Bio cannot exceed 500 characters"],
    default: ""
  },

  // Verification & Security
  emailVerified: {
    type: Boolean,
    default: false
  },

  verificationToken: String,
  verificationTokenExpires: Date,

  passwordResetToken: String,
  passwordResetExpires: Date,

  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,

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

// Virtual for full name
userSchema.virtual("fullName").get(function() {
  return this.name;
});

// Indexes for better query performance
// userSchema.index({ email });
// userSchema.index({ studentId: 1 });
userSchema.index({ department: 1 });
userSchema.index({ status: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// Password hashing middleware
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Update timestamp on save
// userSchema.pre("save", function () {
//   this.updatedAt = Date.now();
// });

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if account is locked
userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = async function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return await this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 0.25 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return await this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = async function() {
  return await this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

// Static method to find by email (including password for auth)
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email }).select("+password");
};

const User = mongoose.model("User", userSchema);

module.exports = User;