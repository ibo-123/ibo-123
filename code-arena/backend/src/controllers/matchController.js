const Match = require("../models/Match");
const Participant = require("../models/Participant");
const AuditLog = require("../models/AuditLog");

const getMatches = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { stage } = req.query;

    const filter = { tournament: tournamentId };
    if (stage) {
      filter.stage = stage;
    }

    const matches = await Match.find(filter)
      .populate({
        path: 'participants',
        select: 'user group seed status',
        populate: { path: 'user', select: 'name username codeforcesUsername' },
      })
      .populate({
        path: 'winner',
        select: 'user group seed',
        populate: { path: 'user', select: 'name username' },
      })
      .populate('contest', 'codeforcesContestName codeforcesUrl startTime durationSeconds')
      .sort({ stage: 1, matchNumber: 1 });

    return res.json({
      success: true,
      count: matches.length,
      matches,
    });
  } catch (error) {
    console.error("getMatches error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Determine the next match for a given match's winner.
 * Bracket layout (single elimination):
 *   QF1, QF2, QF3, QF4 → SF1 (QF1+QF2), SF2 (QF3+QF4) → FINAL (SF1+SF2)
 *
 * For N quarter-finals = 2 * number of semis
 * SF matchNumber = floor((QF matchNumber - 1) / 2) + 1
 * FINAL matchNumber = 1
 */
const getNextMatchTarget = (match) => {
  if (match.stage === "QUARTER_FINAL") {
    return {
      stage: "SEMI_FINAL",
      matchNumber: Math.floor((match.matchNumber - 1) / 2) + 1,
    };
  }
  if (match.stage === "SEMI_FINAL") {
    return {
      stage: "FINAL",
      matchNumber: 1,
    };
  }
  return null; // FINAL has no next match
};

const updateMatchResult = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { winnerId } = req.body;

    if (!winnerId) {
      return res.status(400).json({ success: false, message: "winnerId is required" });
    }

    const match = await Match.findById(matchId).populate('participants');
    if (!match) {
      return res.status(404).json({ success: false, message: "Match not found" });
    }

    if (match.status === "COMPLETED" && match.winner) {
      return res.status(409).json({
        success: false,
        message: "Match already completed. Winner cannot be changed.",
      });
    }

    if (!match.participants.some(p => p._id.toString() === String(winnerId))) {
      return res.status(400).json({
        success: false,
        message: "Winner must be one of the participants",
      });
    }

    match.winner = winnerId;
    match.status = "COMPLETED";
    await match.save();

    // Update participants status
    await Promise.all(match.participants.map(async (p) => {
      const isWinner = p._id.toString() === String(winnerId);
      await Participant.findByIdAndUpdate(p._id, {
        status: isWinner ? "ADVANCED" : "ELIMINATED",
        currentStage: isWinner ? match.stage : "ELIMINATED",
      });
    }));

    // Advance winner to next match
    const target = getNextMatchTarget(match);
    let nextMatch = null;

    if (target) {
      nextMatch = await Match.findOne({
        tournament: match.tournament,
        stage: target.stage,
        matchNumber: target.matchNumber,
      });

      if (nextMatch) {
        if (!nextMatch.participants.some(p => p.toString() === String(winnerId))) {
          nextMatch.participants.push(winnerId);
          await nextMatch.save();
        }
      } else {
        // Next match doesn't exist yet — create it with the winner slotted in
        nextMatch = await Match.create({
          tournament: match.tournament,
          tournamentId: match.tournament,
          stage: target.stage,
          matchNumber: target.matchNumber,
          participants: [winnerId],
          status: "PENDING",
        });
      }
    } else {
      // This was the FINAL — champion
      await Participant.findByIdAndUpdate(winnerId, {
        status: "CHAMPION",
        currentStage: "COMPLETED",
      });
      // Mark tournament completed
      const Tournament = require("../models/Tournament");
      await Tournament.findByIdAndUpdate(match.tournament, {
        status: "COMPLETED",
        currentStage: "FINAL",
      });
    }

    await AuditLog.create({
      action: "MATCH_RESULT_SET",
      description: `Set winner for Match ${match.matchNumber} (${match.stage})`,
      admin: req.user?.userId || req.user?._id,
      tournament: match.tournament,
      details: {
        matchId: match._id,
        winnerId,
        nextStage: target?.stage || "CHAMPION",
        nextMatchNumber: target?.matchNumber || null,
      },
    });

    return res.json({ success: true, match, nextMatch });
  } catch (error) {
    console.error("updateMatchResult error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getMatches, updateMatchResult };