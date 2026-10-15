import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
   avater : {
      type : String,
      default : ""
   },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
   phoneNumber :{
      type : String,
      default : ""
   },
   location:{
    type : String,
    default :""
   } ,
    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    verificationOtp: {
      type: String,
      default: null,
    },

    verificationOtpExpires: {
      type: Date,
      default: null,
    },

    // Codeforces
    codeforcesHandle: {
      type: String,
      default: null,
      trim: true,
    },

    codeforcesRating: {
      type: Number,
      default: null,
    },

    codeforcesMaxRating: {
      type: Number,
      default: null,
    },

    codeforcesRank: {
      type: String,
      default: null,
    },

    codeforcesMaxRank: {
      type: String,
      default: null,
    },

    codeforcesContribution: {
      type: Number,
      default: null,
    },

    codeforcesAvatar: {
      type: String,
      default: null,
    },

    // Streak tracking
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    lastActiveDate: {
      type: Date,
      default: null,
    },

    // Cached statistics
    totalSolved: {
      type: Number,
      default: 0,
    },
    easySolved: {
      type: Number,
      default: 0,
    },
    mediumSolved: {
      type: Number,
      default: 0,
    },
    hardSolved: {
      type: Number,
      default: 0,
    },
    lastSyncedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);