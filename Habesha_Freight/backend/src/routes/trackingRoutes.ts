import { Router } from 'express';
import {
  recordLocationPoint,
  getShipmentTracking,
} from '../controllers/trackingController';
import { authenticateToken } from '../middleware/auth';
import { authorizeRoles } from '../middleware/rbac';

const router = Router();

router.use(authenticateToken);

router.post(
  '/location',
  authorizeRoles('DRIVER', 'ADMIN'),
  recordLocationPoint
);
router.get('/:shipment_id', getShipmentTracking);

export default router;
