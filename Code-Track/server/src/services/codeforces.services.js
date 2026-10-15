import axios from "axios";
import Submission from "../models/SubmissionModel.js";
import User from "../models/UserModel.js";

const BASE_URL = "https://codeforces.com/api";

const validateHandle = (handle) => {
  if (!handle || typeof handle !== "string" || handle.trim() === "") {
    throw new Error("Codeforces handle is required");
  }
  return handle.trim();
};

export const getCodeforcesUser = async (handle) => {
  try {
    handle = validateHandle(handle);
    const response = await axios.get(`${BASE_URL}/user.info?handles=${handle}`);
    
    if (response.data.status !== "OK") {
      throw new Error("Codeforces handle not found");
    }

    return response.data.result[0];
  } catch (error) {
    if (error.response?.status === 400) {
      throw new Error("Codeforces handle not found");
    }
    throw new Error("Unable to connect to Codeforces");
  }
};

export const getContestHistory = async (handle) => {
  handle = validateHandle(handle);
  const response = await axios.get(`${BASE_URL}/user.rating?handle=${handle}`);
  if (response.data.status !== "OK") {
    throw new Error("Unable to fetch contest history");
  }
  return response.data.result;
};

export const getContestList = async () => {
  const response = await axios.get("https://codeforces.com/api/contest.list");
  if (response.data.status !== "OK") {
    throw new Error("Unable to fetch contests");
  }
  return response.data.result;
};

export const getRatingHistory = async (handle) => {
  try {
    handle = validateHandle(handle);
    const response = await axios.get(`${BASE_URL}/user.rating?handle=${handle}`);
    if (response.data.status !== "OK") {
      throw new Error("Unable to fetch rating history");
    }
    return response.data.result;
  } catch (error) {
    throw new Error("Unable to fetch rating history");
  }
};

export const getSubmissions = async (handle) => {
  try {
    handle = validateHandle(handle);
    const response = await axios.get(`${BASE_URL}/user.status?handle=${handle}`);
    if (response.data.status !== "OK") {
      throw new Error("Unable to fetch submissions");
    }
    return response.data.result;
  } catch (error) {
    throw new Error("Unable to fetch submissions");
  }
};

