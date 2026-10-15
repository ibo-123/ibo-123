const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const {
  SYSTEM_ROLES,
  CONTRIBUTOR_ROLES,
  SUBJECTS,
  VERIFICATION_STATUSES,
} = require('../constants/contributors');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [
        function passwordRequired() {
          return this.isNew || this.isModified('password');
        },
        'Password is required',
      ],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: SYSTEM_ROLES,
      required: [true, 'Role is required'],
    },
    contributorRole: {
      type: String,
      enum: {
        values: CONTRIBUTOR_ROLES,
        message: 'Invalid contributor role',
      },
      required: [
        function contributorRoleRequired() {
          return this.role === 'CONTRIBUTOR';
        },
        'Contributor role is required',
      ],
    },
    subject: {
      type: String,
      enum: {
        values: SUBJECTS,
        message: 'Invalid subject',
      },
      required: [
        function subjectRequired() {
          return this.role === 'CONTRIBUTOR';
        },
        'Subject is required',
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    academicVerificationStatus: {
      type: String,
      enum: {
        values: VERIFICATION_STATUSES,
        message: 'Invalid verification status',
      },
      required: [
        function verificationRequired() {
          return this.role === 'CONTRIBUTOR';
        },
        'Academic verification status is required',
      ],
    },
    notificationPreferences: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      inAppNotifications: {
        type: Boolean,
        default: true,
      },
    },
  },
  { timestamps: true },
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function toSafeObject() {
  const safe = {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    isActive: this.isActive !== false,
    notificationPreferences: {
      emailNotifications: this.notificationPreferences?.emailNotifications !== false,
      inAppNotifications: this.notificationPreferences?.inAppNotifications !== false,
    },
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };

  if (this.role === 'CONTRIBUTOR') {
    safe.contributorRole = this.contributorRole ?? null;
    safe.subject = this.subject ?? null;
    safe.academicVerificationStatus = this.academicVerificationStatus ?? null;
  }

  return safe;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
