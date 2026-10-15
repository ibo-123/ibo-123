const express = require('express');
const { body, param } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createReview, getReviewsByJob, getReviewsByUser, getMyReviews } = require('../controllers/reviewController');
const router = express.Router();

router.post(
  '/',
  auth,
  body('jobId').isMongoId().withMessage('Valid job ID is required'),
  body('revieweeId').isMongoId().withMessage('Valid reviewee ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim(),
  validate,
  createReview
);
router.get('/job/:jobId', auth, param('jobId').isMongoId().withMessage('Valid job ID is required'), validate, getReviewsByJob);
router.get('/user/:userId', auth, param('userId').isMongoId().withMessage('Valid user ID is required'), validate, getReviewsByUser);
router.get('/user', auth, getMyReviews);

module.exports = router;
