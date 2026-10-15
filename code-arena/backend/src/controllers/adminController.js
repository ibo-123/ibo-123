const AuditLog = require("../models/AuditLog");
const Tournament = require("../models/Tournament");
const Participant = require("../models/Participant");
const Contest = require("../models/Contest");
const Match = require("../models/Match");
const User = require("../models/User");

const getAuthUserId = (req) => req.user?.userId || req.user?.id || req.user?._id || null;

// ✅ GET /api/admin/audit-logs?tournamentId=...
const getAuditLogs = async (req, res) => {
  try {
    const filter = req.query.tournamentId ? { tournament: req.query.tournamentId } : {};
    const logs = await AuditLog.find(filter)
      .populate("admin", "name username")
      .sort({ createdAt: -1 })
      .limit(200);
    return res.json({ success: true, logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ GET /api/admin/stats
const getAdminStats = async (req, res) => {
  try {
    const [
      totalTournaments,
      activeTournaments,
      completedTournaments,
      totalParticipants,
      qualifiedParticipants,
      totalContests,
      activeContests,
      completedContests,
      upcomingMatches,
      recentActivity,
    ] = await Promise.all([
      Tournament.countDocuments(),
      Tournament.countDocuments({ status: { $nin: ["COMPLETED", "CANCELLED"] } }),
      Tournament.countDocuments({ status: "COMPLETED" }),
      Participant.countDocuments(),
      Participant.countDocuments({ status: { $in: ["ACTIVE", "ADVANCED"] } }),
      Contest.countDocuments(),
      Contest.countDocuments({ status: "LIVE" }),
      Contest.countDocuments({ status: "FINISHED" }),
      Match.countDocuments({ status: "PENDING" }),
      AuditLog.find().populate("admin", "name username").sort({ createdAt: -1 }).limit(5),
    ]);

    return res.json({
      success: true,
      stats: {
        totalTournaments,
        activeTournaments,
        completedTournaments,
        totalParticipants,
        qualifiedParticipants,
        totalContests,
        activeContests,
        completedContests,
        upcomingMatches,
        recentActivity,
      },
    });
  } catch (error) {
    console.error("getAdminStats error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ GET /api/admin/settings
const getAdminSettings = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Admin account not found" });
    }

    return res.json({
      success: true,
      settings: {
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        tournamentDefaults: {
          maxParticipants: 20,
          numberOfGroups: 4,
          participantsPerGroup: 5,
          qualifiersPerGroup: 2,
          playoffFormat: "SINGLE_ELIMINATION",
        },
      },
    });
  } catch (error) {
    console.error("getAdminSettings error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ PATCH /api/admin/settings
const updateAdminSettings = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { name, email, password } = req.body;
    const user = await User.findById(userId).select("+password");

    if (!user) {
      return res.status(404).json({ success: false, message: "Admin account not found" });
    }

    if (name !== undefined && name !== null && String(name).trim()) {
      user.name = String(name).trim();
    }

    if (email !== undefined && email !== null && String(email).trim()) {
      const normalized = String(email).trim().toLowerCase();
      const existing = await User.findOne({ email: normalized, _id: { $ne: user._id } });
      if (existing) {
        return res.status(409).json({ success: false, message: "Email already in use" });
      }
      user.email = normalized;
    }

    if (password !== undefined && password !== null && String(password).trim()) {
      if (String(password).trim().length < 6) {
        return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
      }
      user.password = String(password).trim();
    }

    await user.save();

    return res.json({
      success: true,
      message: "Settings updated successfully",
      settings: {
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("updateAdminSettings error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getAuditLogs, getAdminStats, getAdminSettings, updateAdminSettings };