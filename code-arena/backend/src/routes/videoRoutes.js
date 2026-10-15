const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoSubmissionController');
const { authenticate, authorize } = require('../middleware/auth');

// Participant routes
router.post(
  '/contests/:contestId/video-submission',
  authenticate,
  videoController.submitVideo
);

router.get(
  '/contests/:contestId/video-submission',
  authenticate,
  videoController.getMyVideoSubmission
);

// Admin routes
router.get(
  '/admin/contests/:contestId/video-submissions',
  authenticate,
  authorize('ADMIN'),
  videoController.getVideoSubmissions
);

router.patch(
  '/admin/video-submissions/:submissionId/approve',
  authenticate,
  authorize('ADMIN'),
  videoController.approveVideo
);

router.patch(
  '/admin/video-submissions/:submissionId/reject',
  authenticate,
  authorize('ADMIN'),
  videoController.rejectVideo
);

module.exports = router;