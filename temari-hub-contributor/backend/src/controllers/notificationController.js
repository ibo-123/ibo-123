const asyncHandler = require('../utils/asyncHandler');
const notificationService = require('../services/notificationService');

const listNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.listForUser(req.user);
  res.json({ success: true, data: result });
});

const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markRead(req.user, req.params.id);
  res.json({ success: true, data: { notification } });
});

const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllRead(req.user);
  res.json({ success: true, data: result });
});

const getPreferences = asyncHandler(async (req, res) => {
  const preferences = await notificationService.getPreferences(req.user);
  res.json({ success: true, data: { preferences } });
});

const updatePreferences = asyncHandler(async (req, res) => {
  const preferences = await notificationService.updatePreferences(req.user, req.body);
  res.json({ success: true, data: { preferences } });
});

module.exports = {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getPreferences,
  updatePreferences,
};
