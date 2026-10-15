const express = require('express');
const { body } = require('express-validator');
const { createService, getServices, getUserServices } = require('../controllers/serviceController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const router = express.Router();

router.post(
  '/',
  auth,
  [
    body('title').trim().notEmpty().withMessage('Service title is required'),
    body('description').trim().notEmpty().withMessage('Service description is required'),
    body('price').isFloat({ gt: 0 }).withMessage('Service price must be greater than zero')
  ],
  validate,
  createService
);
router.get('/', getServices);
router.get('/user', auth, getUserServices);

module.exports = router;