const express = require('express');
const { body, param } = require('express-validator');
const { createProposal, getProposalsByJob, updateProposalStatus, getProposalsByUser } = require('../controllers/proposalController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const router = express.Router();

router.post(
  '/',
  auth,
  [
    body('jobId').isMongoId().withMessage('Valid job ID is required'),
    body('proposalText').trim().notEmpty().withMessage('Proposal text is required'),
    body('proposedPrice').isFloat({ gt: 0 }).withMessage('Proposed price must be greater than zero')
  ],
  validate,
  createProposal
);
router.put(
  '/:id',
  auth,
  param('id').isMongoId().withMessage('Valid proposal ID is required'),
  body('status').isIn(['accepted', 'rejected']).withMessage('Status must be accepted or rejected'),
  validate,
  updateProposalStatus
);
router.get('/job/:jobId', auth, param('jobId').isMongoId().withMessage('Valid job ID is required'), validate, getProposalsByJob);
router.get('/user', auth, getProposalsByUser);

module.exports = router;