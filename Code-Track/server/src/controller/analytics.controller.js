import User from "../models/UserModel.js";
import Submission from "../models/SubmissionModel.js";
import { getCodeforcesStats } from "../services/codeforces.services.js";

export const getAnalytics = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

  
    if (!user.codeforcesHandle) {
      return res.status(200).json({
        success: true,
        analytics: {
          currentRating: 0,
          maxRating: 0,
          contestCount: 0,
          problemsSolved: 0,
          history: [],
        },
      });
    }

    const stats = await getCodeforcesStats(
      user.codeforcesHandle
    );

    return res.status(200).json({
      success: true,
      analytics: {
        currentRating: stats.rating,
        maxRating: stats.maxRating,
        contestCount: stats.contestCount,
        problemsSolved: stats.problemsSolved,
        history: stats.history,
      },
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

export const getHeatmap = async (req, res) => {
  try {
    const submissions = await Submission.find({ userId: req.user.id });
    const heatmapData = {};

    submissions.forEach(sub => {
      const d = new Date(sub.creationTimeSeconds * 1000);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      if (!heatmapData[dateStr]) {
        heatmapData[dateStr] = { count: 0, accepted: 0 };
      }
      heatmapData[dateStr].count++;
      if (sub.verdict === "OK") {
        heatmapData[dateStr].accepted++;
      }
    });

    // Format for react-calendar-heatmap
    const formattedData = Object.keys(heatmapData).map(date => ({
      date,
      count: heatmapData[date].count,
      accepted: heatmapData[date].accepted
    }));

    res.json({ success: true, heatmap: formattedData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProblemDistribution = async (req, res) => {
  try {
    const submissions = await Submission.find({ userId: req.user.id, verdict: "OK" });
    
    const difficultyDist = {};
    const tagDist = {};
    const seenProblems = new Set();

    submissions.forEach(sub => {
      const problemId = `${sub.contestId}-${sub.problemIndex}`;
      if (seenProblems.has(problemId)) return;
      seenProblems.add(problemId);

      // Difficulty
      if (sub.rating) {
        difficultyDist[sub.rating] = (difficultyDist[sub.rating] || 0) + 1;
      } else {
        difficultyDist["Unrated"] = (difficultyDist["Unrated"] || 0) + 1;
      }

      // Tags
      if (sub.tags && Array.isArray(sub.tags)) {
        sub.tags.forEach(tag => {
          tagDist[tag] = (tagDist[tag] || 0) + 1;
        });
      }
    });

    res.json({
      success: true,
      difficulty: difficultyDist,
      tags: tagDist,
      totalSolved: seenProblems.size
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};