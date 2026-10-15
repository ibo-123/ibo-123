import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    submissionId: {
      type: Number,
      required: true,
      unique: true,
    },
    problemName: {
      type: String,
      required: true,
    },
    problemIndex: {
      type: String, // e.g., "A", "B1"
      required: true,
    },
    contestId: {
      type: Number,
      required: true,
    },
    rating: {
      type: Number,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    verdict: {
      type: String,
      required: true, // e.g., "OK", "WRONG_ANSWER", "TIME_LIMIT_EXCEEDED"
    },
    language: {
      type: String,
      required: true,
    },
    creationTimeSeconds: {
      type: Number,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique submissions per user (just in case)
submissionSchema.index({ userId: 1, submissionId: 1 }, { unique: true });

export default mongoose.model("Submission", submissionSchema);
