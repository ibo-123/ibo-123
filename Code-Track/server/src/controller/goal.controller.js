import Goal from "../models/GoalModel.js";

export const getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, goals });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createGoal = async (req, res) => {
  try {
    const { title, targetType, targetValue, deadline } = req.body;
    const goal = new Goal({
      userId: req.user.id,
      title,
      targetType,
      targetValue,
      deadline
    });
    await goal.save();
    return res.status(201).json({ success: true, goal });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentValue, isCompleted } = req.body;
    
    const goal = await Goal.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { $set: { currentValue, isCompleted } },
      { new: true }
    );
    
    if (!goal) return res.status(404).json({ success: false, message: "Goal not found" });
    return res.status(200).json({ success: true, goal });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const goal = await Goal.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!goal) return res.status(404).json({ success: false, message: "Goal not found" });
    return res.status(200).json({ success: true, message: "Goal deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
