const express = require('express');
const { body, param } = require('express-validator');
const { sendMessage, getConversation, getMessages } = require('../controllers/messageController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const router = express.Router();

router.post(
  '/',
  auth,
  [
    body('receiverId').isMongoId().withMessage('Valid receiver ID is required'),
    body('content').trim().notEmpty().withMessage('Message content is required')
  ],
  validate,
  sendMessage
);
router.get('/conversation/:peerId', auth, [param('peerId').isMongoId().withMessage('Valid peer ID is required')], validate, getConversation);
router.get('/', auth, getMessages);

module.exports = router;