export const syncCodeforcesData = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.codeforcesHandle) {
      throw new Error("User or Codeforces handle not found");
    }

    const handle = user.codeforcesHandle;

    const [cfUser, ratingHistory, submissions] = await Promise.all([
      getCodeforcesUser(handle).catch(() => null),
      getRatingHistory(handle).catch(() => []),
      getSubmissions(handle).catch(() => []),
    ]);

    if (!cfUser) return null; // Abort sync if Codeforces API fails

    // 1. Sync Submissions to DB
    const submissionDocs = [];
    const solvedProblems = new Set();
    let easySolved = 0;
    let mediumSolved = 0;
    let hardSolved = 0;

    for (const sub of submissions) {
      const problemId = `${sub.problem.contestId}-${sub.problem.index}`;
      if (sub.verdict === "OK" && !solvedProblems.has(problemId)) {
        solvedProblems.add(problemId);
        if (sub.problem.rating) {
          if (sub.problem.rating <= 1200) easySolved++;
          else if (sub.problem.rating <= 1800) mediumSolved++;
          else hardSolved++;
        }
      }

      submissionDocs.push({
        updateOne: {
          filter: { userId, submissionId: sub.id },
          update: {
            $set: {
              userId,
              submissionId: sub.id,
              problemName: sub.problem.name,
              problemIndex: sub.problem.index,
              contestId: sub.problem.contestId,
              rating: sub.problem.rating || null,
              tags: sub.problem.tags || [],
              verdict: sub.verdict,
              language: sub.programmingLanguage,
              creationTimeSeconds: sub.creationTimeSeconds,
            }
          },
          upsert: true
        }
      });
    }

    if (submissionDocs.length > 0) {
      await Submission.bulkWrite(submissionDocs, { ordered: false }).catch(e => console.error("BulkWrite error:", e));
    }

    // Calculate streak
    let currentStreak = 0;
    let longestStreak = 0;
    let lastActiveDate = null;
    
    // Group submissions by day (ignoring time)
    const activeDays = new Set();
    submissions.forEach(sub => {
      const d = new Date(sub.creationTimeSeconds * 1000);
      activeDays.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    });
    const sortedDays = Array.from(activeDays).sort((a, b) => new Date(b) - new Date(a));
    
    if (sortedDays.length > 0) {
      lastActiveDate = new Date(sortedDays[0]);
      
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
      const yesterdayStr = `${yesterday.getFullYear()}-${yesterday.getMonth()}-${yesterday.getDate()}`;
      
      if (sortedDays[0] === todayStr || sortedDays[0] === yesterdayStr) {
        currentStreak = 1;
        for (let i = 1; i < sortedDays.length; i++) {
          const d1 = new Date(sortedDays[i-1]);
          const d2 = new Date(sortedDays[i]);
          const diffDays = Math.floor((d1 - d2) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }

      let tempStreak = 1;
      longestStreak = 1;
      for (let i = 1; i < sortedDays.length; i++) {
        const d1 = new Date(sortedDays[i-1]);
        const d2 = new Date(sortedDays[i]);
        const diffDays = Math.floor((d1 - d2) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
          if (tempStreak > longestStreak) longestStreak = tempStreak;
        } else {
          tempStreak = 1;
        }
      }
    }

    // 2. Update User Document
    user.codeforcesRating = cfUser.rating;
    user.codeforcesMaxRating = cfUser.maxRating;
    user.codeforcesRank = cfUser.rank;
    user.codeforcesMaxRank = cfUser.maxRank;
    user.codeforcesContribution = cfUser.contribution;
    user.codeforcesAvatar = cfUser.avatar;
    user.totalSolved = solvedProblems.size;
    user.easySolved = easySolved;
    user.mediumSolved = mediumSolved;
    user.hardSolved = hardSolved;
    user.currentStreak = currentStreak;
    user.longestStreak = Math.max(longestStreak, user.longestStreak || 0);
    user.lastActiveDate = lastActiveDate;
    user.lastSyncedAt = new Date();

    await user.save();

    return {
      success: true,
      stats: {
        handle: cfUser.handle,
        rating: cfUser.rating,
        maxRating: cfUser.maxRating,
        rank: cfUser.rank,
        maxRank: cfUser.maxRank,
        contribution: cfUser.contribution,
        avatar: cfUser.avatar,
        problemsSolved: solvedProblems.size,
        contestCount: ratingHistory.length,
        ratingHistory,
        easySolved,
        mediumSolved,
        hardSolved,
        currentStreak,
        longestStreak
      }
    };
  } catch (error) {
    console.error("Codeforces Sync Error:", error);
    throw new Error("Failed to sync Codeforces data");
  }
};

export const getCodeforcesStats = async (handle, userId = null) => {
  if (userId) {
    // If userId is provided, attempt to sync first
    try {
      const syncResult = await syncCodeforcesData(userId);
      if (syncResult && syncResult.stats) return syncResult.stats;
    } catch (e) {
      console.warn("Sync failed, falling back to basic fetch:", e);
    }
  }

  // Fallback to basic fetch if sync fails or userId is not provided
  handle = validateHandle(handle);
  const [user, ratingHistory, submissions] = await Promise.all([
    getCodeforcesUser(handle),
    getRatingHistory(handle),
    getSubmissions(handle),
  ]);

  const solvedProblems = new Set();
  submissions.forEach(submission => {
    if (submission.verdict === "OK") {
      solvedProblems.add(`${submission.problem.contestId}-${submission.problem.index}`);
    }
  });

  return {
    handle: user.handle,
    rating: user.rating,
    maxRating: user.maxRating,
    rank: user.rank,
    maxRank: user.maxRank,
    contribution: user.contribution,
    avatar: user.avatar,
    problemsSolved: solvedProblems.size,
    contestCount: ratingHistory.length,
    ratingHistory,
  };
};