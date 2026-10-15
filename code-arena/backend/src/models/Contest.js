const mongoose = require("mongoose");

const ContestSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },

    // ============================================================
    // V1 FIELDS (manual invitation management — no Codeforces API)
    // ============================================================
    name: {
      type: String,
      trim: true,
      required: false,
    },
    invitationUrl: {
      type: String,
      trim: true,
      required: false,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },

    // ============================================================
    // LEGACY / SHARED FIELDS
    // ============================================================
    codeforcesContestId: {
      type: Number,
      required: false,
    },
    codeforcesContestName: {
      type: String,
      required: false,
    },
    codeforcesUrl: {
      type: String,
      required: false,
    },
    type: {
      type: String,
      required: false,
    },
    phase: {
      type: String,
      required: false,
    },

    // ============================================================
    // SCHEDULE
    // ============================================================
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: false,
    },
    durationSeconds: {
      type: Number,
      required: false,
    },

    // ============================================================
    // ASSIGNMENT
    // ============================================================
    stage: {
      type: String,
      enum: ["QUALIFICATION", "GROUP_STAGE", "QUARTER_FINAL", "SEMI_FINAL", "FINAL"],
      required: true,
    },
    group: {
      type: String,
      trim: true,
    },
    // Legacy single-match number (kept for backwards compatibility).
    // For knockout rounds we now use `matchNumbers` (array below).
    matchNumber: {
      type: Number,
    },
    // NEW — one contest per knockout round.
    // Example: QF → [1, 2, 3, 4] (all quarter-final matches in this contest).
    matchNumbers: {
      type: [Number],
      default: [],
    },

    // ============================================================
    // STATUS
    // ============================================================
    status: {
      type: String,
      enum: ["DRAFT", "UPCOMING", "PUBLISHED", "LIVE", "FINISHED", "CANCELLED"],
      default: "DRAFT",
    },
    published: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
    },

    // ============================================================
    // SYNC METADATA (legacy — not used by V1)
    // ============================================================
    lastSyncedAt: {
      type: Date,
    },
    syncedCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ------------------------------------------------------------
// INDEXES
// ------------------------------------------------------------
// Uniqueness on (tournamentId, codeforcesContestId) applies ONLY
// when codeforcesContestId is a real number. V1 manual contests
// don't have this field, so they're excluded from the constraint.
ContestSchema.index(
  { tournamentId: 1, codeforcesContestId: 1 },
  {
    unique: true,
    partialFilterExpression: { codeforcesContestId: { $type: "number" } },
  }
);

ContestSchema.index({ tournamentId: 1, stage: 1 });
ContestSchema.index({ tournamentId: 1, published: 1 });
ContestSchema.index({ tournamentId: 1, group: 1, status: 1 });

// Helpful for looking up which contest owns a given knockout match.
ContestSchema.index({ tournamentId: 1, stage: 1, matchNumbers: 1 });

module.exports = mongoose.model("Contest", ContestSchema);