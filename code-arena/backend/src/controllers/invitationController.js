const Invitation = require("../models/Invitation");
const Contest = require("../models/Contest");
const Participant = require("../models/Participant");
const AuditLog = require("../models/AuditLog");
const mongoose = require("mongoose");

const createInvitations = async (req, res) => {
  try {
    const { contestId } = req.params;
    const { participantIds } = req.body;

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one participant ID is required",
      });
    }

    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({
        success: false,
        message: "Contest not found",
      });
    }

    const invitations = [];
    const errors = [];

    for (const participantId of participantIds) {
      try {
        const participant = await Participant.findOne({
          _id: participantId,
          tournamentId: contest.tournamentId,
          registrationStatus: "APPROVED",
        });

        if (!participant) {
          errors.push({
            participantId,
            error: "Participant not found or not approved",
          });
          continue;
        }

        const existingInvitation = await Invitation.findOne({
          contestId,
          participantId,
        });

        if (existingInvitation) {
          errors.push({
            participantId,
            error: `Already invited (status: ${existingInvitation.status})`,
          });
          continue;
        }

        const invitation = await Invitation.create({
          contestId,
          tournamentId: contest.tournamentId,
          participantId,
          invitedBy: req.user._id,
          status: "PENDING",
        });

        invitations.push(invitation);
      } catch (error) {
        errors.push({
          participantId,
          error: error.message,
        });
      }
    }

    if (invitations.length > 0) {
      await AuditLog.create({
        action: "INVITATIONS_SENT",
        description: `Sent ${invitations.length} invitations for contest ${contest.codeforcesContestName}`,
        admin: req.user._id,
        tournament: contest.tournamentId,
      });
    }

    return res.json({
      success: true,
      message: `Created ${invitations.length} invitations`,
      invitations,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("createInvitations error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getMyInvitations = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const { status } = req.query;

    const participants = await Participant.find({
      user: userId,
    });

    const participantIds = participants.map(p => p._id);

    const filter = {
      participantId: { $in: participantIds },
    };

    if (status) {
      filter.status = status;
    }

    const invitations = await Invitation.find(filter)
      .populate("contestId", "codeforcesContestName codeforcesUrl stage startTime durationSeconds status")
      .populate("participantId", "group seed")
      .populate("invitedBy", "name username")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: invitations.length,
      invitations,
    });
  } catch (error) {
    console.error("getMyInvitations error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const respondToInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { status } = req.body;

    if (!status || !["ACCEPTED", "DECLINED"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be ACCEPTED or DECLINED",
      });
    }

    const userId = req.user.userId || req.user._id;

    const invitation = await Invitation.findById(invitationId)
      .populate("participantId");

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: "Invitation not found",
      });
    }

    // Verify the invitation belongs to this user
    const participant = await Participant.findOne({
      _id: invitation.participantId._id,
      user: userId,
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to respond to this invitation",
      });
    }

    if (invitation.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Invitation is already ${invitation.status.toLowerCase()}`,
      });
    }

    invitation.status = status;
    invitation.respondedAt = new Date();
    await invitation.save();

    return res.json({
      success: true,
      message: `Invitation ${status.toLowerCase()}`,
      invitation,
    });
  } catch (error) {
    console.error("respondToInvitation error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  createInvitations,
  getMyInvitations,
  respondToInvitation,
};