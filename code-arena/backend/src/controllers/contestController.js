// src/controllers/contestController.js

const mongoose = require('mongoose');
const Contest = require('../models/Contest');
const Tournament = require('../models/Tournament');
const Participant = require('../models/Participant');
const Result = require('../models/Result');
const AuditLog = require('../models/AuditLog');
const Match = require('../models/Match');
const VideoSubmission = require('../models/VideoSubmission');
const Invitation = require('../models/Invitation');

const codeforcesService = require('../services/codeforcesService');

// ============================================================
// SHARED HELPERS
// ============================================================

const getAuthUserId = (req) => req.user?.userId || req.user?.id || req.user?._id || null;

const VALID_STAGES = ['QUALIFICATION', 'GROUP_STAGE', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL'];

const KNOCKOUT_STAGES = ['QUARTER_FINAL', 'SEMI_FINAL', 'FINAL'];

const isValidInvitationUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return false;
  try {
    const parsed = new URL(trimmed);
    return /(^|\.)codeforces\.com$/i.test(parsed.hostname);
  } catch {
    return false;
  }
};

const normalizeGroup = (group) => {
  if (group === undefined || group === null || group === '') return undefined;
  const raw = String(group).trim().toUpperCase();
  if (/^\d+$/.test(raw)) return raw;           // "1", "2", ...
  if (/^[A-Z]$/.test(raw)) return raw;          // "A", "B", ...
  const match = raw.match(/^GROUP\s+([A-Z0-9]+)$/);
  return match ? match[1] : raw;
};

// Normalize matchNumbers from request body (accepts array or single number).
const normalizeMatchNumbers = (matchNumbers, matchNumber) => {
  if (Array.isArray(matchNumbers) && matchNumbers.length > 0) {
    return matchNumbers
      .map((n) => Number(n))
      .filter((n) => Number.isInteger(n) && n > 0);
  }
  if (matchNumber !== undefined && matchNumber !== null && matchNumber !== '') {
    const n = Number(matchNumber);
    if (Number.isInteger(n) && n > 0) return [n];
  }
  return [];
};

// ============================================================
// VALIDATE CODEFORCES CONTEST (LEGACY — used by non-V1 flows)
// ============================================================

