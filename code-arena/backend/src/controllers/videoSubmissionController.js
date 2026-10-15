const VideoSubmission = require("../models/VideoSubmission");
const Contest = require("../models/Contest");
const Participant = require("../models/Participant");
const AuditLog = require("../models/AuditLog");
const mongoose = require("mongoose");

// ============================================
// PARTICIPANT — SUBMIT VIDEO
// ============================================
const submitVideo = async (req, res) => {
  try {
    const { contestId } = req.params;
    const { videoUrl, note } = req.body || {};
    const userId = req.user.userId || req.user._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(contestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contest ID",
      });
    }

    if (!videoUrl || typeof videoUrl !== "string" || !videoUrl.trim()) {
      return res.status(400).json({
        success: false,
        message: "Video URL is required",
      });
    }

    // Basic URL validation
    try {
      const parsed = new URL(videoUrl);
      if (!/^https?:$/.test(parsed.protocol)) throw new Error("bad protocol");
    } catch {
      return res.status(400).json({
        success: false,
        message: "Video URL must be a valid http(s) URL",
      });
    }

    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({
        success: false,
        message: "Contest not found",
      });
    }

    // ----------------------------------------------------------
    // Only allow submissions after the contest ends
    // ----------------------------------------------------------
    if (contest.startTime && contest.durationSeconds) {
      const endTime = new Date(
        new Date(contest.startTime).getTime() + contest.durationSeconds * 1000
      );
      const now = new Date();

      if (now < endTime) {
        return res.status(400).json({
          success: false,
          message:
            "Contest is still ongoing. Video submission is only allowed after the contest ends.",
        });
      }
    }

    // ----------------------------------------------------------
    // Participant must be APPROVED for this specific tournament
    // ----------------------------------------------------------
    const participant = await Participant.findOne({
      tournamentId: contest.tournamentId,
      user: userId,
      registrationStatus: "APPROVED",
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: "You are not an approved participant for this tournament",
      });
    }

    // ----------------------------------------------------------
    // Existing submission logic
    // ----------------------------------------------------------
    const existingSubmission = await VideoSubmission.findOne({
      contestId,
      participantId: participant._id,
    });

    // If a submission exists and is NOT rejected, block.
    // If it WAS rejected, allow resubmission by updating in place.
    if (existingSubmission && existingSubmission.status !== "REJECTED") {
      return res.status(409).json({
        success: false,
        message: "You have already submitted a video for this contest",
        submission: existingSubmission,
      });
    }

    let submission;

    if (existingSubmission) {
      // Resubmission after rejection — reset the review fields
      existingSubmission.videoUrl = videoUrl.trim();
      existingSubmission.note = (note || "").trim();
      existingSubmission.status = "PENDING";
      existingSubmission.rejectionReason = undefined;
      existingSubmission.reviewedAt = undefined;
      existingSubmission.reviewedBy = undefined;
      submission = await existingSubmission.save();
    } else {
      submission = await VideoSubmission.create({
        contestId,
        tournamentId: contest.tournamentId,
        participantId: participant._id,
        videoUrl: videoUrl.trim(),
        note: (note || "").trim(),
        status: "PENDING",
      });
    }

    return res.status(201).json({
      success: true,
      message: existingSubmission
        ? "Video resubmitted successfully. Awaiting admin review."
        : "Video submitted successfully. Awaiting admin review.",
      submission,
    });
  } catch (error) {
    console.error("submitVideo error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ============================================
// PARTICIPANT — GET MY SUBMISSION
// ============================================
// Returns:
//   200 { success: true, submission: {...} }      if a submission exists
//   200 { success: true, submission: null }        if not submitted yet
//   404 { success: false, message }                only if the contest doesn't exist
// ============================================
const getMyVideoSubmission = async (req, res) => {
  try {
    const { contestId } = req.params;
    const userId = req.user.userId || req.user._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(contestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contest ID",
      });
    }

    // Fetch contest first so we can scope the participant lookup
    const contest = await Contest.findById(contestId).lean();
    if (!contest) {
      return res.status(404).json({
        success: false,
        message: "Contest not found",
      });
    }

    // Find the participant for THIS tournament (not just any)
    const participant = await Participant.findOne({
      user: userId,
      tournamentId: contest.tournamentId,
    }).lean();

    if (!participant) {
      // Not registered → no submission possible yet, but not an error
      return res.json({
        success: true,
        submission: null,
      });
    }

    const submission = await VideoSubmission.findOne({
      contestId,
      participantId: participant._id,
    }).lean();

    return res.json({
      success: true,
      submission: submission || null,
    });
  } catch (error) {
    console.error("getMyVideoSubmission error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ============================================
// ADMIN — LIST SUBMISSIONS FOR A CONTEST
// ============================================
const getVideoSubmissions = async (req, res) => {
  try {
    const { contestId } = req.params;
    const { status } = req.query;

    const filter = { contestId };
    if (status) {
      filter.status = status;
    }

    const submissions = await VideoSubmission.find(filter)
      .populate({
        path: "participantId",
        select: "group seed user",
        populate: {
          path: "user",
          select: "name username codeforcesUsername",
        },
      })
      .populate("reviewedBy", "name username")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: submissions.length,
      submissions,
    });
  } catch (error) {
    console.error("getVideoSubmissions error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ============================================
// ADMIN — APPROVE
// ============================================
const approveVideo = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const submission = await VideoSubmission.findById(submissionId).populate(
      "participantId"
    );

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    if (submission.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Submission is already ${submission.status.toLowerCase()}`,
      });
    }

    submission.status = "APPROVED";
    submission.reviewedBy = req.user.userId || req.user._id;
    submission.reviewedAt = new Date();
    await submission.save();

    await AuditLog.create({
      action: "VIDEO_APPROVED",
      description: `Video submission ${submissionId} approved`,
      admin: req.user.userId || req.user._id,
      tournament: submission.tournamentId,
      details: {
        contestId: submission.contestId,
        participantId:
          submission.participantId?._id || submission.participantId,
      },
    });

    return res.json({
      success: true,
      message: "Video approved successfully",
      submission,
    });
  } catch (error) {
    console.error("approveVideo error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================================
// ADMIN — REJECT
// ============================================
const rejectVideo = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { reason } = req.body || {};

    const submission = await VideoSubmission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    if (submission.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Submission is already ${submission.status.toLowerCase()}`,
      });
    }

    submission.status = "REJECTED";
    submission.reviewedBy = req.user.userId || req.user._id;
    submission.reviewedAt = new Date();
    submission.rejectionReason = reason || "No reason provided";
    await submission.save();

    await AuditLog.create({
      action: "VIDEO_REJECTED",
      description: `Video submission ${submissionId} rejected${reason ? ` — ${reason}` : ""}`,
      admin: req.user.userId || req.user._id,
      tournament: submission.tournamentId,
      details: {
        reason: submission.rejectionReason,
        contestId: submission.contestId,
      },
    });

    return res.json({
      success: true,
      message: "Video rejected",
      submission,
    });
  } catch (error) {
    console.error("rejectVideo error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  submitVideo,
  getMyVideoSubmission,
  getVideoSubmissions,
  approveVideo,
  rejectVideo,
};  