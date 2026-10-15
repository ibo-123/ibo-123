import { Router } from 'express';
import { placeBid, updateBidStatus } from '../controllers/bidController';
import { authenticateToken } from '../middleware/auth';
import { authorizeRoles } from '../middleware/rbac';

const router = Router();

router.use(authenticateToken);

// Drivers and Fleet Owners can place bids
router.post(
  '/',
  authorizeRoles('DRIVER', 'FLEET_OWNER', 'ADMIN'),
  placeBid
);

// Shippers and Admins can accept or reject bids
router.patch(
  '/:id/status',
  authorizeRoles('SHIPPER', 'ADMIN'),
  updateBidStatus
);

export default router;
