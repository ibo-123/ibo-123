const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: "Tournament" },
    stage: {
      type: String,
      enum: ["QUARTER_FINAL", "SEMI_FINAL", "FINAL"],
      required: true,
    },
    matchNumber: { type: Number, required: true },
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Participant", required: true },
    ],
    contest: { type: mongoose.Schema.Types.ObjectId, ref: "Contest", default: null },
    contestId: { type: mongoose.Schema.Types.ObjectId, ref: "Contest" },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: "Participant", default: null },
    status: {
      type: String,
      enum: ["PENDING", "LIVE", "COMPLETED", "TIE"],
      default: "PENDING",
    },
    // ---- Rematch tracking ----
    // When a match ends in a tie, we create a new contest and reset this
    // match's winner/status. `rematchOf` links the new match back to the old one.
    rematchOf: { type: mongoose.Schema.Types.ObjectId, ref: "Match", default: null },
    // Round number of the rematch chain (0 = original, 1 = first rematch, ...)
    rematchRound: { type: Number, default: 0 },
    // Reference to contests used in previous attempts of this match
    previousContests: [{ type: mongoose.Schema.Types.ObjectId, ref: "Contest" }],
  },
  { timestamps: true }
);

matchSchema.index({ tournament: 1, stage: 1, matchNumber: 1 }, { unique: true });

matchSchema.pre("save", function () {
  if (this.tournament) this.tournamentId = this.tournament;
  if (this.contest) this.contestId = this.contest;
});

module.exports = mongoose.model("Match", matchSchema);