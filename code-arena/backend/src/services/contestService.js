const Result = require("../models/Result");
const Participant = require("../models/Participant");
const codeforcesService = require("./codeforcesService");

const updateContestStatus = async (contest) => {
  const now = new Date();
  const durationMins = contest.durationMinutes || (contest.durationSeconds ? contest.durationSeconds / 60 : 120);
  const endTime = new Date(new Date(contest.startTime).getTime() + durationMins * 60000);
  contest.status = now < new Date(contest.startTime) ? "PUBLISHED" : now < endTime ? "LIVE" : "FINISHED";
  if (contest.status === "FINISHED" && !contest.finishedAt) contest.finishedAt = endTime;
  await contest.save();
  return contest;
};

const getParticipants = async (contest) => {
  const Match = require("../models/Match");

  // Prefer finding a Match that references this contest (Match.contest -> Contest._id)
  if (contest && contest._id) {
    const match = await Match.findOne({ contest: contest._id }).populate({ path: "participants", populate: { path: "user", select: "name username codeforcesUsername" } });
    if (match) return match.participants;
  }

  // Legacy / alternative: if contest.match contains a match id
  if (contest && contest.match) {
    const match = await Match.findById(contest.match).populate({ path: "participants", populate: { path: "user", select: "name username codeforcesUsername" } });
    if (match) return match.participants;
  }

  // Fallback: find by tournament and optional group or matchNumber
  if (contest && contest.matchNumber !== undefined && contest.matchNumber !== null) {
    const match = await Match.findOne({ tournament: contest.tournamentId, matchNumber: contest.matchNumber }).populate({ path: "participants", populate: { path: "user", select: "name username codeforcesUsername" } });
    if (match) return match.participants;
  }

  const query = { tournamentId: contest.tournamentId };
  if (contest.group) query.group = contest.group;
  return Participant.find(query).populate("user", "name username codeforcesUsername");
};

const handleOf = (row) => row.party && row.party.members && row.party.members[0] && row.party.members[0].handle;

const matchingRows = (data, participants) => {
  const handles = new Map(
    participants
      .filter((p) => p.user && p.user.codeforcesUsername)
      .map((participant) => [participant.user.codeforcesUsername.toLowerCase(), participant])
  );
  return (data.rows || []).map((row) => ({
    row,
    handle: handleOf(row),
    participant: handles.get((handleOf(row) || "").toLowerCase())
  })).filter((entry) => entry.participant);
};

const leaderboard = async (contest) => {
  await updateContestStatus(contest);
  const [data, participants] = await Promise.all([
    codeforcesService.getContestStandings(contest.codeforcesContestId),
    getParticipants(contest)
  ]);
  
  return matchingRows(data, participants).map(({ row, participant }) => ({
    rank: row.rank,
    participantId: participant._id,
    name: participant.user.name,
    username: participant.user.username,
    codeforcesUsername: participant.user.codeforcesUsername,
    solved: (row.problemResults || []).filter((item) => item.points > 0).length,
    score: row.points || 0,
    penalty: row.penalty || 0,
    problemResults: (row.problemResults || []).map((item, index) => ({
      problemIndex: (data.problems && data.problems[index] && data.problems[index].index) || String.fromCharCode(65 + index),
      status: item.points > 0 ? "SOLVED" : item.rejectedAttemptCount ? "FAILED" : "UNATTEMPTED",
      points: item.points || 0,
    })),
  }));
};

const syncResults = async (contest) => {
  await updateContestStatus(contest);
  const [data, participants] = await Promise.all([
    codeforcesService.getContestStandings(contest.codeforcesContestId),
    getParticipants(contest)
  ]);
  const rows = matchingRows(data, participants);
  const results = await Promise.all(rows.map(({ row, handle, participant }) => {
    const problemResults = (row.problemResults || []).map((item, index) => ({
      problemIndex: (data.problems && data.problems[index] && data.problems[index].index) || String.fromCharCode(65 + index),
      problemName: (data.problems && data.problems[index] && data.problems[index].name) || `Problem ${String.fromCharCode(65 + index)}`,
      points: item.points || 0,
      solved: item.points > 0,
      wrongAttempts: item.rejectedAttemptCount || 0,
      bestSubmissionTime: item.bestSubmissionTimeSeconds || undefined,
    }));
    return Result.findOneAndUpdate(
      { contestId: contest._id, participantId: participant._id },
      {
        contestId: contest._id,
        tournamentId: contest.tournamentId,
        participantId: participant._id,
        codeforcesHandle: handle,
        rank: row.rank || 0,
        points: row.points || 0,
        penalty: row.penalty || 0,
        solvedCount: problemResults.filter((item) => item.solved).length,
        problemResults,
        syncedAt: new Date(),
      },
      { upsert: true, new: true }
    );
  }));
  contest.lastSyncedAt = new Date();
  await contest.save();
  const registered = new Set(
    participants
      .filter((p) => p.user && p.user.codeforcesUsername)
      .map((participant) => participant.user.codeforcesUsername.toLowerCase())
  );
  const unmatchedHandles = (data.rows || []).map(handleOf).filter(Boolean).filter((handle) => !registered.has(handle.toLowerCase()));
  return { results, unmatchedHandles };
};

module.exports = { updateContestStatus, leaderboard, syncResults };
