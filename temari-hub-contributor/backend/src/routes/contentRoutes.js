const express = require('express');
const { listContentReady, exportContentReady } = require('../controllers/submissionController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate, authorize('ADMIN'));
router.get('/export', exportContentReady);
router.get('/', listContentReady);

module.exports = router;
