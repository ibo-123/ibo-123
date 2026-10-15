const express = require('express');
const {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getPreferences,
  updatePreferences,
} = require('../controllers/notificationController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);
router.get('/', listNotifications);
router.get('/preferences', getPreferences);
router.patch('/preferences', updatePreferences);
router.patch('/read-all', markAllNotificationsRead);
router.patch('/:id/read', markNotificationRead);

module.exports = router;
