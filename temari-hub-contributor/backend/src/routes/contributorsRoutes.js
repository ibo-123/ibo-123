const express = require('express');
const {
  listContributors,
  getContributor,
  createContributor,
  updateContributor,
  updateContributorStatus,
  updateContributorVerification,
} = require('../controllers/contributorController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/', listContributors);
router.post('/', createContributor);
router.get('/:id', getContributor);
router.put('/:id', updateContributor);
router.patch('/:id/status', updateContributorStatus);
router.patch('/:id/verification', updateContributorVerification);

module.exports = router;
