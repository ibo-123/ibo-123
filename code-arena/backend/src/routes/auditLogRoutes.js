const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/admin/audit-logs', authenticate, authorize('ADMIN'), auditLogController.getAuditLogs);

module.exports = router;
