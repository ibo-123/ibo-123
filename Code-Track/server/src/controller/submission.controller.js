import Submission from "../models/SubmissionModel.js";

export const getRecentSubmissions = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const submissions = await Submission.find({ userId: req.user.id })
      .sort({ creationTimeSeconds: -1 })
      .limit(limit);

    return res.status(200).json({
      success: true,
      submissions,
    });
  } catch (error) {
    console.error("Get recent submissions error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recent submissions",
    });
  }
};
