const express = require('express');
const { contributorDashboard } = require('../controllers/dashboardController');
const { listMyJobs, getMyJob } = require('../controllers/jobController');
const {
  getMySubmission,
  createSubmission,
  listMySubmissions,
} = require('../controllers/submissionController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate, authorize('CONTRIBUTOR'));
router.get('/dashboard', contributorDashboard);
router.get('/jobs', listMyJobs);
router.get('/jobs/:jobId/submission', getMySubmission);
router.post('/jobs/:jobId/submission', createSubmission);
router.get('/jobs/:id', getMyJob);
router.get('/submissions', listMySubmissions);

module.exports = router;
