const express = require('express');
const { listTopics } = require('../controllers/topicController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);
router.get('/', listTopics);

module.exports = router;
