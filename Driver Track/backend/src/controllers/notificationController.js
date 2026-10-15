import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import Notification from "../model/Notification.js";

/** GET /api/notifications - the authenticated user's own notifications. */
export const listMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: notifications.length, data: notifications });
});

/** PATCH /api/notifications/:id/read */
export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { read: true },
    { new: true }
  );
  if (!notification) throw new ApiError(404, "Notification not found.");
  res.status(200).json({ success: true, data: notification });
});

export default { listMyNotifications, markAsRead };
