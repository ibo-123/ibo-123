// src/controllers/tournamentController.js

const Tournament = require("../models/Tournament");
const Participant = require("../models/Participant");
const Result = require("../models/Result");
const mongoose = require("mongoose");
const advancementService = require("../services/advancementService");
const tournamentService = require("../services/tournamentService");
const auditLogService = require("../services/auditLogService");
const AuditLog = require("../models/AuditLog");

const getAuthenticatedUserId = (req) => {
  return req.user?.userId || req.user?.id || req.user?._id || null;
};

// ============================================================
// CREATE TOURNAMENT
// ============================================================
const createTournament = async (req, res) => {
  try {
    const {
      name,
      description,
      registrationStart,
      registrationEnd,
      tournamentStart,
      tournamentEnd,
      maxParticipants,
      numberOfGroups,
      participantsPerGroup,
      qualifiersPerGroup,
      groupContests,
      playoffFormat,
    } = req.body;

    // ----------------------------------------------------------
    // REQUIRED FIELDS
    // ----------------------------------------------------------
    const requiredFields = [
      "name",
      "registrationStart",
      "registrationEnd",
      "tournamentStart",
      "tournamentEnd",
      "maxParticipants",
      "numberOfGroups",
      "qualifiersPerGroup",
      "groupContests",
      "playoffFormat",
    ];

    const missingFields = requiredFields.filter((field) => {
      const value = req.body[field];
      return value === undefined || value === null || value === "";
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
        errors: missingFields.map((field) => ({
          field,
          message: `${field} is required`,
        })),
      });
    }

    const errors = [];

    // ----------------------------------------------------------
    // BASIC VALIDATION
    // ----------------------------------------------------------
    if (!name || !String(name).trim()) {
      errors.push({
        field: "name",
        message: "Tournament name is required",
      });
    }

    // ----------------------------------------------------------
    // DATE PARSING
    // ----------------------------------------------------------
    const regStart = new Date(registrationStart);
    const regEnd = new Date(registrationEnd);
    const tournStart = new Date(tournamentStart);
    const tournEnd = new Date(tournamentEnd);

    const regStartValid = !isNaN(regStart.getTime());
    const regEndValid = !isNaN(regEnd.getTime());
    const tournStartValid = !isNaN(tournStart.getTime());
    const tournEndValid = !isNaN(tournEnd.getTime());

    if (!regStartValid) {
      errors.push({
        field: "registrationStart",
        message: "Invalid registration start date",
      });
    }

    if (!regEndValid) {
      errors.push({
        field: "registrationEnd",
        message: "Invalid registration end date",
      });
    }

    if (!tournStartValid) {
      errors.push({
        field: "tournamentStart",
        message: "Invalid tournament start date",
      });
    }

    if (!tournEndValid) {
      errors.push({
        field: "tournamentEnd",
        message: "Invalid tournament end date",
      });
    }

    // ----------------------------------------------------------
    // DATE ORDER VALIDATION
    // ----------------------------------------------------------
    if (regStartValid && regEndValid) {
      if (regStart >= regEnd) {
        errors.push({
          field: "registrationEnd",
          message:
            "Registration end must be after registration start",
        });
      }
    }

    if (regEndValid && tournStartValid) {
      if (regEnd >= tournStart) {
        errors.push({
          field: "tournamentStart",
          message:
            "Tournament start must be after registration end",
        });
      }
    }

    if (tournStartValid && tournEndValid) {
      if (tournStart >= tournEnd) {
        errors.push({
          field: "tournamentEnd",
          message:
            "Tournament end must be after tournament start",
        });
      }
    }

    // ----------------------------------------------------------
    // DATE DEBUGGING
    // ----------------------------------------------------------
    console.log("CREATE TOURNAMENT DATE DEBUG:", {
      received: {
        registrationStart,
        registrationEnd,
        tournamentStart,
        tournamentEnd,
      },
      parsed: {
        registrationStart: regStartValid
          ? regStart.toISOString()
          : "INVALID",
        registrationEnd: regEndValid
          ? regEnd.toISOString()
          : "INVALID",
        tournamentStart: tournStartValid
          ? tournStart.toISOString()
          : "INVALID",
        tournamentEnd: tournEndValid
          ? tournEnd.toISOString()
          : "INVALID",
      },
      timestamps: {
        registrationStart: regStartValid
          ? regStart.getTime()
          : null,
        registrationEnd: regEndValid
          ? regEnd.getTime()
          : null,
        tournamentStart: tournStartValid
          ? tournStart.getTime()
          : null,
        tournamentEnd: tournEndValid
          ? tournEnd.getTime()
          : null,
      },
    });

    // ----------------------------------------------------------
    // PARTICIPANT / GROUP VALIDATION
    // ----------------------------------------------------------
    const maxParticipantsNum = Number(maxParticipants);
    const numberOfGroupsNum = Number(numberOfGroups);
    const qualifiersPerGroupNum = Number(qualifiersPerGroup);
    const groupContestsNum = Number(groupContests);

    if (
      !Number.isFinite(maxParticipantsNum) ||
      maxParticipantsNum <= 0
    ) {
      errors.push({
        field: "maxParticipants",
        message:
          "Maximum participants must be greater than 0",
      });
    }

    if (
      !Number.isFinite(numberOfGroupsNum) ||
      numberOfGroupsNum <= 0
    ) {
      errors.push({
        field: "numberOfGroups",
        message:
          "Number of groups must be greater than 0",
      });
    }

    if (
      maxParticipantsNum > 0 &&
      numberOfGroupsNum > 0 &&
      maxParticipantsNum % numberOfGroupsNum !== 0
    ) {
      errors.push({
        field: "maxParticipants",
        message:
          "Maximum participants must be divisible by number of groups",
      });
    }

    const calculatedParticipantsPerGroup =
      numberOfGroupsNum > 0
        ? maxParticipantsNum / numberOfGroupsNum
        : 0;

    const participantsPerGroupNum =
      participantsPerGroup !== undefined &&
        participantsPerGroup !== null &&
        participantsPerGroup !== ""
        ? Number(participantsPerGroup)
        : calculatedParticipantsPerGroup;

    if (
      participantsPerGroupNum !==
      calculatedParticipantsPerGroup
    ) {
      errors.push({
        field: "participantsPerGroup",
        message: `Participants per group must equal ${calculatedParticipantsPerGroup} (maxParticipants / numberOfGroups)`,
      });
    }

    if (
      !Number.isFinite(qualifiersPerGroupNum) ||
      qualifiersPerGroupNum <= 0
    ) {
      errors.push({
        field: "qualifiersPerGroup",
        message:
          "Qualifiers per group must be greater than 0",
      });
    }

    if (
      qualifiersPerGroupNum > 0 &&
      participantsPerGroupNum > 0 &&
      qualifiersPerGroupNum >= participantsPerGroupNum
    ) {
      errors.push({
        field: "qualifiersPerGroup",
        message:
          "Qualifiers per group must be less than participants per group",
      });
    }

    if (
      !Number.isFinite(groupContestsNum) ||
      groupContestsNum <= 0
    ) {
      errors.push({
        field: "groupContests",
        message:
          "Group contests must be greater than 0",
      });
    }

    // ----------------------------------------------------------
    // PLAYOFF FORMAT
    // ----------------------------------------------------------
    const supportedFormats = ["SINGLE_ELIMINATION"];

    if (!supportedFormats.includes(playoffFormat)) {
      errors.push({
        field: "playoffFormat",
        message: `Playoff format must be one of: ${supportedFormats.join(
          ", "
        )}`,
      });
    }

    // ----------------------------------------------------------
    // RETURN VALIDATION ERRORS
    // ----------------------------------------------------------
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    // ----------------------------------------------------------
    // DUPLICATE TOURNAMENT NAME
    // ----------------------------------------------------------
    const normalizedName = String(name).trim();

    const existingTournament = await Tournament.findOne({
      name: normalizedName,
    });

    if (existingTournament) {
      return res.status(409).json({
        success: false,
        message:
          "A tournament with this name already exists",
      });
    }

    // ----------------------------------------------------------
    // CREATE SLUG
    // ----------------------------------------------------------
    let slug = normalizedName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    let slugExists = await Tournament.findOne({ slug });
    let counter = 1;

    while (slugExists) {
      slug = `${slug}-${counter}`;
      slugExists = await Tournament.findOne({ slug });
      counter++;
    }

    // ----------------------------------------------------------
    // CREATE TOURNAMENT
    // ----------------------------------------------------------
    const tournament = await Tournament.create({
      name: normalizedName,
      slug,
      description: description?.trim() || "",
      registrationStart: regStart,
      registrationEnd: regEnd,
      tournamentStart: tournStart,
      tournamentEnd: tournEnd,

      maxParticipants: maxParticipantsNum,
      numberOfGroups: numberOfGroupsNum,
      participantsPerGroup: participantsPerGroupNum,
      qualifiersPerGroup: qualifiersPerGroupNum,
      groupContests: groupContestsNum,

      playoffFormat,

      status: "DRAFT",

      createdBy: getAuthenticatedUserId(req),
    });

    // ----------------------------------------------------------
    // AUDIT LOG
    // ----------------------------------------------------------
    try {
      await auditLogService.record({
        action: "TOURNAMENT_CREATED",
        description: `Created tournament ${tournament.name}`,
        admin: getAuthenticatedUserId(req),
        tournament: tournament._id,
      });
    } catch (auditError) {
      console.error(
        "Tournament audit log error:",
        auditError
      );
    }

    return res.status(201).json({
      success: true,
      message: "Tournament created successfully",
      tournament,
    });
  } catch (error) {
    console.error("Create tournament error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ============================================================
// VALIDATE TOURNAMENT UPDATE PAYLOAD
// ============================================================
const validateTournamentPayload = (
  payload,
  existingTournament = null
) => {
  const errors = [];

  // ----------------------------------------------------------
  // NAME
  // ----------------------------------------------------------
  if (payload.name !== undefined) {
    if (!payload.name || !String(payload.name).trim()) {
      errors.push({
        field: "name",
        message: "Tournament name is required",
      });
    }
  }

  // ----------------------------------------------------------
  // DATE VALIDATION
  // ----------------------------------------------------------
  if (
    payload.registrationStart !== undefined ||
    payload.registrationEnd !== undefined ||
    payload.tournamentStart !== undefined ||
    payload.tournamentEnd !== undefined
  ) {
    const regStart =
      payload.registrationStart !== undefined
        ? new Date(payload.registrationStart)
        : existingTournament
          ? new Date(existingTournament.registrationStart)
          : null;

    const regEnd =
      payload.registrationEnd !== undefined
        ? new Date(payload.registrationEnd)
        : existingTournament
          ? new Date(existingTournament.registrationEnd)
          : null;

    const tournStart =
      payload.tournamentStart !== undefined
        ? new Date(payload.tournamentStart)
        : existingTournament
          ? new Date(existingTournament.tournamentStart)
          : null;

    const tournEnd =
      payload.tournamentEnd !== undefined
        ? new Date(payload.tournamentEnd)
        : existingTournament
          ? new Date(existingTournament.tournamentEnd)
          : null;

    const regStartValid =
      regStart && !isNaN(regStart.getTime());

    const regEndValid =
      regEnd && !isNaN(regEnd.getTime());

    const tournStartValid =
      tournStart && !isNaN(tournStart.getTime());

    const tournEndValid =
      tournEnd && !isNaN(tournEnd.getTime());

    if (
      payload.registrationStart !== undefined &&
      !regStartValid
    ) {
      errors.push({
        field: "registrationStart",
        message: "Invalid registration start date",
      });
    }

    if (
      payload.registrationEnd !== undefined &&
      !regEndValid
    ) {
      errors.push({
        field: "registrationEnd",
        message: "Invalid registration end date",
      });
    }

    if (
      payload.tournamentStart !== undefined &&
      !tournStartValid
    ) {
      errors.push({
        field: "tournamentStart",
        message: "Invalid tournament start date",
      });
    }

    if (
      payload.tournamentEnd !== undefined &&
      !tournEndValid
    ) {
      errors.push({
        field: "tournamentEnd",
        message: "Invalid tournament end date",
      });
    }

    if (regStartValid && regEndValid) {
      if (regStart >= regEnd) {
        errors.push({
          field: "registrationEnd",
          message:
            "Registration end must be after registration start",
        });
      }
    }

    if (regEndValid && tournStartValid) {
      if (regEnd >= tournStart) {
        errors.push({
          field: "tournamentStart",
          message:
            "Tournament start must be after registration end",
        });
      }
    }

    if (tournStartValid && tournEndValid) {
      if (tournStart >= tournEnd) {
        errors.push({
          field: "tournamentEnd",
          message:
            "Tournament end must be after tournament start",
        });
      }
    }
  }

  // ----------------------------------------------------------
  // PARTICIPANT / GROUP VALIDATION
  // ----------------------------------------------------------
  if (
    payload.maxParticipants !== undefined ||
    payload.numberOfGroups !== undefined
  ) {
    const maxPart =
      payload.maxParticipants !== undefined
        ? Number(payload.maxParticipants)
        : Number(
          existingTournament?.maxParticipants || 20
        );

    const numGroups =
      payload.numberOfGroups !== undefined
        ? Number(payload.numberOfGroups)
        : Number(
          existingTournament?.numberOfGroups || 4
        );

    if (
      maxPart > 0 &&
      numGroups > 0 &&
      maxPart % numGroups !== 0
    ) {
      errors.push({
        field: "maxParticipants",
        message:
          "Maximum participants must be divisible by number of groups",
      });
    }
  }

  // ----------------------------------------------------------
  // QUALIFIERS VALIDATION
  // ----------------------------------------------------------
  if (
    payload.qualifiersPerGroup !== undefined ||
    payload.maxParticipants !== undefined ||
    payload.numberOfGroups !== undefined
  ) {
    const qualif =
      payload.qualifiersPerGroup !== undefined
        ? Number(payload.qualifiersPerGroup)
        : Number(
          existingTournament?.qualifiersPerGroup || 2
        );

    const maxPart =
      payload.maxParticipants !== undefined
        ? Number(payload.maxParticipants)
        : Number(
          existingTournament?.maxParticipants || 20
        );

    const numGroups =
      payload.numberOfGroups !== undefined
        ? Number(payload.numberOfGroups)
        : Number(
          existingTournament?.numberOfGroups || 4
        );

    const partPerGroup =
      numGroups > 0 ? maxPart / numGroups : 0;

    if (
      partPerGroup > 0 &&
      qualif >= partPerGroup
    ) {
      errors.push({
        field: "qualifiersPerGroup",
        message:
          "Qualifiers per group must be less than participants per group",
      });
    }
  }

  return errors;
};

// ============================================================
// UPDATE TOURNAMENT
// ============================================================
const updateTournament = async (req, res) => {
  try {
    const { tournamentId: id } = req.params;
    const tournamentId = id;

    if (!tournamentId) {
      return res.status(400).json({
        success: false,
        message: "Tournament ID is required",
      });
    }

    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
    }

    const blockedStatuses = [
      "GROUP_STAGE",
      "QUARTER_FINAL",
      "SEMI_FINAL",
      "FINAL",
      "COMPLETED",
    ];

    if (blockedStatuses.includes(tournament.status)) {
      return res.status(409).json({
        success: false,
        message: `Cannot edit tournament after ${tournament.status} has started`,
      });
    }

    const errors = validateTournamentPayload(req.body, tournament);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    // ----------------------------------------------------------
    // PARTICIPANT COUNT — only non-rejected participants count
    // ----------------------------------------------------------
    if (req.body.maxParticipants !== undefined) {
      const participantCount = await Participant.countDocuments({
        tournamentId,
        registrationStatus: { $ne: "REJECTED" },
      });

      if (Number(req.body.maxParticipants) < participantCount) {
        return res.status(409).json({
          success: false,
          message: `Cannot reduce maximum participants below current count (${participantCount})`,
        });
      }
    }

    // ----------------------------------------------------------
    // ALLOWED FIELDS
    // ----------------------------------------------------------
    const updateFields = {};

    const allowedFields = [
      "name",
      "description",
      "registrationStart",
      "registrationEnd",
      "tournamentStart",
      "tournamentEnd",
      "maxParticipants",
      "numberOfGroups",
      "qualifiersPerGroup",
      "playoffFormat",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateFields[field] = req.body[field];
      }
    });

    // ----------------------------------------------------------
    // UPDATE PARTICIPANTS PER GROUP
    // ----------------------------------------------------------
    if (
      updateFields.maxParticipants !== undefined ||
      updateFields.numberOfGroups !== undefined
    ) {
      const maxPart = Number(
        updateFields.maxParticipants !== undefined
          ? updateFields.maxParticipants
          : tournament.maxParticipants
      );

      const numGroups = Number(
        updateFields.numberOfGroups !== undefined
          ? updateFields.numberOfGroups
          : tournament.numberOfGroups
      );

      updateFields.participantsPerGroup = maxPart / numGroups;
    }

    // ----------------------------------------------------------
    // UPDATE
    // ----------------------------------------------------------
    const updated = await Tournament.findByIdAndUpdate(
      tournamentId,
      { $set: updateFields },
      { new: true }
    ).populate("createdBy", "name username");

    // ----------------------------------------------------------
    // AUDIT
    // ----------------------------------------------------------
    if (req.user) {
      await AuditLog.create({
        admin: req.user._id,
        action: "UPDATE_TOURNAMENT",
        tournament: tournamentId,
        description: `Updated tournament fields: ${Object.keys(updateFields).join(", ")}`,
        details: updateFields,
      });
    }

    return res.json({
      success: true,
      message: "Tournament updated successfully",
      tournament: updated,
    });
  } catch (error) {
    console.error("Update tournament error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ============================================================
// GET TOURNAMENTS
// ============================================================
const getTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.find()
      .lean()
      .sort({ createdAt: -1 });

    const tournamentsWithCount = await Promise.all(
      tournaments.map(async (t) => {
        const count = await Participant.countDocuments({
          tournamentId: t._id,
          registrationStatus: { $ne: "REJECTED" },
        });

        return {
          ...t,
          participantCount: count,
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: tournamentsWithCount.length,
      tournaments: tournamentsWithCount,
    });
  } catch (error) {
    console.error("Get tournaments error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

// ============================================================
// GET SINGLE TOURNAMENT
// ============================================================
const getTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(
      req.params.id
    ).lean();

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
    }

    const participantCount =
      await Participant.countDocuments({
        tournamentId: tournament._id,
      });

    return res.status(200).json({
      success: true,
      tournament: {
        ...tournament,
        participantCount,
      },
    });
  } catch (error) {
    console.error(
      "Get tournament error:",
      error
    );

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid tournament ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ============================================================
// GET MY TOURNAMENTS (current authenticated participant)
// ============================================================
const getMyTournaments = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const rows = await Participant.find({
      user: userId,
    })
      .populate("tournamentId")
      .sort({ createdAt: -1 })
      .lean();

    // Shape each row so the frontend gets:
    //   { ...participant, tournament: <populated Tournament> }
    const tournaments = rows
      .filter((r) => r.tournamentId)
      .map((r) => {
        const { tournamentId, ...participant } = r;
        return {
          ...participant,
          tournament: tournamentId,
        };
      });

    return res.status(200).json({
      success: true,
      count: tournaments.length,
      tournaments,
    });
  } catch (error) {
    console.error(
      "Get my tournaments error:",
      error
    );

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ============================================================
// GET MY STATUS (current user's participant row for a tournament)
// ============================================================
const getMyStatus = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const tournamentId =
      req.params.tournamentId || req.params.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const participant = await Participant.findOne({
      tournamentId,
      user: userId,
    })
      .populate("user", "name username email")
      .lean();

    return res.status(200).json({
      success: true,
      participant: participant || null,
    });
  } catch (error) {
    console.error(
      "Get my status error:",
      error
    );

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid tournament ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ============================================================
// JOIN TOURNAMENT
// ============================================================
const joinTournament = async (req, res) => {
  try {
    const tournamentId =
      req.params.tournamentId ||
      req.params.id;

    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (
      req.user &&
      req.user.role !== "PARTICIPANT"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only participants can join a tournament",
      });
    }

    const tournament =
      await Tournament.findById(tournamentId);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
    }

    const now = new Date();

    const registrationStart =
      tournament.registrationStart
        ? new Date(
          tournament.registrationStart
        )
        : null;

    const registrationEnd =
      tournament.registrationEnd
        ? new Date(
          tournament.registrationEnd
        )
        : null;

    const tournamentStart =
      tournament.tournamentStart
        ? new Date(
          tournament.tournamentStart
        )
        : null;

    console.log("JOIN TOURNAMENT DEBUG:", {
      tournamentId,
      now: now.toISOString(),
      registrationStart:
        registrationStart?.toISOString(),
      registrationEnd:
        registrationEnd?.toISOString(),
      tournamentStart:
        tournamentStart?.toISOString(),
      status: tournament.status,
    });

    if (
      registrationStart &&
      now < registrationStart
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Tournament registration has not started yet",
      });
    }

    if (
      registrationEnd &&
      now >= registrationEnd
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Tournament registration has ended",
      });
    }

    if (
      tournamentStart &&
      now >= tournamentStart
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Tournament has already started",
      });
    }

    const existingParticipant =
      await Participant.findOne({
        tournamentId,
        user: userId,
      });

    if (existingParticipant) {
      return res.status(409).json({
        success: false,
        message: "Already registered",
        participant: existingParticipant,
      });
    }

    const participantCount =
      await Participant.countDocuments({
        tournamentId,
      });

    const maxParticipants =
      tournament.maxParticipants || 20;

    if (
      participantCount >= maxParticipants
    ) {
      return res.status(400).json({
        success: false,
        message: "Tournament full",
      });
    }

    // ----------------------------------------------------------
    // GROUP ASSIGNMENT
    // ----------------------------------------------------------
    const totalGroups = Math.max(
      1,
      Number(
        tournament.numberOfGroups || 4
      )
    );

    const groupNames = Array.from(
      { length: totalGroups },
      (_, index) =>
        String.fromCharCode(65 + index)
    );

    const groupCounts =
      await Participant.aggregate([
        {
          $match: {
            tournamentId:
              new mongoose.Types.ObjectId(
                tournamentId
              ),
            group: {
              $exists: true,
              $ne: null,
              $ne: "",
            },
          },
        },
        {
          $group: {
            _id: "$group",
            count: {
              $sum: 1,
            },
          },
        },
      ]);

    const countsByGroup =
      Object.fromEntries(
        groupNames.map(
          (groupName) => [
            groupName,
            0,
          ]
        )
      );

    for (const entry of groupCounts) {
      countsByGroup[entry._id] =
        entry.count;
    }

    const targetCapacity = Math.max(
      1,
      Number(
        tournament.participantsPerGroup ||
        Math.ceil(
          (tournament.maxParticipants ||
            totalGroups) /
          totalGroups
        )
      )
    );

    let assignedGroup =
      groupNames.find(
        (groupName) =>
          (countsByGroup[groupName] || 0) <
          targetCapacity
      );

    if (!assignedGroup) {
      assignedGroup = groupNames
        .slice()
        .sort((left, right) => {
          const leftCount =
            countsByGroup[left] || 0;

          const rightCount =
            countsByGroup[right] || 0;

          if (
            leftCount === rightCount
          ) {
            return left.localeCompare(
              right
            );
          }

          return (
            leftCount - rightCount
          );
        })[0];
    }

    const assignedSeed =
      (countsByGroup[
        assignedGroup
      ] || 0) + 1;

    // ----------------------------------------------------------
    // CREATE PARTICIPANT
    // ----------------------------------------------------------
    const participant =
      await Participant.create({
        tournamentId,
        user: userId,
        group: assignedGroup,
        seed: assignedSeed,
        status: "ACTIVE",
        currentStage: "REGISTRATION",
      });

    const currentGroupCount =
      await Participant.distinct(
        "group",
        {
          tournamentId,
          group: {
            $ne: null,
            $ne: "",
          },
        }
      );

    const adjustedGroupCount =
      currentGroupCount.length;

    if (
      tournament.numberOfGroups !==
      adjustedGroupCount
    ) {
      tournament.numberOfGroups =
        Math.max(
          Number(
            tournament.numberOfGroups || 1
          ),
          adjustedGroupCount
        );

      await tournament.save();
    }

    return res.status(201).json({
      success: true,
      message:
        "Successfully joined tournament",

      participant,

      group: {
        number: assignedGroup,
        name: `Group ${assignedGroup}`,
      },
    });
  } catch (error) {
    console.error(
      "joinTournament error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Already registered",
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid tournament ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ============================================================
// START TOURNAMENT
// ============================================================
const startTournament = async (req, res) => {
  try {
    const tournamentId =
      req.params.tournamentId ||
      req.params.id;

    const tournament =
      await Tournament.findById(
        tournamentId
      );

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
    }

    if (
      tournament.status !==
      "REGISTRATION"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Tournament has already started",
      });
    }

    const participants =
      await Participant.find({
        tournamentId,
      }).sort({
        seed: 1,
        createdAt: 1,
      });

    const requiredParticipants =
      tournament.maxParticipants || 20;

    if (
      participants.length !==
      requiredParticipants
    ) {
      return res.status(400).json({
        success: false,
        message: `Tournament requires exactly ${requiredParticipants} participants. Currently there are ${participants.length}.`,
      });
    }

    const groupSequence =
      Array.from(
        {
          length: Math.max(
            1,
            Number(
              tournament.numberOfGroups ||
              4
            )
          ),
        },
        (_, index) =>
          String.fromCharCode(
            65 + index
          )
      );

    const sortedParticipants =
      participants.map(
        (participant, index) => {
          if (!participant.group) {
            participant.group =
              groupSequence[
              index %
              groupSequence.length
              ];
          }

          if (
            !participant.seed ||
            participant.seed < 1
          ) {
            participant.seed =
              index + 1;
          }

          participant.status = "ACTIVE";
          participant.currentStage =
            "GROUP_STAGE";

          return participant;
        }
      );

    for (const participant of
      sortedParticipants) {
      await participant.save();
    }

    tournament.status =
      "GROUP_STAGE";

    tournament.currentStage =
      "GROUP_STAGE";

    await tournament.save();

    try {
      await auditLogService.record({
        action:
          "TOURNAMENT_STARTED",

        description:
          "Started tournament and generated groups",

        admin:
          getAuthenticatedUserId(req),

        tournament:
          tournament._id,

        metadata: {
          participantCount:
            participants.length,

          groups:
            groupSequence,
        },
      });
    } catch (auditError) {
      console.error(
        "Tournament start audit error:",
        auditError
      );
    }

    return res.status(200).json({
      success: true,
      message:
        "Tournament started successfully",

      tournament,

      groups: groupSequence,
    });
  } catch (error) {
    console.error(
      "Start tournament error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ============================================================
// GET BRACKET
// ============================================================
const getBracket = async (req, res) => {
  try {
    const { tournamentId } =
      req.params;

    const bracket =
      await tournamentService.getBracket(
        tournamentId
      );

    return res.status(200).json({
      success: true,
      bracket,
    });
  } catch (error) {
    console.error(
      "Get bracket error:",
      error
    );

    if (
      error.message ===
      "Tournament not found"
    ) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
    }

    if (
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid tournament ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ============================================================
// GET LEADERBOARD
// ============================================================
const getLeaderboard = async (req, res) => {
  try {
    const tournamentId =
      req.params.tournamentId || req.params.id;

    const tournament = await Tournament.findById(tournamentId).lean();

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
    }

    // ---- 1. Every approved participant in this tournament ----
    const participants = await Participant.find({
      tournamentId,
      registrationStatus: { $ne: "REJECTED" },
    })
      .populate("user", "name username codeforcesUsername")
      .sort({ group: 1, seed: 1 })
      .lean();

    // ---- 2. All contests in this tournament (published) ------
    const Contest = require("../models/Contest");
    const contests = await Contest.find({
      tournamentId,
      published: true,
    })
      .select("_id")
      .lean();

    const contestIds = contests.map((c) => c._id);

    // ---- 3. Sum every Result per participant -----------------
    const sums = contestIds.length
      ? await Result.aggregate([
        {
          $match: {
            contestId: { $in: contestIds },
          },
        },
        {
          $group: {
            _id: "$participantId",
            solved: { $sum: "$solvedCount" },
            score: { $sum: "$points" },
            penalty: { $sum: "$penalty" },
            contestCount: { $sum: 1 },
          },
        },
      ])
      : [];

    const sumsByParticipant = new Map(
      sums.map((s) => [String(s._id), s])
    );

    // ---- 4. Build the leaderboard rows -----------------------
    const leaderboard = participants.map((participant) => {
      const s = sumsByParticipant.get(String(participant._id));

      return {
        participantId: participant._id,
        username:
          participant.user?.username ||
          participant.user?.name ||
          "Unknown",
        name: participant.user?.name,
        codeforcesUsername: participant.user?.codeforcesUsername || "",
        group: participant.group || null,
        seed: participant.seed || 9999,
        groupRank: null,
        currentStage: participant.currentStage || null,
        status: participant.status || null,
        rank: null,

        // ---- Aggregated across all contests ----
        solved: s?.solved ?? 0,
        score: s?.score ?? 0,
        penalty: s?.penalty ?? 0,
        contestCount: s?.contestCount ?? 0,

        winRate: participant.status === "CHAMPION" ? 100 : null,
      };
    });

    // ---- 5. Group ranks --------------------------------------
    const grouped = {};
    for (const entry of leaderboard) {
      if (!entry.group) continue;
      (grouped[entry.group] ||= []).push(entry);
    }

    for (const entries of Object.values(grouped)) {
      entries.sort((a, b) => {
        if (a.score !== b.score) return b.score - a.score;
        if (a.solved !== b.solved) return b.solved - a.solved;
        if (a.penalty !== b.penalty) return a.penalty - b.penalty;
        return (a.seed || 9999) - (b.seed || 9999);
      });
      entries.forEach((entry, index) => {
        entry.groupRank = index + 1;
      });
    }

    // ---- 6. Global sort + rank -------------------------------
    leaderboard.sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      if (a.solved !== b.solved) return b.solved - a.solved;
      if (a.penalty !== b.penalty) return a.penalty - b.penalty;
      return (a.seed || 9999) - (b.seed || 9999);
    });

    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return res.status(200).json({
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
    console.error("Tournament leaderboard error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid tournament ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ============================================================
// ADVANCE GROUP STAGE
// ============================================================
const advanceGroupStage = async (
  req,
  res
) => {
  try {
    const tournamentId =
      req.params.tournamentId ||
      req.params.id;

    // NEW — idempotent guard for completed tournaments
    const existing = await Tournament.findById(tournamentId).lean();
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
    }
    if (existing.status === "COMPLETED") {
      return res.status(200).json({
        success: true,
        message: "Tournament is already completed",
      });
    }

    const advancing =
      await advancementService.advanceGroupStage(
        tournamentId
      );

    await auditLogService.record({
      action:
        "GROUP_STAGE_ADVANCED",

      description:
        "Advanced group-stage qualifiers to quarter finals",

      admin:
        getAuthenticatedUserId(req),

      tournament:
        tournamentId,
    });

    return res.status(200).json({
      success: true,
      message:
        "Advanced to Quarter Finals",
      advancing,
    });
  } catch (error) {
    console.error(
      "Advance group stage error:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ADVANCE QUARTER FINAL
// ============================================================
const advanceQuarterFinal = async (
  req,
  res
) => {
  try {
    const tournamentId =
      req.params.tournamentId ||
      req.params.id;

    // NEW — idempotent guard
    const existing = await Tournament.findById(tournamentId).lean();
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
    }
    if (existing.status === "COMPLETED") {
      return res.status(200).json({
        success: true,
        message: "Tournament is already completed",
      });
    }

    const advancing =
      await advancementService.advanceQuarterFinal(
        tournamentId
      );

    await auditLogService.record({
      action:
        "QUARTER_FINAL_ADVANCED",

      description:
        "Advanced quarter-final winners to semi finals",

      admin:
        getAuthenticatedUserId(req),

      tournament:
        tournamentId,
    });

    return res.status(200).json({
      success: true,
      message:
        "Advanced to Semi Finals",
      advancing,
    });
  } catch (error) {
    console.error(
      "Advance quarter final error:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ADVANCE SEMI FINAL
// ============================================================
const advanceSemiFinal = async (
  req,
  res
) => {
  try {
    const tournamentId =
      req.params.tournamentId ||
      req.params.id;

    // NEW — idempotent guard
    const existing = await Tournament.findById(tournamentId).lean();
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
    }
    if (existing.status === "COMPLETED") {
      return res.status(200).json({
        success: true,
        message: "Tournament is already completed",
      });
    }

    const advancing =
      await advancementService.advanceSemiFinal(
        tournamentId
      );

    await auditLogService.record({
      action:
        "SEMI_FINAL_ADVANCED",

      description:
        "Advanced semi-final winners to the final",

      admin:
        getAuthenticatedUserId(req),

      tournament:
        tournamentId,
    });

    return res.status(200).json({
      success: true,
      message:
        "Advanced to Final",
      advancing,
    });
  } catch (error) {
    console.error(
      "Advance semi final error:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// COMPLETE TOURNAMENT
// ============================================================
const completeTournament = async (
  req,
  res
) => {
  try {
    const tournamentId =
      req.params.tournamentId ||
      req.params.id;

    // NEW — idempotent: if already completed, respond 200 instead of 400
    const existing = await Tournament.findById(tournamentId).lean();
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
    }
    if (existing.status === "COMPLETED") {
      return res.status(200).json({
        success: true,
        message: "Tournament is already completed",
        winnerId: null,
      });
    }

    const winnerId =
      await advancementService.completeTournament(
        tournamentId
      );

    await auditLogService.record({
      action:
        "TOURNAMENT_COMPLETED",

      description:
        "Completed tournament and crowned champion",

      admin:
        getAuthenticatedUserId(req),

      tournament:
        tournamentId,

      metadata: {
        champion: winnerId,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Tournament completed",
      winnerId,
    });
  } catch (error) {
    console.error(
      "Complete tournament error:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ADVANCE STAGE
// ============================================================
const advanceStage = async (
  req,
  res
) => {
  const stage = String(
    req.body.stage || ""
  )
    .trim()
    .toLowerCase();

  try {
    // NEW — read tournament once; short-circuit if already completed
    const tournamentId =
      req.params.tournamentId || req.params.id;

    const tournament = await Tournament.findById(tournamentId).lean();
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
    }
    if (tournament.status === "COMPLETED") {
      return res.status(200).json({
        success: true,
        message: "Tournament is already completed",
        status: tournament.status,
        currentStage: tournament.currentStage,
      });
    }

    switch (stage) {
      case "group-stage":
      case "group_stage":
      case "groups":
      case "group":
        return await advanceGroupStage(
          req,
          res
        );

      case "qf":
      case "quarter-final":
      case "quarter_final":
      case "quarterfinal":
        return await advanceQuarterFinal(
          req,
          res
        );

      case "sf":
      case "semi-final":
      case "semi_final":
      case "semifinal":
        return await advanceSemiFinal(
          req,
          res
        );

      case "complete":
      case "final":
      case "champion":
        return await completeTournament(
          req,
          res
        );

      default:
        return res.status(400).json({
          success: false,
          message:
            "Invalid stage. Supported: group-stage, qf, sf, complete",
        });
    }
  } catch (error) {
    console.error(
      "Advance stage error:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// GET PARTICIPANTS
// ============================================================
const getParticipants = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
    }

    const participants = await Participant.find({
      tournamentId,
    })
      .populate("user", "name username email codeforcesUsername")
      .sort({ group: 1, seed: 1 });

    // Effective count = everyone who still occupies a slot
    const activeCount = participants.filter(
      (p) => p.registrationStatus !== "REJECTED"
    ).length;

    return res.status(200).json({
      success: true,
      count: participants.length,          // total rows (for admin list)
      activeCount,                         // excludes rejected — use this for "X/max" displays
      maxParticipants: tournament.maxParticipants || 20,
      participants,
    });
  } catch (error) {
    console.error("Get participants error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid tournament ID",
      });
    }

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
  createTournament,
  updateTournament,
  getTournaments,
  getTournament,
  getMyTournaments,   // ← new
  getMyStatus,        // ← new
  joinTournament,
  startTournament,
  getBracket,
  getLeaderboard,
  advanceGroupStage,
  advanceQuarterFinal,
  advanceSemiFinal,
  completeTournament,
  advanceStage,
  advanceTournament: advanceStage,
  getParticipants,
};