const express = require('express');
const {
  listJobs,
  getJob,
  createJob,
  updateJob,
  cancelJob,
} = require('../controllers/jobController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/', listJobs);
router.post('/', createJob);
router.get('/:id', getJob);
router.put('/:id', updateJob);
router.patch('/:id/cancel', cancelJob);

module.exports = router;
