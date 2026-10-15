import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { authorizeRoles } from '../middleware/rbac';
import {
  createLoad,
  listLoads,
  searchNearbyLoads,
  getLoadDetails,
  updateLoadStatus,
  deleteLoad,
  getShipperLoads,
  getShipperStats,
} from '../controllers/loadController';

const router = Router();

// All load endpoints require valid JWT authentication
router.use(authenticateToken);

// Shipper-specific routes (protected by role)
router.get('/shipper', authorizeRoles('SHIPPER', 'ADMIN'), getShipperLoads);
router.get('/shipper/stats', authorizeRoles('SHIPPER', 'ADMIN'), getShipperStats);

// Existing routes remain unchanged
router.get('/nearby', searchNearbyLoads);
router.get('/', listLoads);
router.post('/', authorizeRoles('SHIPPER', 'ADMIN'), createLoad);
router.get('/:id', getLoadDetails);
router.patch('/:id/status', authorizeRoles('SHIPPER', 'ADMIN'), updateLoadStatus);
router.delete('/:id', authorizeRoles('SHIPPER', 'ADMIN'), deleteLoad);

export default router;