exports.validateCodeforcesContest = async (req, res) => {
  try {
    const { contestId } = req.params;

    if (!contestId) {
      return res.status(400).json({
        success: false,
        message: 'Contest ID is required',
      });
    }

    const id = Number(contestId);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contest ID',
      });
    }

    const result = await codeforcesService.validateContest(id);

    if (!result.valid) {
      return res.status(404).json({
        success: false,
        message: result.error || 'Contest not found or not accessible',
      });
    }

    const contest = result.contest;

    return res.json({
      success: true,
      contest: {
        id: contest.id,
        name: contest.name,
        type: contest.type,
        phase: contest.phase,
        startTime: contest.startTimeSeconds
          ? new Date(contest.startTimeSeconds * 1000)
          : null,
        durationSeconds: contest.durationSeconds || 0,
        url: codeforcesService.formatContestUrl(contest.id),
      },
    });
  } catch (error) {
    console.error('[validateCodeforcesContest] ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to validate contest',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ============================================================
// PUBLISH CONTEST (LEGACY — Codeforces API-based)
// Kept for backward compatibility. V1 uses publishContestV1.
// ============================================================

exports.publishContest = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const {
      codeforcesContestId,
      stage,
      group,
      matchNumber,
    } = req.body;

    if (!tournamentId || !mongoose.Types.ObjectId.isValid(tournamentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tournament ID',
      });
    }

    if (!codeforcesContestId || !stage) {
      return res.status(400).json({
        success: false,
        message: 'Codeforces contest ID and stage are required',
      });
    }

    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found',
      });
    }

    const validation = await codeforcesService.validateContest(codeforcesContestId);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error || 'Invalid Codeforces contest',
      });
    }

    const existing = await Contest.findOne({
      tournamentId,
      codeforcesContestId,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Contest already published to this tournament',
      });
    }

    const contest = new Contest({
      tournamentId,
      name: validation.contest.name,
      invitationUrl: codeforcesService.formatContestUrl(validation.contest.id),
      codeforcesContestId: validation.contest.id,
      codeforcesContestName: validation.contest.name,
      codeforcesUrl: codeforcesService.formatContestUrl(validation.contest.id),
      type: validation.contest.type,
      phase: validation.contest.phase,
      startTime: new Date(validation.contest.startTimeSeconds * 1000),
      endTime: new Date(
        (validation.contest.startTimeSeconds + (validation.contest.durationSeconds || 0)) * 1000
      ),
      durationSeconds: validation.contest.durationSeconds,
      stage,
      group: stage === 'GROUP_STAGE' ? group : undefined,
      matchNumber: stage !== 'GROUP_STAGE' ? matchNumber : undefined,
      status: 'PUBLISHED',
      published: true,
      publishedAt: new Date(),
    });

    await contest.save();

    // Attach knockout contest to Match
    if (stage !== 'GROUP_STAGE' && matchNumber !== undefined && matchNumber !== null) {
      try {
        const found = await Match.findOne({
          tournament: tournamentId,
          matchNumber,
        });

        if (found) {
          found.contest = contest._id;
          await found.save();
        }
      } catch (error) {
        console.error('[publishContest] Failed to attach match:', error);
      }
    }

    await AuditLog.create({
      action: 'CONTEST_PUBLISHED',
      description: `Published contest ${validation.contest.name} (${validation.contest.id})`,
      admin: getAuthUserId(req),
      tournament: tournamentId,
      details: {
        contestId: validation.contest.id,
        stage,
        group,
        matchNumber,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Contest published successfully',
      contest,
    });
  } catch (error) {
    console.error('[publishContest] ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to publish contest',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ============================================================
// GET CONTESTS (public / legacy)
// ============================================================

exports.getContests = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    if (!tournamentId || !mongoose.Types.ObjectId.isValid(tournamentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tournament ID',
      });
    }

    const contests = await Contest.find({ tournamentId })
      .sort({ startTime: 1 })
      .lean();

    const now = new Date();
    const updatedContests = contests.map((contest) => {
      const start = contest.startTime ? new Date(contest.startTime) : null;
      const end = contest.endTime
        ? new Date(contest.endTime)
        : start && contest.durationSeconds
          ? new Date(start.getTime() + contest.durationSeconds * 1000)
          : null;

      let status = contest.status;
      if (start && now < start) {
        status = 'UPCOMING';
      } else if (start && end && now >= start && now < end) {
        status = 'LIVE';
      } else if (end && now >= end) {
        status = 'FINISHED';
      }

      return {
        ...contest,
        status,
        isUpcoming: status === 'UPCOMING',
        isLive: status === 'LIVE',
        isFinished: status === 'FINISHED',
        startTime: start,
        endTime: end,
        timeRemaining: status === 'LIVE' && end ? Math.max(0, end - now) : null,
      };
    });

    return res.json({
      success: true,
      contests: updatedContests,
    });
  } catch (error) {
    console.error('[getContests] ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to get contests',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ============================================================
// GET SINGLE CONTEST
// ============================================================

exports.getContest = async (req, res) => {
  try {
    const { tournamentId, contestId } = req.params;

    if (!tournamentId || !mongoose.Types.ObjectId.isValid(tournamentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tournament ID',
      });
    }

    if (!contestId || !mongoose.Types.ObjectId.isValid(contestId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contest ID',
      });
    }

    const contest = await Contest.findOne({
      _id: contestId,
      tournamentId,
    }).lean();

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found',
      });
    }

    const now = new Date();
    const start = contest.startTime ? new Date(contest.startTime) : null;
    const end = contest.endTime
      ? new Date(contest.endTime)
      : start && contest.durationSeconds
        ? new Date(start.getTime() + contest.durationSeconds * 1000)
        : null;

    let status = contest.status;
    if (start && now < start) {
      status = 'UPCOMING';
    } else if (start && end && now >= start && now < end) {
      status = 'LIVE';
    } else if (end && now >= end) {
      status = 'FINISHED';
    }

    let userSubmission = null;
    if (req.user) {
      const userId = req.user.userId || req.user._id;
      const participant = await Participant.findOne({
        tournamentId,
        user: userId,
      });

      if (participant) {
        userSubmission = await VideoSubmission.findOne({
          contestId,
          participantId: participant._id,
        });
      }
    }

    return res.json({
      success: true,
      contest: {
        ...contest,
        status,
        isUpcoming: status === 'UPCOMING',
        isLive: status === 'LIVE',
        isFinished: status === 'FINISHED',
        startTime: start,
        endTime: end,
        timeRemaining: status === 'LIVE' && end ? Math.max(0, end - now) : null,
        userSubmission: userSubmission || null,
      },
    });
  } catch (error) {
    console.error('[getContest] ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to get contest',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ============================================================
// GET RESULTS (legacy — reads from Result collection)
// ============================================================

exports.getResults = async (req, res) => {
  try {
    const { tournamentId, contestId } = req.params;

    if (!tournamentId || !mongoose.Types.ObjectId.isValid(tournamentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tournament ID',
      });
    }

    if (!contestId || !mongoose.Types.ObjectId.isValid(contestId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contest ID',
      });
    }

    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found',
      });
    }

    const now = new Date();
    const endTime = contest.endTime
      ? new Date(contest.endTime)
      : contest.startTime && contest.durationSeconds
        ? new Date(new Date(contest.startTime).getTime() + contest.durationSeconds * 1000)
        : null;
    const isFinished = endTime ? now >= endTime : false;

    const results = await Result.find({
      contestId,
      tournamentId,
    })
      .populate({
        path: 'participantId',
        select: 'group seed user',
        populate: {
          path: 'user',
          select: 'name username codeforcesUsername',
        },
      })
      .sort({ rank: 1 })
      .lean();

    const resultsWithVideoStatus = await Promise.all(
      results.map(async (r) => {
        const videoSubmission = await VideoSubmission.findOne({
          contestId,
          participantId: r.participantId?._id,
        });

        return {
          ...r,
          participant: r.participantId,
          score: r.points,
          solved: r.solvedCount,
          videoStatus: videoSubmission?.status || 'NOT_SUBMITTED',
          isEligible: videoSubmission?.status === 'APPROVED',
          isCounted: isFinished && videoSubmission?.status === 'APPROVED',
        };
      })
    );

    return res.json({
      success: true,
      count: resultsWithVideoStatus.length,
      contestStatus: isFinished ? 'FINISHED' : 'ONGOING',
      results: resultsWithVideoStatus,
    });
  } catch (error) {
    console.error('[getResults] ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to get results',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ============================================================
// SYNC RESULTS (legacy — Codeforces API-based)
// ============================================================

exports.syncResults = async (req, res) => {
  try {
    const { tournamentId, contestId } = req.params;

    console.log('[syncResults] Starting sync', { tournamentId, contestId });

    if (!tournamentId || !mongoose.Types.ObjectId.isValid(tournamentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tournament ID',
      });
    }

    if (!contestId || !mongoose.Types.ObjectId.isValid(contestId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contest ID',
      });
    }

    const contest = await Contest.findOne({
      _id: contestId,
      tournamentId,
    });

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found',
      });
    }

    if (!contest.codeforcesContestId) {
      return res.status(400).json({
        success: false,
        message: 'This contest does not have a Codeforces contest ID',
      });
    }

    const allParticipants = await Participant.find({
      tournamentId,
      registrationStatus: 'APPROVED',
    }).populate('user');

    const participants = allParticipants.filter(
      (participant) =>
        participant.user &&
        typeof participant.user.codeforcesUsername === 'string' &&
        participant.user.codeforcesUsername.trim() !== ''
    );

    if (participants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No participants with Codeforces handles found',
      });
    }

    const handles = participants
      .map((participant) => participant.user.codeforcesUsername.trim())
      .filter(Boolean);

    let standings;

    try {
      standings = await codeforcesService.getContestStandings(
        Number(contest.codeforcesContestId),
        handles
      );
    } catch (error) {
      console.error('[syncResults] Codeforces standings ERROR:', error);

      return res.status(502).json({
        success: false,
        message: 'Failed to fetch standings from Codeforces',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }

    if (!standings || !Array.isArray(standings.rows)) {
      return res.status(502).json({
        success: false,
        message: 'Invalid standings response from Codeforces',
      });
    }

    const handleMap = new Map();
    participants.forEach((participant) => {
      const handle = participant.user?.codeforcesUsername;
      if (handle) {
        handleMap.set(handle.trim().toUpperCase(), participant);
      }
    });

    let matched = 0;
    let unmatched = 0;
    let updated = 0;

    const syncedResultsList = [];
    const unmatchedHandlesList = [];

    for (const row of standings.rows) {
      const member = row.party?.members?.[0];
      if (!member || !member.handle) continue;

      const handle = member.handle.trim().toUpperCase();
      const participant = handleMap.get(handle);

      if (!participant) {
        unmatched++;
        unmatchedHandlesList.push(member.handle);
        continue;
      }

      matched++;

      const problemResults = Array.isArray(row.problemResults)
        ? row.problemResults.map((problemResult, index) => {
          const problem = standings.problems?.[index];
          const problemIndex = problem?.index || String.fromCharCode(65 + index);
          const problemName = problem?.name || `Problem ${String.fromCharCode(65 + index)}`;

          return {
            problemIndex,
            problemName,
            points: problemResult.points || 0,
            solved: problemResult.points > 0,
            wrongAttempts: problemResult.rejectedAttemptCount || 0,
            bestSubmissionTime: problemResult.bestSubmissionTimeSeconds || undefined,
          };
        })
        : [];

      const solvedCount = problemResults.filter((problem) => problem.solved).length;

      let totalPenalty = 0;
      for (const pr of problemResults) {
        if (pr.solved && pr.bestSubmissionTime) {
          totalPenalty += pr.bestSubmissionTime;
          totalPenalty += (pr.wrongAttempts || 0) * 20;
        }
      }

      const result = await Result.findOneAndUpdate(
        {
          contestId,
          participantId: participant._id,
        },
        {
          contestId,
          tournamentId,
          participantId: participant._id,
          codeforcesHandle: member.handle,
          rank: row.rank || 0,
          points: row.points || 0,
          penalty: totalPenalty,
          solvedCount,
          problemResults,
          syncedAt: new Date(),
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      if (result) {
        updated++;
        syncedResultsList.push(result);
      }
    }

    contest.lastSyncedAt = new Date();
    contest.syncedCount = Number(contest.syncedCount || 0) + 1;
    await contest.save();

    try {
      await AuditLog.create({
        action: 'RESULTS_SYNCED',
        description: `Synced results for contest ${contest.codeforcesContestName || contest.name}`,
        admin: getAuthUserId(req),
        tournament: tournamentId,
        details: { matched, unmatched, updated },
      });
    } catch (auditError) {
      console.error('[syncResults] Audit log ERROR:', auditError);
    }

    return res.json({
      success: true,
      message: 'Results synchronized successfully',
      stats: {
        total: participants.length,
        matched,
        unmatched,
        updated,
      },
      results: syncedResultsList,
      unmatchedHandles: unmatchedHandlesList,
    });
  } catch (error) {
    console.error('[syncResults] UNHANDLED ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to sync results',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ============================================================
// GET LEADERBOARD (legacy)
// ============================================================

exports.getLeaderboard = async (req, res) => {
  try {
    const { tournamentId, contestId } = req.params;

    if (!tournamentId || !mongoose.Types.ObjectId.isValid(tournamentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tournament ID',
      });
    }

    if (!contestId || !mongoose.Types.ObjectId.isValid(contestId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contest ID',
      });
    }

    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found',
      });
    }

    const now = new Date();
    const endTime = contest.endTime
      ? new Date(contest.endTime)
      : contest.startTime && contest.durationSeconds
        ? new Date(new Date(contest.startTime).getTime() + contest.durationSeconds * 1000)
        : null;
    const isFinished = endTime ? now >= endTime : false;

    const results = await Result.find({
      contestId,
      tournamentId,
    })
      .populate({
        path: 'participantId',
        select: 'user group seed',
        populate: {
          path: 'user',
          select: 'name username codeforcesUsername',
        },
      })
      .sort({ rank: 1 })
      .lean();

    const leaderboard = await Promise.all(
      results.map(async (result, index) => {
        const videoSubmission = await VideoSubmission.findOne({
          contestId,
          participantId: result.participantId?._id,
        });

        const isEligible = videoSubmission?.status === 'APPROVED';

        return {
          rank: result.rank || index + 1,
          participantId: result.participantId?._id,
          username: result.participantId?.user?.username || 'Unknown',
          codeforcesUsername: result.codeforcesHandle,
          group: result.participantId?.group,
          solved: result.solvedCount,
          score: result.points,
          penalty: result.penalty,
          videoStatus: videoSubmission?.status || 'NOT_SUBMITTED',
          isEligible,
          isCounted: isFinished && isEligible,
        };
      })
    );

    return res.json({
      success: true,
      contestStatus: isFinished ? 'FINISHED' : 'ONGOING',
      leaderboard,
    });
  } catch (error) {
    console.error('[getLeaderboard] ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to get leaderboard',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ============================================================
// RECONCILE CONTESTS -> MATCHES (legacy)
// ============================================================

exports.reconcileContestsMatches = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    if (!tournamentId || !mongoose.Types.ObjectId.isValid(tournamentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tournament ID',
      });
    }

    const contests = await Contest.find({
      tournamentId,
      matchNumber: { $ne: null },
    });

    let attached = 0;

    for (const contest of contests) {
      const match = await Match.findOne({
        tournament: tournamentId,
        matchNumber: contest.matchNumber,
      });

      if (match && (!match.contest || !match.contest.equals(contest._id))) {
        match.contest = contest._id;
        await match.save();
        attached++;
      }
    }

    return res.json({
      success: true,
      message: 'Reconciled contests to matches',
      total: contests.length,
      attached,
    });
  } catch (error) {
    console.error('[reconcileContestsMatches] ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to reconcile contests',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ============================================================
// ADD PENALTY
// ============================================================

exports.addPenalty = async (req, res) => {
  try {
    const { contestId, participantId } = req.params;
    const { problemIndex, penalty, type = 'manual' } = req.body;

    if (!problemIndex || penalty === undefined || penalty === null) {
      return res.status(400).json({
        success: false,
        message: 'problemIndex and penalty are required',
      });
    }

    if (typeof penalty !== 'number' || penalty < 0) {
      return res.status(400).json({
        success: false,
        message: 'Penalty must be a non-negative number',
      });
    }

    const result = await Result.findOne({
      contestId,
      participantId,
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found for this participant in this contest',
      });
    }

    let problemResult = result.problemResults.find(
      (pr) => pr.problemIndex === problemIndex
    );

    if (!problemResult) {
      problemResult = {
        problemIndex,
        problemName: `Problem ${problemIndex}`,
        points: 0,
        solved: false,
        wrongAttempts: 0,
        bestSubmissionTime: undefined,
      };
      result.problemResults.push(problemResult);
    }

    if (type === 'set') {
      problemResult.wrongAttempts = penalty;
    } else {
      problemResult.wrongAttempts = (problemResult.wrongAttempts || 0) + penalty;
    }

    let totalPenalty = 0;
    for (const pr of result.problemResults) {
      if (pr.solved && pr.bestSubmissionTime) {
        totalPenalty += pr.bestSubmissionTime;
        totalPenalty += (pr.wrongAttempts || 0) * 20;
      }
    }
    result.penalty = totalPenalty;

    await result.save();

    await AuditLog.create({
      action: 'PENALTY_ADDED',
      description: `Added ${penalty} penalty to problem ${problemIndex} for participant ${participantId}`,
      admin: getAuthUserId(req),
      tournament: result.tournamentId,
      details: {
        contestId,
        participantId,
        problemIndex,
        penalty,
        type,
        newTotalPenalty: totalPenalty,
      },
    });

    return res.json({
      success: true,
      message: 'Penalty added successfully',
      result,
    });
  } catch (error) {
    console.error('[addPenalty] ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to add penalty',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ============================================================
// UPDATE CONTEST STATUS (helper)
// ============================================================

exports.updateContestStatus = async (req, res) => {
  try {
    const { contestId } = req.params;

    if (!contestId || !mongoose.Types.ObjectId.isValid(contestId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contest ID',
      });
    }

    const contest = await Contest.findById(contestId);

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found',
      });
    }

    const now = new Date();
    const start = contest.startTime ? new Date(contest.startTime) : null;
    const end = contest.endTime
      ? new Date(contest.endTime)
      : start && contest.durationSeconds
        ? new Date(start.getTime() + contest.durationSeconds * 1000)
        : null;

    let newStatus = contest.status;
    if (start && now < start) {
      newStatus = 'UPCOMING';
    } else if (start && end && now >= start && now < end) {
      newStatus = 'LIVE';
    } else if (end && now >= end) {
      newStatus = 'FINISHED';
    }

    if (newStatus !== contest.status) {
      contest.status = newStatus;
      await contest.save();
    }

    return res.json({
      success: true,
      contest: {
        ...contest.toObject(),
        status: newStatus,
        startTime: start,
        endTime: end,
        timeRemaining: newStatus === 'LIVE' && end ? Math.max(0, end - now) : null,
      },
    });
  } catch (error) {
    console.error('[updateContestStatus] ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update contest status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ============================================================
// BULK SYNC CONTESTS (legacy — Codeforces API-based)
// ============================================================

exports.bulkSyncContests = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    if (!tournamentId || !mongoose.Types.ObjectId.isValid(tournamentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tournament ID',
      });
    }

    const contests = await Contest.find({
      tournamentId,
      published: true,
    });

    const results = [];
    const errors = [];

    for (const contest of contests) {
      try {
        if (!contest.codeforcesContestId) {
          errors.push({
            contestId: contest._id,
            error: 'No Codeforces contest ID on this contest',
          });
          continue;
        }

        const now = new Date();
        const endTime = contest.endTime
          ? new Date(contest.endTime)
          : contest.startTime && contest.durationSeconds
            ? new Date(new Date(contest.startTime).getTime() + contest.durationSeconds * 1000)
            : null;

        if (endTime && now < endTime) {
          errors.push({
            contestId: contest._id,
            error: 'Contest has not ended yet',
          });
          continue;
        }

        const participants = await Participant.find({
          tournamentId,
          registrationStatus: 'APPROVED',
        }).populate('user');

        const handles = participants
          .filter((p) => p.user?.codeforcesUsername)
          .map((p) => p.user.codeforcesUsername.trim())
          .filter(Boolean);

        if (handles.length === 0) {
          errors.push({
            contestId: contest._id,
            error: 'No participants with Codeforces handles',
          });
          continue;
        }

        const standings = await codeforcesService.getContestStandings(
          Number(contest.codeforcesContestId),
          handles
        );

        if (!standings || !standings.rows) {
          errors.push({
            contestId: contest._id,
            error: 'Failed to fetch standings',
          });
          continue;
        }

        const handleMap = new Map();
        participants.forEach((p) => {
          const handle = p.user?.codeforcesUsername;
          if (handle) {
            handleMap.set(handle.trim().toUpperCase(), p);
          }
        });

        let matched = 0;
        let updated = 0;

        for (const row of standings.rows) {
          const member = row.party?.members?.[0];
          if (!member || !member.handle) continue;

          const handle = member.handle.trim().toUpperCase();
          const participant = handleMap.get(handle);
          if (!participant) continue;

          matched++;

          const problemResults = Array.isArray(row.problemResults)
            ? row.problemResults.map((pr, index) => ({
              problemIndex: standings.problems?.[index]?.index || String.fromCharCode(65 + index),
              problemName: standings.problems?.[index]?.name || `Problem ${String.fromCharCode(65 + index)}`,
              points: pr.points || 0,
              solved: pr.points > 0,
              wrongAttempts: pr.rejectedAttemptCount || 0,
              bestSubmissionTime: pr.bestSubmissionTimeSeconds || undefined,
            }))
            : [];

          const solvedCount = problemResults.filter((p) => p.solved).length;

          let totalPenalty = 0;
          for (const pr of problemResults) {
            if (pr.solved && pr.bestSubmissionTime) {
              totalPenalty += pr.bestSubmissionTime;
              totalPenalty += (pr.wrongAttempts || 0) * 20;
            }
          }

          await Result.findOneAndUpdate(
            {
              contestId: contest._id,
              participantId: participant._id,
            },
            {
              contestId: contest._id,
              tournamentId,
              participantId: participant._id,
              codeforcesHandle: member.handle,
              rank: row.rank || 0,
              points: row.points || 0,
              penalty: totalPenalty,
              solvedCount,
              problemResults,
              syncedAt: new Date(),
            },
            { upsert: true, new: true }
          );

          updated++;
        }

        contest.lastSyncedAt = new Date();
        contest.syncedCount = Number(contest.syncedCount || 0) + 1;
        await contest.save();

        results.push({
          contestId: contest._id,
          name: contest.codeforcesContestName || contest.name,
          matched,
          updated,
        });
      } catch (error) {
        errors.push({
          contestId: contest._id,
          error: error.message,
        });
      }
    }

    return res.json({
      success: true,
      message: 'Bulk sync completed',
      total: contests.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('[bulkSyncContests] ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to bulk sync contests',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ============================================================
// DELETE CONTEST (legacy — full delete incl. results)
// ============================================================

exports.deleteContest = async (req, res) => {
  try {
    const { tournamentId, contestId } = req.params;

    if (!tournamentId || !mongoose.Types.ObjectId.isValid(tournamentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tournament ID',
      });
    }

    if (!contestId || !mongoose.Types.ObjectId.isValid(contestId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contest ID',
      });
    }

    const contest = await Contest.findOne({
      _id: contestId,
      tournamentId,
    });

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found',
      });
    }

    await Result.deleteMany({ contestId });
    await VideoSubmission.deleteMany({ contestId });
    await Match.updateMany({ contest: contestId }, { $unset: { contest: '' } });

    await contest.deleteOne();

    await AuditLog.create({
      action: 'CONTEST_DELETED',
      description: `Deleted contest ${contest.codeforcesContestName || contest.name}`,
      admin: getAuthUserId(req),
      tournament: tournamentId,
      details: { contestId, name: contest.codeforcesContestName || contest.name },
    });

    return res.json({
      success: true,
      message: 'Contest deleted successfully',
    });
  } catch (error) {
    console.error('[deleteContest] ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to delete contest',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ============================================================
// GET CONTEST PARTICIPANTS (legacy — used by other flows)
// ============================================================

exports.getContestParticipants = async (req, res) => {
  try {
    const { tournamentId, contestId } = req.params;

    if (!tournamentId || !mongoose.Types.ObjectId.isValid(tournamentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tournament ID',
      });
    }

    if (!contestId || !mongoose.Types.ObjectId.isValid(contestId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contest ID',
      });
    }

    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found',
      });
    }

    let participants = [];

    if (contest.stage === 'GROUP_STAGE' && contest.group) {
      participants = await Participant.find({
        tournamentId,
        group: contest.group,
        registrationStatus: 'APPROVED',
      }).populate('user', 'name username codeforcesUsername');
    } else if (contest.matchNumber) {
      const match = await Match.findOne({
        tournament: tournamentId,
        matchNumber: contest.matchNumber,
      }).populate({
        path: 'participants',
        populate: {
          path: 'user',
          select: 'name username codeforcesUsername',
        },
      });

      if (match) {
        participants = match.participants || [];
      }
    } else {
      participants = await Participant.find({
        tournamentId,
        registrationStatus: 'APPROVED',
      }).populate('user', 'name username codeforcesUsername');
    }

    return res.json({
      success: true,
      count: participants.length,
      participants,
    });
  } catch (error) {
    console.error('[getContestParticipants] ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to get contest participants',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ============================================================
// GET PARTICIPANT CONTESTS (V1 — group-aware, published only)
// ============================================================

exports.getParticipantContests = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const userId = getAuthUserId(req);

    if (!tournamentId || !mongoose.Types.ObjectId.isValid(tournamentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tournament ID',
      });
    }

    const participant = await Participant.findOne({
      tournamentId,
      user: userId,
      registrationStatus: 'APPROVED',
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'You are not an approved participant in this tournament',
      });
    }

    const contests = await Contest.find({
      tournamentId,
      published: true,
    })
      .sort({ startTime: 1 })
      .lean();

    const now = new Date();
    const groupValue = participant.group ? String(participant.group).trim().toUpperCase() : null;

    const visible = contests
      .filter((c) => {
        // Group stage → only the participant's group
        if (c.stage === 'GROUP_STAGE') {
          if (!groupValue || !c.group) return false;
          return String(c.group).trim().toUpperCase() === groupValue;
        }
        // QUALIFICATION + knockouts → all approved participants
        return true;
      })
      .map((c) => {
        const start = c.startTime ? new Date(c.startTime) : null;
        const end = c.endTime
          ? new Date(c.endTime)
          : start && c.durationSeconds
            ? new Date(start.getTime() + c.durationSeconds * 1000)
            : null;

        let status = c.status || 'PUBLISHED';
        if (start && now < start) status = 'UPCOMING';
        else if (start && end && now >= start && now < end) status = 'LIVE';
        else if (end && now >= end) status = 'FINISHED';

        return {
          _id: c._id,
          name: c.name,
          invitationUrl: c.invitationUrl,
          description: c.description || '',
          stage: c.stage,
          group: c.group || null,
          matchNumbers: c.matchNumbers || [],
          matchNumber: c.matchNumber ?? null,
          startTime: start,
          endTime: end,
          durationSeconds: c.durationSeconds || null,
          status,
          isUpcoming: status === 'UPCOMING',
          isLive: status === 'LIVE',
          isFinished: status === 'FINISHED',
        };
      });

    return res.json({
      success: true,
      count: visible.length,
      participant: {
        group: participant.group || null,
        seed: participant.seed || null,
      },
      contests: visible,
    });
  } catch (error) {
    console.error('[getParticipantContests] ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to get contests',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ============================================================
// V1 — MANUAL CONTEST INVITATION MANAGEMENT
// (No Codeforces API calls)
// ============================================================

/**
 * POST /admin/tournaments/:tournamentId/contests
 * Create a manual contest invitation (V1).
 *
 * - GROUP_STAGE: requires `group`
 * - QUALIFICATION: no extra field
 * - Knockout stages (QF / SF / FINAL): one contest per round.
 *   Pass `matchNumbers: [1,2,3,4]` — all matches in that round
 *   share this single contest + invitation URL.
 */
exports.createContest = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const {
      name,
      invitationUrl,
      stage,
      group,
      startTime,
      endTime,
      durationMinutes,
      description,
      matchNumber,
      matchNumbers,
    } = req.body;

    if (!tournamentId || !mongoose.Types.ObjectId.isValid(tournamentId)) {
      return res.status(400).json({ success: false, message: 'Invalid tournament ID' });
    }

    const errors = [];
    if (!name || !String(name).trim()) errors.push('name is required');
    if (!invitationUrl || !String(invitationUrl).trim()) errors.push('invitationUrl is required');
    if (!stage) errors.push('stage is required');
    if (!startTime) errors.push('startTime is required');

    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.map((e) => ({ field: e.split(' ')[0], message: e })),
      });
    }

    if (!isValidInvitationUrl(invitationUrl)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invitation URL. Must be a valid Codeforces URL (https://codeforces.com/...).',
      });
    }

    const normalizedStage = String(stage).toUpperCase();
    if (!VALID_STAGES.includes(normalizedStage)) {
      return res.status(400).json({
        success: false,
        message: `Invalid stage. Must be one of: ${VALID_STAGES.join(', ')}`,
      });
    }

    if (normalizedStage === 'GROUP_STAGE' && (!group || !String(group).trim())) {
      return res.status(400).json({
        success: false,
        message: 'group is required for GROUP_STAGE contests',
      });
    }

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    const parsedStart = new Date(startTime);
    if (isNaN(parsedStart.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid startTime' });
    }

    let parsedEnd = null;
    let durationSeconds = null;

    if (endTime) {
      parsedEnd = new Date(endTime);
      if (isNaN(parsedEnd.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid endTime' });
      }
      if (parsedEnd <= parsedStart) {
        return res.status(400).json({ success: false, message: 'endTime must be after startTime' });
      }
      durationSeconds = Math.floor((parsedEnd - parsedStart) / 1000);
    } else if (durationMinutes !== undefined && durationMinutes !== null) {
      const minutes = Number(durationMinutes);
      if (!Number.isFinite(minutes) || minutes <= 0) {
        return res.status(400).json({ success: false, message: 'durationMinutes must be a positive number' });
      }
      durationSeconds = Math.floor(minutes * 60);
      parsedEnd = new Date(parsedStart.getTime() + durationSeconds * 1000);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either endTime or durationMinutes is required',
      });
    }

    const normalizedGroup = normalizedStage === 'GROUP_STAGE' ? normalizeGroup(group) : undefined;

    // Knockout rounds: one contest holds every match in that round.
    const parsedMatchNumbers = KNOCKOUT_STAGES.includes(normalizedStage)
      ? normalizeMatchNumbers(matchNumbers, matchNumber)
      : [];

    if (KNOCKOUT_STAGES.includes(normalizedStage) && parsedMatchNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          'matchNumbers is required for knockout rounds. Pass an array of every match in this round (e.g. [1,2,3,4] for Quarter Finals).',
      });
    }

    const contest = await Contest.create({
      tournamentId,
      name: String(name).trim(),
      invitationUrl: String(invitationUrl).trim(),
      description: description ? String(description).trim() : '',
      stage: normalizedStage,
      group: normalizedGroup,
      // Legacy single-match field: only set when there's exactly one match.
      matchNumber: parsedMatchNumbers.length === 1 ? parsedMatchNumbers[0] : undefined,
      // New: full list of matches in this round.
      matchNumbers: parsedMatchNumbers,
      startTime: parsedStart,
      endTime: parsedEnd,
      durationSeconds,
      status: 'DRAFT',
      published: false,
    });

    // Attach this single contest to every match in the round.
    if (parsedMatchNumbers.length > 0) {
      try {
        await Match.updateMany(
          { tournament: tournamentId, matchNumber: { $in: parsedMatchNumbers } },
          { $set: { contest: contest._id } }
        );
      } catch (matchErr) {
        console.error('[createContest] Failed to attach matches:', matchErr);
      }
    }

    await AuditLog.create({
      action: 'CONTEST_CREATED',
      description: `Created contest "${contest.name}" (${normalizedStage}${normalizedGroup ? ` — Group ${normalizedGroup}` : ''
        }${parsedMatchNumbers.length ? ` — Matches ${parsedMatchNumbers.join(', ')}` : ''
        })`,
      admin: getAuthUserId(req),
      tournament: tournamentId,
      details: {
        contestId: contest._id,
        stage: normalizedStage,
        group: normalizedGroup,
        matchNumbers: parsedMatchNumbers,
        invitationUrl: contest.invitationUrl,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Contest created successfully',
      contest,
    });
  } catch (error) {
    console.error('[createContest] ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create contest',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * GET /admin/tournaments/:tournamentId/contests
 * List contests for admin (includes drafts).
 */
exports.getAdminContests = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    if (!tournamentId || !mongoose.Types.ObjectId.isValid(tournamentId)) {
      return res.status(400).json({ success: false, message: 'Invalid tournament ID' });
    }

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    const contests = await Contest.find({ tournamentId })
      .sort({ startTime: 1 })
      .lean();

    const now = new Date();
    const normalized = contests.map((c) => {
      const start = c.startTime ? new Date(c.startTime) : null;
      const end = c.endTime
        ? new Date(c.endTime)
        : start && c.durationSeconds
          ? new Date(start.getTime() + c.durationSeconds * 1000)
          : null;

      let computedStatus = c.status || 'DRAFT';
      if (c.published) {
        if (start && now < start) computedStatus = 'UPCOMING';
        else if (start && end && now >= start && now < end) computedStatus = 'LIVE';
        else if (end && now >= end) computedStatus = 'FINISHED';
        else computedStatus = 'PUBLISHED';
      }

      return {
        ...c,
        status: computedStatus,
        startTime: start,
        endTime: end,
        // Ensure consumers always receive an array even for legacy docs.
        matchNumbers: Array.isArray(c.matchNumbers) ? c.matchNumbers : [],
      };
    });

    return res.json({
      success: true,
      count: normalized.length,
      contests: normalized,
    });
  } catch (error) {
    console.error('[getAdminContests] ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get contests',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * GET /admin/tournaments/:tournamentId/contests/:contestId
 */
exports.getContestDetails = async (req, res) => {
  try {
    const { tournamentId, contestId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tournamentId) || !mongoose.Types.ObjectId.isValid(contestId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const contest = await Contest.findOne({ _id: contestId, tournamentId }).lean();
    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    return res.json({ success: true, contest });
  } catch (error) {
    console.error('[getContestDetails] ERROR:', error);
    return res.status(500).json({ success: false, message: 'Failed to get contest' });
  }
};

/**
 * PATCH /admin/tournaments/:tournamentId/contests/:contestId
 */
exports.updateContest = async (req, res) => {
  try {
    const { tournamentId, contestId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tournamentId) || !mongoose.Types.ObjectId.isValid(contestId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const contest = await Contest.findOne({ _id: contestId, tournamentId });
    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    const {
      name,
      invitationUrl,
      stage,
      group,
      startTime,
      endTime,
      durationMinutes,
      description,
      matchNumber,
      matchNumbers,
    } = req.body;

    if (invitationUrl !== undefined) {
      if (!isValidInvitationUrl(invitationUrl)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid invitation URL. Must be a valid Codeforces URL.',
        });
      }
      contest.invitationUrl = String(invitationUrl).trim();
    }

    if (name !== undefined) {
      if (!String(name).trim()) {
        return res.status(400).json({ success: false, message: 'name cannot be empty' });
      }
      contest.name = String(name).trim();
    }

    if (description !== undefined) {
      contest.description = String(description || '').trim();
    }

    if (stage !== undefined) {
      const normalized = String(stage).toUpperCase();
      if (!VALID_STAGES.includes(normalized)) {
        return res.status(400).json({ success: false, message: 'Invalid stage' });
      }
      contest.stage = normalized;
    }

    if (group !== undefined) {
      contest.group = group ? normalizeGroup(group) : undefined;
    }

    if (startTime !== undefined) {
      const parsed = new Date(startTime);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid startTime' });
      }
      contest.startTime = parsed;
    }

    if (endTime !== undefined && endTime !== null && endTime !== '') {
      const parsed = new Date(endTime);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid endTime' });
      }
      if (contest.startTime && parsed <= contest.startTime) {
        return res.status(400).json({ success: false, message: 'endTime must be after startTime' });
      }
      contest.endTime = parsed;
      contest.durationSeconds = Math.floor((parsed - contest.startTime) / 1000);
    } else if (durationMinutes !== undefined && durationMinutes !== null) {
      const minutes = Number(durationMinutes);
      if (!Number.isFinite(minutes) || minutes <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid durationMinutes' });
      }
      contest.durationSeconds = Math.floor(minutes * 60);
      if (contest.startTime) {
        contest.endTime = new Date(contest.startTime.getTime() + contest.durationSeconds * 1000);
      }
    }

    // ---- Knockout match numbers (array) ----
    if (matchNumbers !== undefined) {
      const normalized = Array.isArray(matchNumbers)
        ? matchNumbers
          .map((n) => Number(n))
          .filter((n) => Number.isInteger(n) && n > 0)
        : [];
      contest.matchNumbers = normalized;
      contest.matchNumber = normalized.length === 1 ? normalized[0] : undefined;
    } else if (matchNumber !== undefined) {
      // Legacy single-match path
      const n = matchNumber === null ? undefined : Number(matchNumber);
      contest.matchNumber = n;
      if (n !== undefined) contest.matchNumbers = [n];
    }

    if (contest.stage === 'GROUP_STAGE' && !contest.group) {
      return res.status(400).json({ success: false, message: 'group is required for GROUP_STAGE contests' });
    }

    if (
      KNOCKOUT_STAGES.includes(contest.stage) &&
      (!Array.isArray(contest.matchNumbers) || contest.matchNumbers.length === 0)
    ) {
      return res.status(400).json({
        success: false,
        message: 'matchNumbers is required for knockout contests.',
      });
    }

    await contest.save();

    // Re-attach matches in case matchNumbers changed.
    if (KNOCKOUT_STAGES.includes(contest.stage) && contest.matchNumbers.length > 0) {
      try {
        // Detach any match that previously pointed here but is no longer in the round.
        await Match.updateMany(
          {
            tournament: tournamentId,
            contest: contest._id,
            matchNumber: { $nin: contest.matchNumbers },
          },
          { $unset: { contest: '' } }
        );

        // Attach all matches in the round.
        await Match.updateMany(
          { tournament: tournamentId, matchNumber: { $in: contest.matchNumbers } },
          { $set: { contest: contest._id } }
        );
      } catch (matchErr) {
        console.error('[updateContest] Failed to sync matches:', matchErr);
      }
    }

    await AuditLog.create({
      action: 'CONTEST_UPDATED',
      description: `Updated contest "${contest.name}"`,
      admin: getAuthUserId(req),
      tournament: tournamentId,
      details: { contestId: contest._id },
    });

    return res.json({ success: true, message: 'Contest updated', contest });
  } catch (error) {
    console.error('[updateContest] ERROR:', error);
    return res.status(500).json({ success: false, message: 'Failed to update contest' });
  }
};

/**
 * POST /admin/tournaments/:tournamentId/contests/:contestId/publish
 * DRAFT → PUBLISHED. No Codeforces API call.
 */
exports.publishContestV1 = async (req, res) => {
  try {
    const { tournamentId, contestId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tournamentId) || !mongoose.Types.ObjectId.isValid(contestId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const contest = await Contest.findOne({ _id: contestId, tournamentId });
    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    if (contest.published) {
      return res.status(409).json({ success: false, message: 'Contest is already published' });
    }

    if (!contest.name || !contest.invitationUrl || !contest.stage || !contest.startTime) {
      return res.status(400).json({
        success: false,
        message: 'Contest is missing required fields (name, invitationUrl, stage, startTime)',
      });
    }
    if (contest.stage === 'GROUP_STAGE' && !contest.group) {
      return res.status(400).json({ success: false, message: 'group is required for GROUP_STAGE contests' });
    }
    if (
      KNOCKOUT_STAGES.includes(contest.stage) &&
      (!Array.isArray(contest.matchNumbers) || contest.matchNumbers.length === 0)
    ) {
      return res.status(400).json({
        success: false,
        message: 'matchNumbers is required for knockout contests',
      });
    }
    if (!isValidInvitationUrl(contest.invitationUrl)) {
      return res.status(400).json({ success: false, message: 'Invitation URL is invalid' });
    }

    contest.published = true;
    contest.publishedAt = new Date();
    contest.status = 'PUBLISHED';
    await contest.save();

    await AuditLog.create({
      action: 'CONTEST_PUBLISHED',
      description: `Published contest "${contest.name}"`,
      admin: getAuthUserId(req),
      tournament: tournamentId,
      details: {
        contestId: contest._id,
        stage: contest.stage,
        group: contest.group,
        matchNumbers: contest.matchNumbers,
      },
    });

    return res.json({ success: true, message: 'Contest published', contest });
  } catch (error) {
    console.error('[publishContestV1] ERROR:', error);
    return res.status(500).json({ success: false, message: 'Failed to publish contest' });
  }
};

/**
 * DELETE /admin/tournaments/:tournamentId/contests/:contestId
 * V1 — only allow deleting drafts.
 */
exports.deleteContestV1 = async (req, res) => {
  try {
    const { tournamentId, contestId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tournamentId) || !mongoose.Types.ObjectId.isValid(contestId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const contest = await Contest.findOne({ _id: contestId, tournamentId });
    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    if (contest.published) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete a published contest. Unpublish it first or archive it.',
      });
    }

    // Detach from any matches before deleting.
    await Match.updateMany({ contest: contest._id }, { $unset: { contest: '' } });

    await contest.deleteOne();

    await AuditLog.create({
      action: 'CONTEST_DELETED',
      description: `Deleted draft contest "${contest.name}"`,
      admin: getAuthUserId(req),
      tournament: tournamentId,
      details: { contestId },
    });

    return res.json({ success: true, message: 'Contest deleted' });
  } catch (error) {
    console.error('[deleteContestV1] ERROR:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete contest' });
  }
};

