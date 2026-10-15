const express = require('express');
const { body, param } = require('express-validator');
const { createJob, getJobs, getUserJobs, getJobById, updateJob, deleteJob } = require('../controllers/jobController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const router = express.Router();

router.post(
  '/',
  auth,
  [
    body('title').trim().notEmpty().withMessage('Job title is required'),
    body('description').trim().notEmpty().withMessage('Job description is required'),
    body('budget').isFloat({ gt: 0 }).withMessage('Budget must be greater than zero'),
    body('deadline').optional().isISO8601().toDate().withMessage('Deadline must be a valid date')
  ],
  validate,
  createJob
);
router.get('/', getJobs);
router.get('/user', auth, getUserJobs);
router.get('/:id', getJobById);

module.exports = router;