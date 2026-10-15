const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  // System Settings
  siteName: {
    type: String,
    default: "NCC Management System"
  },

  siteDescription: {
    type: String,
    default: "National Cadet Corps Management Platform"
  },

  siteLogo: {
    type: String,
    default: ""
  },

  siteFavicon: {
    type: String,
    default: ""
  },

  // Contact Information
  contactEmail: {
    type: String,
    default: "ncc@college.edu"
  },

  contactPhone: {
    type: String,
    default: ""
  },

  contactAddress: {
    type: String,
    default: ""
  },

  // Attendance Settings
  attendance: {
    checkInStart: {
      type: String,
      default: "08:00"
    },
    checkInEnd: {
      type: String,
      default: "09:00"
    },
    checkOutStart: {
      type: String,
      default: "16:00"
    },
    checkOutEnd: {
      type: String,
      default: "17:00"
    },
    lateThreshold: {
      type: Number,
      default: 15 // minutes
    },
    halfDayThreshold: {
      type: Number,
      default: 4 // hours
    },
    requireLocation: {
      type: Boolean,
      default: false
    },
    requirePhoto: {
      type: Boolean,
      default: false
    }
  },

  // Achievement Settings
  achievements: {
    autoVerify: {
      type: Boolean,
      default: false
    },
    verificationRequired: {
      type: Boolean,
      default: true
    },
    maxPointsPerDay: {
      type: Number,
      default: 50
    },
    pointValues: {
      college: { type: Number, default: 10 },
      university: { type: Number, default: 25 },
      state: { type: Number, default: 50 },
      national: { type: Number, default: 100 },
      international: { type: Number, default: 200 }
    }
  },

  // Event Settings
  events: {
    autoPublish: {
      type: Boolean,
      default: false
    },
    requireApproval: {
      type: Boolean,
      default: true
    },
    maxEventsPerDay: {
      type: Number,
      default: 3
    },
    reminderTime: {
      type: Number,
      default: 24 // hours before event
    }
  },

  // User Settings
  users: {
    allowRegistration: {
      type: Boolean,
      default: true
    },
    requireEmailVerification: {
      type: Boolean,
      default: true
    },
    requireAdminApproval: {
      type: Boolean,
      default: false
    },
    maxLoginAttempts: {
      type: Number,
      default: 5
    },
    lockoutDuration: {
      type: Number,
      default: 30 // minutes
    }
  },

  // Email Settings
  email: {
    host: String,
    port: Number,
    secure: {
      type: Boolean,
      default: false
    },
    auth: {
      user: String,
      pass: String
    },
    fromEmail: {
      type: String,
      default: "noreply@ncc-system.com"
    },
    fromName: {
      type: String,
      default: "NCC Management System"
    }
  },

  // SMS Settings
  sms: {
    provider: String,
    apiKey: String,
    senderId: String,
    enabled: {
      type: Boolean,
      default: false
    }
  },

  // File Upload Settings
  uploads: {
    maxFileSize: {
      type: Number,
      default: 10 * 1024 * 1024 // 10MB
    },
    allowedTypes: [String],
    storagePath: {
      type: String,
      default: "uploads"
    }
  },

  // Security Settings
  security: {
    requireStrongPassword: {
      type: Boolean,
      default: true
    },
    sessionTimeout: {
      type: Number,
      default: 24 // hours
    },
    enable2FA: {
      type: Boolean,
      default: false
    },
    allowedOrigins: [String]
  },

  // Theme Settings
  theme: {
    primaryColor: {
      type: String,
      default: "#2563eb"
    },
    secondaryColor: {
      type: String,
      default: "#7c3aed"
    },
    darkMode: {
      type: Boolean,
      default: false
    },
    fontFamily: {
      type: String,
      default: "Inter, sans-serif"
    }
  },

  // Maintenance Mode
  maintenanceMode: {
    enabled: {
      type: Boolean,
      default: false
    },
    message: {
      type: String,
      default: "System is under maintenance. Please check back later."
    },
    allowedIPs: [String]
  },

  // Analytics
  analytics: {
    googleAnalyticsId: String,
    enableTracking: {
      type: Boolean,
      default: true
    }
  },

  // Backup Settings
  backup: {
    autoBackup: {
      type: Boolean,
      default: false
    },
    backupFrequency: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      default: "weekly"
    },
    backupTime: {
      type: String,
      default: "02:00"
    },
    keepBackups: {
      type: Number,
      default: 30 // days
    }
  },

  // Metadata
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  lastUpdatedAt: {
    type: Date,
    default: Date.now
  },

  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

// Method to update settings
settingsSchema.methods.updateSettings = async function(updates, updatedBy = null) {
  Object.keys(updates).forEach(key => {
    if (key in this) {
      this[key] = updates[key];
    }
  });

  if (updatedBy) {
    this.lastUpdatedBy = updatedBy;
  }
  
  this.lastUpdatedAt = new Date();
  this.version += 1;
  
  return await this.save();
};

// Method to get specific setting
settingsSchema.methods.get = function(path, defaultValue = null) {
  const keys = path.split('.');
  let value = this;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return defaultValue;
    }
  }
  
  return value;
};

// Method to set specific setting
settingsSchema.methods.set = function(path, value) {
  const keys = path.split('.');
  let obj = this;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in obj) || typeof obj[key] !== 'object') {
      obj[key] = {};
    }
    obj = obj[key];
  }
  
  obj[keys[keys.length - 1]] = value;
  return this;
};

const Settings = mongoose.model("Settings", settingsSchema);

module.exports = Settings;