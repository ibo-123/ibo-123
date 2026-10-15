const mongoose = require("mongoose");

const ParticipantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },
    registrationStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    group: { type: String, trim: true },
    seed: { type: Number },
    rank: { type: Number },
    score: { type: Number, default: 0 },
    solved: { type: Number, default: 0 },
    penalty: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["ACTIVE", "ELIMINATED", "ADVANCED", "CHAMPION"],
      default: "ACTIVE",
    },
    currentStage: {
      type: String,
      enum: [
        "REGISTRATION",
        "GROUP_STAGE",
        "QUARTER_FINAL",
        "SEMI_FINAL",
        "FINAL",
        "COMPLETED",
      ],
      default: "REGISTRATION",
    },
    // Tracks which contests the participant has confirmed joining.
    // Key = contestId (string), Value = Date when confirmed.
    seenContests: {
      type: Map,
      of: Date,
      default: {},
    },
  },
  { timestamps: true }
);

ParticipantSchema.index({ tournamentId: 1, user: 1 }, { unique: true });
ParticipantSchema.index({ tournamentId: 1, group: 1 });
ParticipantSchema.index({ tournamentId: 1, registrationStatus: 1 });

module.exports = mongoose.model("Participant", ParticipantSchema);