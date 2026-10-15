const express = require('express');
const router = express.Router();
const invitationController = require('../controllers/invitationController');
const { authenticate, authorize } = require('../middleware/auth');

// Admin routes
router.post(
  '/admin/contests/:contestId/invitations',
  authenticate,
  authorize('ADMIN'),
  invitationController.createInvitations
);

// Participant routes
router.get(
  '/my/invitations',
  authenticate,
  invitationController.getMyInvitations
);

router.patch(
  '/invitations/:invitationId',
  authenticate,
  invitationController.respondToInvitation
);

module.exports = router;