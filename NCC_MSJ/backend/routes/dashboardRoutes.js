const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getAdminDashboard,
  getUserDashboard,
  getSystemOverview
} = require('../controllers/dashboard.controller');

// All routes are protected
router.use(protect);

// @route   GET /api/dashboard/admin
// @desc    Get admin dashboard statistics
// @access  Private/Admin
router.get('/admin', authorize('admin'), getAdminDashboard);

// @route   GET /api/dashboard/user
// @desc    Get user dashboard statistics
// @access  Private
router.get('/user', getUserDashboard);

// @route   GET /api/dashboard/overview
// @desc    Get system overview
// @access  Private/Admin
router.get('/overview', authorize('admin'), getSystemOverview);

module.exports = router;