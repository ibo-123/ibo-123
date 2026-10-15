const mongoose = require('mongoose');

const ProblemResultSchema = new mongoose.Schema({
  problemIndex: { type: String, required: true },
  problemName: { type: String, required: true },
  points: { type: Number, default: 0 },
  solved: { type: Boolean, default: false },
  wrongAttempts: { type: Number, default: 0 },
  bestSubmissionTime: { type: Number },
});

const ResultSchema = new mongoose.Schema(
  {
    contestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contest',
      required: true,
    },
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
    },
    participantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Participant',
      required: true,
    },
    codeforcesHandle: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    rank: {
      type: Number,
      required: true,
    },
    points: {
      type: Number,
      default: 0,
    },
    penalty: {
      type: Number,
      default: 0,
    },
    solvedCount: {
      type: Number,
      default: 0,
    },
    problemResults: [ProblemResultSchema],
    syncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

ResultSchema.index({ contestId: 1, participantId: 1 }, { unique: true });
ResultSchema.index({ tournamentId: 1, contestId: 1, rank: 1 });

module.exports = mongoose.model('Result', ResultSchema);
