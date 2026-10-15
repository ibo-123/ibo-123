const express = require('express');
const { body, param } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createPayment, markPaid } = require('../controllers/paymentController');
const router = express.Router();

router.post(
  '/',
  auth,
  [
    body('jobId').isMongoId().withMessage('Valid job ID is required'),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than zero')
  ],
  validate,
  createPayment
);
router.put('/:id/pay', auth, [param('id').isMongoId().withMessage('Valid payment ID is required')], validate, markPaid);

module.exports = router;
