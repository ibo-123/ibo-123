import mongoose from "mongoose";

const achievementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    badgeId: {
      type: String, // e.g., 'first_solve', 'specialist', '100_problems'
      required: true,
    },
    unlockedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate achievements per user
achievementSchema.index({ userId: 1, badgeId: 1 }, { unique: true });

export default mongoose.model("Achievement", achievementSchema);