/**
 * GET /admin/tournaments/:tournamentId/contests/:contestId/participants
 * Returns eligible participants for the contest (for admin preview).
 */
exports.getContestEligibleParticipants = async (req, res) => {
  try {
    const { tournamentId, contestId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tournamentId) || !mongoose.Types.ObjectId.isValid(contestId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const contest = await Contest.findOne({ _id: contestId, tournamentId });
    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    const filter = {
      tournamentId,
      registrationStatus: 'APPROVED',
    };

    if (contest.stage === 'GROUP_STAGE' && contest.group) {
      const g = String(contest.group).trim();
      filter.$or = [
        { group: g },
        { group: g.toUpperCase() },
        { group: g.toLowerCase() },
      ];
    }

    const participants = await Participant.find(filter)
      .populate('user', 'name username codeforcesUsername')
      .sort({ seed: 1, createdAt: 1 });

    return res.json({
      success: true,
      count: participants.length,
      participants,
      scope:
        contest.stage === 'GROUP_STAGE'
          ? `Group ${contest.group}`
          : 'All eligible participants',
    });
  } catch (error) {
    console.error('[getContestEligibleParticipants] ERROR:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch participants' });
  }
};

// ============================================================
// PARTICIPANT — CONFIRM JOINED + PARTICIPATION STATUS
// ============================================================

