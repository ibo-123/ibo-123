const Participant = require("../models/Participant");
const Match = require("../models/Match");
const Tournament = require("../models/Tournament");

const getBracket = async (tournamentId) => {
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) throw new Error("Tournament not found");

  const [participants, matches] = await Promise.all([
    Participant.find({ tournamentId })
      .populate("user", "name username codeforcesUsername")
      .sort({ seed: 1 }),
    Match.find({ tournament: tournamentId })
      .populate({
        path: "participants",
        populate: { path: "user", select: "name username codeforcesUsername" }
      })
      .populate("contest", "name status codeforcesUrl")
      .populate({ path: "winner", populate: { path: "user", select: "name username" } })
      .sort({ stage: 1, matchNumber: 1 })
  ]);

  // Build groupStage object dynamically
  const groupStage = {};
  participants.forEach(p => {
    if (p.group) {
      if (!groupStage[p.group]) groupStage[p.group] = [];
      groupStage[p.group].push(p);
    }
  });

  const bracket = {
    groupStage,
    quarterFinal: [],
    semiFinal: [],
    final: null,
    champion: participants.find(p => p.status === "CHAMPION") || null,
  };

  matches.forEach(match => {
    const item = {
      matchNumber: match.matchNumber,
      participants: match.participants,
      contest: match.contest,
      winner: match.winner,
      status: match.status || "PENDING"
    };
    if (match.stage === "QUARTER_FINAL") bracket.quarterFinal.push(item);
    else if (match.stage === "SEMI_FINAL") bracket.semiFinal.push(item);
    else if (match.stage === "FINAL") bracket.final = item;
  });

  return bracket;
};

module.exports = { getBracket };
