// backend/src/controllers/participantController.js
const mongoose = require("mongoose");
const Participant = require("../models/Participant");
const Tournament = require("../models/Tournament");
const AuditLog = require("../models/AuditLog");

// ============================================================
// JOIN TOURNAMENT
// ============================================================
const joinTournament = async (req, res) => {
  try {
    const tournamentId = req.params.tournamentId || req.params.id;
    const userId = req.user.userId || req.user._id;

    if (req.user.role === "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Admins cannot register as participants",
      });
    }

    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
    }

    const now = new Date();

    const registrationStart = tournament.registrationStart
      ? new Date(tournament.registrationStart)
      : null;

    const registrationEnd = tournament.registrationEnd
      ? new Date(tournament.registrationEnd)
      : null;

    if (registrationStart && now < registrationStart) {
      return res.status(400).json({
        success: false,
        message: "Tournament registration has not started yet",
      });
    }

    if (registrationEnd && now >= registrationEnd) {
      return res.status(400).json({
        success: false,
        message: "Tournament registration has ended",
      });
    }

    if (
      tournament.status === "GROUP_STAGE" ||
      tournament.status === "COMPLETED"
    ) {
      return res.status(400).json({
        success: false,
        message: "Tournament has already started or completed",
      });
    }

    // ---- Slot counting: rejected participants do NOT occupy a slot ----
    const participantCount = await Participant.countDocuments({
      tournamentId,
      registrationStatus: { $ne: "REJECTED" },
    });

    const maxParticipants = tournament.maxParticipants || 20;

    if (participantCount >= maxParticipants) {
      return res.status(400).json({
        success: false,
        message: "Tournament is full",
      });
    }

    // ---- Duplicate check ----
    const existingParticipant = await Participant.findOne({
      tournamentId,
      user: userId,
    });

    if (existingParticipant) {
      if (existingParticipant.registrationStatus === "REJECTED") {
        return res.status(409).json({
          success: false,
          message:
            "Your previous registration for this tournament was rejected. Contact the organizers.",
          participant: existingParticipant,
        });
      }
      return res.status(409).json({
        success: false,
        message:
          existingParticipant.registrationStatus === "APPROVED"
            ? "You are already approved for this tournament"
            : "You already registered for this tournament. Awaiting approval.",
        participant: existingParticipant,
      });
    }

    const participant = await Participant.create({
      tournamentId,
      user: userId,
      registrationStatus: "PENDING",
      status: "ACTIVE",
      currentStage: "REGISTRATION",
    });

    await AuditLog.create({
      action: "PARTICIPANT_REGISTERED",
      description: `Participant ${userId} registered for tournament ${tournament.name}`,
      admin: null,
      tournament: tournamentId,
    });

    return res.status(201).json({
      success: true,
      message: "Registration submitted. Awaiting admin approval.",
      participant,
    });
  } catch (error) {
    console.error("joinTournament error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You already registered for this tournament",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ============================================================
// APPROVE PARTICIPANT
// ============================================================
const approveParticipant = async (req, res) => {
  try {
    const { tournamentId, participantId } = req.params;

    const participant = await Participant.findOne({
      _id: participantId,
      tournamentId,
    }).populate("user");

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "Participant not found",
      });
    }

    if (participant.registrationStatus !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Participant is already ${participant.registrationStatus.toLowerCase()}`,
      });
    }

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
    }

    const totalGroups = Math.max(1, Number(tournament.numberOfGroups || 4));
    const groupNames = Array.from({ length: totalGroups }, (_, index) =>
      String.fromCharCode(65 + index)
    );

    const groupCounts = await Participant.aggregate([
      {
        $match: {
          tournamentId: new mongoose.Types.ObjectId(tournamentId),
          group: { $exists: true, $ne: null, $ne: "" },
          registrationStatus: "APPROVED",
        },
      },
      {
        $group: {
          _id: "$group",
          count: { $sum: 1 },
        },
      },
    ]);

    const countsByGroup = Object.fromEntries(
      groupNames.map((groupName) => [groupName, 0])
    );

    for (const entry of groupCounts) {
      countsByGroup[entry._id] = entry.count;
    }

    const targetCapacity = Math.max(
      1,
      Number(
        tournament.participantsPerGroup ||
        Math.ceil((tournament.maxParticipants || totalGroups) / totalGroups)
      )
    );

    let assignedGroup = groupNames.find(
      (groupName) => (countsByGroup[groupName] || 0) < targetCapacity
    );

    if (!assignedGroup) {
      assignedGroup = groupNames
        .slice()
        .sort((left, right) => {
          const leftCount = countsByGroup[left] || 0;
          const rightCount = countsByGroup[right] || 0;
          if (leftCount === rightCount) {
            return left.localeCompare(right);
          }
          return leftCount - rightCount;
        })[0];
    }

    const assignedSeed = (countsByGroup[assignedGroup] || 0) + 1;

    participant.registrationStatus = "APPROVED";
    participant.group = assignedGroup;
    participant.seed = assignedSeed;
    await participant.save();

    await AuditLog.create({
      action: "PARTICIPANT_APPROVED",
      description: `Participant ${participant.user?.username || participant.user
        } approved for tournament ${tournament.name}`,
      admin: req.user.userId || req.user._id,
      tournament: tournamentId,
    });

    return res.json({
      success: true,
      message: "Participant approved successfully",
      participant,
    });
  } catch (error) {
    console.error("approveParticipant error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ============================================================
// REJECT PARTICIPANT
// ============================================================
const rejectParticipant = async (req, res) => {
  try {
    const { tournamentId, participantId } = req.params;
    const { reason } = req.body || {};

    const participant = await Participant.findOne({
      _id: participantId,
      tournamentId,
    }).populate("user");

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "Participant not found",
      });
    }

    // ---- Only block if already rejected ----
    if (participant.registrationStatus === "REJECTED") {
      return res.status(400).json({
        success: false,
        message: "Participant is already rejected",
      });
    }

    // Note: APPROVED participants CAN be rejected.
    // This frees their slot for a new registrant.

    const wasApproved = participant.registrationStatus === "APPROVED";

    participant.registrationStatus = "REJECTED";
    participant.status = "ELIMINATED";
    participant.group = undefined;
    participant.seed = undefined;
    await participant.save();

    const tournament = await Tournament.findById(tournamentId);

    await AuditLog.create({
      action: "PARTICIPANT_REJECTED",
      description: `Participant ${participant.user?.username || participant.user
        } ${wasApproved ? "removed" : "rejected"} from tournament ${tournament?.name || tournamentId
        }${reason ? ` — Reason: ${reason}` : ""}`,
      admin: req.user.userId || req.user._id,
      tournament: tournamentId,
      details: { reason, wasApproved },
    });

    return res.json({
      success: true,
      message: wasApproved
        ? "Approved participant rejected. Slot is now free."
        : "Participant rejected",
      participant,
    });
  } catch (error) {
    console.error("rejectParticipant error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ============================================================
// GET PARTICIPANTS
// ============================================================
const getParticipants = async (req, res) => {
  try {
    const tournamentId = req.params.tournamentId || req.params.id;

    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
    }

    const participants = await Participant.find({ tournamentId })
      .populate("user", "name username codeforcesUsername email")
      .sort({ createdAt: 1 });

    const activeCount = participants.filter(
      (p) => p.registrationStatus !== "REJECTED"
    ).length;

    return res.status(200).json({
      success: true,
      count: participants.length,
      activeCount,
      maxParticipants: tournament.maxParticipants || 20,
      participants,
    });
  } catch (error) {
    console.error("getParticipants error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ============================================================
// GET MY STATUS
// ============================================================
const getMyStatus = async (req, res) => {
  try {
    const tournamentId = req.params.tournamentId || req.params.id;
    const userId = req.user.userId || req.user._id;

    const participant = await Participant.findOne({
      tournamentId,
      user: userId,
    }).populate("user", "name username codeforcesUsername");

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "You are not registered for this tournament",
      });
    }

    const tournament = await Tournament.findById(tournamentId);

    return res.json({
      success: true,
      participant: {
        id: participant._id,
        registrationStatus: participant.registrationStatus,
        group: participant.group,
        seed: participant.seed,
        rank: participant.rank,
        score: participant.score,
        solved: participant.solved,
        penalty: participant.penalty,
        status: participant.status,
        currentStage: participant.currentStage,
        isApproved: participant.registrationStatus === "APPROVED",
        isEliminated: participant.status === "ELIMINATED",
        hasAdvanced:
          participant.status === "ADVANCED" ||
          participant.status === "CHAMPION",
        user: participant.user,
      },
      tournament: {
        id: tournament?._id,
        name: tournament?.name,
        status: tournament?.status,
        currentStage: tournament?.currentStage,
      },
    });
  } catch (error) {
    console.error("getMyStatus error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ============================================================
// GET GROUPS
// ============================================================
const getGroups = async (req, res) => {
  try {
    const tournamentId = req.params.tournamentId || req.params.id;

    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
    }

    const participants = await Participant.find({
      tournamentId,
      group: { $exists: true, $ne: null, $ne: "" },
    })
      .populate("user", "name username codeforcesUsername")
      .sort({ group: 1, seed: 1 });

    const groups = {};

    participants.forEach((participant) => {
      if (participant.group) {
        if (!groups[participant.group]) {
          groups[participant.group] = [];
        }
        groups[participant.group].push(participant);
      }
    });

    const sortedGroups = {};
    Object.keys(groups)
      .sort()
      .forEach((key) => {
        sortedGroups[key] = groups[key];
      });

    return res.json({
      success: true,
      groups: sortedGroups,
      groupCount: Object.keys(sortedGroups).length,
      totalParticipants: participants.length,
    });
  } catch (error) {
    console.error("getGroups error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ============================================================
// UPDATE PARTICIPANT
// ============================================================
const updateParticipant = async (req, res) => {
  try {
    const tournamentId = req.params.tournamentId || req.params.id;
    const { participantId } = req.params;
    const { group, seed, status, currentStage } = req.body;

    const participant = await Participant.findOne({
      _id: participantId,
      tournamentId,
    }).populate("user", "username name");

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "Participant not found",
      });
    }

    if (group !== undefined && group !== null && group !== "") {
      const tournament = await Tournament.findById(tournamentId);
      const totalGroups = Math.max(1, Number(tournament?.numberOfGroups || 4));
      const validGroups = Array.from({ length: totalGroups }, (_, i) =>
        String.fromCharCode(65 + i)
      );
      const normalizedGroup = String(group).toUpperCase();
      if (!validGroups.includes(normalizedGroup)) {
        return res.status(400).json({
          success: false,
          message: `Invalid group. Valid groups: ${validGroups.join(", ")}`,
        });
      }
      participant.group = normalizedGroup;
    }

    if (seed !== undefined && seed !== null) {
      const seedNum = Number(seed);
      if (!Number.isFinite(seedNum) || seedNum < 1) {
        return res.status(400).json({
          success: false,
          message: "Seed must be a positive number",
        });
      }
      participant.seed = seedNum;
    }

    if (status !== undefined) {
      participant.status = status;
    }

    if (currentStage !== undefined) {
      participant.currentStage = currentStage;
    }

    await participant.save();

    await AuditLog.create({
      action: "PARTICIPANT_UPDATED",
      description: `Updated participant ${participant.user?.username || participant.user
        }`,
      admin: req.user.userId || req.user._id,
      tournament: tournamentId,
      details: { group, seed, status, currentStage },
    });

    return res.json({
      success: true,
      participant,
    });
  } catch (error) {
    console.error("updateParticipant error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ============================================================
// GET MY TOURNAMENTS
// ============================================================
const getMyTournaments = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;

    const participants = await Participant.find({
      user: userId,
      registrationStatus: { $in: ["APPROVED", "PENDING"] },
    }).populate(
      "tournamentId",
      "name description status currentStage registrationEnd tournamentStart tournamentEnd"
    );

    if (!participants || participants.length === 0) {
      return res.json({
        success: true,
        tournaments: [],
      });
    }

    const tournaments = participants.map((p) => ({
      ...p.toObject(),
      tournament: p.tournamentId,
    }));

    return res.json({
      success: true,
      count: tournaments.length,
      tournaments,
    });
  } catch (error) {
    console.error("getMyTournaments error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ============================================================
// EXPORTS
// ============================================================
module.exports = {
  joinTournament,
  approveParticipant,
  rejectParticipant,
  getParticipants,
  getMyStatus,
  getGroups,
  updateParticipant,
  getMyTournaments,
};