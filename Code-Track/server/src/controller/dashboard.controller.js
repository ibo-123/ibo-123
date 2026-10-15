import User from "../models/UserModel.js";
import { getCodeforcesStats } from "../services/codeforces.services.js";

export const getDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // No Codeforces account connected — return empty state
    if (!user.codeforcesHandle) {
      return res.status(200).json({
        success: true,
        user,
        problemsSolved: 0,
        contestCount: 0,
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null,
        lastSyncedAt: null,
        codeforces: null,
      });
    }

    // Attempt a live sync / fetch from Codeforces
    let stats = null;
    try {
      stats = await getCodeforcesStats(user.codeforcesHandle, req.user.id);
    } catch (error) {
      console.error("Codeforces Error:", error.message);
      // Fall through — we'll serve from the User document cache below
    }

    // Re-fetch user after potential sync (sync may have updated cached fields)
    const freshUser = await User.findById(req.user.id).select("-password");

    return res.status(200).json({
      success: true,
      user: freshUser,

      // Problem stats — prefer live stats, fall back to User cache
      problemsSolved: stats?.problemsSolved ?? freshUser.totalSolved ?? 0,
      contestCount: stats?.contestCount ?? 0,

      // Difficulty breakdown (populated by syncCodeforcesData)
      easySolved: freshUser.easySolved ?? 0,
      mediumSolved: freshUser.mediumSolved ?? 0,
      hardSolved: freshUser.hardSolved ?? 0,

      // Streak (populated by syncCodeforcesData)
      currentStreak: freshUser.currentStreak ?? 0,
      longestStreak: freshUser.longestStreak ?? 0,
      lastActiveDate: freshUser.lastActiveDate ?? null,
      lastSyncedAt: freshUser.lastSyncedAt ?? null,

      // Codeforces profile — prefer live stats, fall back to cached fields on User
      codeforces: stats
        ? {
            handle: stats.handle,
            rating: stats.rating,
            maxRating: stats.maxRating,
            rank: stats.rank,
            maxRank: stats.maxRank,
            contribution: stats.contribution,
            avatar: stats.avatar,
          }
        : {
            handle: freshUser.codeforcesHandle,
            rating: freshUser.codeforcesRating,
            maxRating: freshUser.codeforcesMaxRating,
            rank: freshUser.codeforcesRank,
            maxRank: freshUser.codeforcesMaxRank,
            contribution: freshUser.codeforcesContribution,
            avatar: freshUser.codeforcesAvatar,
          },
    });

  } catch (error) {
    console.error("Dashboard Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard",
    });
  }
};