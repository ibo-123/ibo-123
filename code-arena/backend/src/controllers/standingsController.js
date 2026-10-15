const standingsService = require("../services/standingsService");
const Tournament = require("../models/Tournament");

const getGroupStandings = async (req, res) => {
  try {
    const { tournamentId, groupId } = req.params;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
    }

    const standings = await standingsService.calculateGroupStandings(tournamentId, groupId);

    return res.json({
      success: true,
      group: groupId,
      tournamentName: tournament.name,
      standings,
    });
  } catch (error) {
    console.error("getGroupStandings error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getTournamentStandings = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
    }

    const leaderboard = await standingsService.calculateTournamentLeaderboard(tournamentId);

    return res.json({
      success: true,
      tournament: {
        id: tournament._id,
        name: tournament.name,
        status: tournament.status,
        currentStage: tournament.currentStage,
      },
      count: leaderboard.length,
      leaderboard,
    });
  } catch (error) {
    console.error("getTournamentStandings error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getMyParticipantStatus = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const userId = req.user.userId || req.user._id;

    const Participant = require("../models/Participant");
    const participant = await Participant.findOne({
      tournamentId,
      user: userId,
    });

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "You are not registered for this tournament",
      });
    }

    const status = await standingsService.getParticipantStatus(tournamentId, participant._id);

    return res.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error("getMyParticipantStatus error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  getGroupStandings,
  getTournamentStandings,
  getMyParticipantStatus,
};