/**
 * POST /api/contests/:contestId/confirm-joined
 * Participant confirms they've joined the contest on Codeforces.
 */
exports.confirmJoinedContest = async (req, res) => {
  try {
    const { contestId } = req.params;
    const userId = getAuthUserId(req);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    if (!mongoose.Types.ObjectId.isValid(contestId)) {
      return res.status(400).json({ success: false, message: "Invalid contest ID" });
    }

    const contest = await Contest.findById(contestId).lean();
    if (!contest) {
      return res.status(404).json({ success: false, message: "Contest not found" });
    }

    const participant = await Participant.findOne({
      user: userId,
      tournamentId: contest.tournamentId,
    });

    if (!participant) {
      return res.status(403).json({ success: false, message: "Not registered for this tournament" });
    }
    if (participant.registrationStatus !== "APPROVED") {
      return res.status(403).json({
        success: false,
        message: "Your registration has not been approved yet",
      });
    }

    if (!participant.seenContests) {
      participant.seenContests = new Map();
    }
    participant.seenContests.set(String(contestId), new Date());
    participant.markModified("seenContests");
    await participant.save();

    return res.json({
      success: true,
      message: "Confirmed. You can now submit your video.",
      confirmedAt: participant.seenContests.get(String(contestId)),
    });
  } catch (error) {
    console.error("[confirmJoinedContest] ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * GET /api/contests/:contestId/my-participation
 * Returns registration + confirmation + submission gate for the current user.
 */
exports.getMyParticipation = async (req, res) => {
  try {
    const { contestId } = req.params;
    const userId = getAuthUserId(req);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    if (!mongoose.Types.ObjectId.isValid(contestId)) {
      return res.status(400).json({ success: false, message: "Invalid contest ID" });
    }

    const contest = await Contest.findById(contestId).lean();
    if (!contest) {
      return res.status(404).json({ success: false, message: "Contest not found" });
    }

    const participant = await Participant.findOne({
      user: userId,
      tournamentId: contest.tournamentId,
    }).lean();

    if (!participant) {
      return res.json({
        success: true,
        registrationStatus: "NONE",
        confirmedJoined: false,
        canSubmitVideo: false,
      });
    }

    const confirmed =
      participant.seenContests &&
      (participant.seenContests[String(contestId)] ||
        participant.seenContests.get?.(String(contestId)));

    const approved = participant.registrationStatus === "APPROVED";

    return res.json({
      success: true,
      registrationStatus: participant.registrationStatus,
      confirmedJoined: Boolean(confirmed),
      canSubmitVideo: approved && Boolean(confirmed),
    });
  } catch (error) {
    console.error("[getMyParticipation] ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================================================
// MODULE EXPORTS
// ============================================================
module.exports = {
  // V1 — manual invitation management (no Codeforces API)
  createContest: exports.createContest,
  getAdminContests: exports.getAdminContests,
  getContestDetails: exports.getContestDetails,
  updateContest: exports.updateContest,
  publishContestV1: exports.publishContestV1,
  deleteContestV1: exports.deleteContestV1,
  getContestEligibleParticipants: exports.getContestEligibleParticipants,

  // Participant-facing (group-aware, published only)
  getParticipantContests: exports.getParticipantContests,

  // Participant — contest join confirmation
  confirmJoinedContest: exports.confirmJoinedContest,
  getMyParticipation: exports.getMyParticipation,

  // Legacy — kept for backward compatibility
  validateCodeforcesContest: exports.validateCodeforcesContest,
  publishContest: exports.publishContest,
  getContests: exports.getContests,
  getContest: exports.getContest,
  getResults: exports.getResults,
  syncResults: exports.syncResults,
  getLeaderboard: exports.getLeaderboard,
  reconcileContestsMatches: exports.reconcileContestsMatches,
  addPenalty: exports.addPenalty,
  updateContestStatus: exports.updateContestStatus,
  bulkSyncContests: exports.bulkSyncContests,
  deleteContest: exports.deleteContest,
  getContestParticipants: exports.getContestParticipants,
};