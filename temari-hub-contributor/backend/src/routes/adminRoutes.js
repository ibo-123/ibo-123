const express = require('express');
const { listActivity } = require('../controllers/activityController');
const { adminDashboard } = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate, authorize('ADMIN'));
router.get('/dashboard', adminDashboard);
router.get('/activity', listActivity);

module.exports = router;
