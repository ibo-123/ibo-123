import Achievement from "../models/AchievementModel.js";

export const getAchievements = async (req, res) => {
  try {
    const achievements = await Achievement.find({ userId: req.user.id }).sort({ unlockedAt: -1 });
    return res.status(200).json({ success: true, achievements });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
