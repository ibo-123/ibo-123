const express = require('express');
const {
  updateSubmission,
  submitSubmission,
  createTopicResource,
  updateTopicResource,
  reorderFiles,
  addFiles,
  removeFile,
  downloadFile,
  listSubmissions,
  getSubmission,
  startReview,
  reviewSubmission,
  resubmitSubmission,
  markContentReady,
  exportSubmission,
} = require('../controllers/submissionController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/', authenticate, authorize('ADMIN'), listSubmissions);
router.post('/topic-resource', authenticate, authorize('CONTRIBUTOR'), upload.array('files'), createTopicResource);
router.get('/:id/files/:fileId', authenticate, authorize('ADMIN', 'CONTRIBUTOR'), downloadFile);
router.get('/:id/export', authenticate, authorize('ADMIN'), exportSubmission);
router.get('/:id', authenticate, authorize('ADMIN', 'CONTRIBUTOR'), getSubmission);
router.put('/:id/topic-resource', authenticate, authorize('CONTRIBUTOR'), upload.array('files'), updateTopicResource);
router.post('/:id/reorder-files', authenticate, authorize('CONTRIBUTOR'), reorderFiles);
router.put('/:id', authenticate, authorize('CONTRIBUTOR'), updateSubmission);
router.post('/:id/submit', authenticate, authorize('CONTRIBUTOR'), submitSubmission);
router.post('/:id/resubmit', authenticate, authorize('CONTRIBUTOR'), resubmitSubmission);
router.post('/:id/review/start', authenticate, authorize('ADMIN'), startReview);
router.post('/:id/review', authenticate, authorize('ADMIN'), reviewSubmission);
router.post('/:id/content-ready', authenticate, authorize('ADMIN'), markContentReady);
router.post('/:id/files', authenticate, authorize('CONTRIBUTOR'), upload.array('files'), addFiles);
router.delete('/:id/files/:fileId', authenticate, authorize('CONTRIBUTOR'), removeFile);

module.exports = router;
