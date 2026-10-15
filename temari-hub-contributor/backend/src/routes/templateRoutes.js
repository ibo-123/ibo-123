const express = require('express');
const {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  updateTemplateStatus,
} = require('../controllers/templateController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/', listTemplates);
router.post('/', createTemplate);
router.get('/:id', getTemplate);
router.put('/:id', updateTemplate);
router.patch('/:id/status', updateTemplateStatus);

module.exports = router;
