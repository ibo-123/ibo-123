import { Router } from 'express';
import {
  registerVehicle,
  listVehicles,
  searchNearbyVehicles,
  getVehicleDetails,
  updateVehicle,
  deleteVehicle,
} from '../controllers/vehicleController';
import { authenticateToken } from '../middleware/auth';
import { authorizeRoles } from '../middleware/rbac';

const router = Router();

// All Vehicle endpoints require JWT Authentication
router.use(authenticateToken);

// Nearby vehicle spatial search (Drivers, Fleet Owners, Admins)
router.get(
  '/nearby',
  authorizeRoles('DRIVER', 'FLEET_OWNER', 'ADMIN'),
  searchNearbyVehicles
);

// Drivers, Fleet Owners, and Admins can register and manage vehicles
router.post(
  '/',
  authorizeRoles('DRIVER', 'FLEET_OWNER', 'ADMIN'),
  registerVehicle
);
router.get('/', listVehicles);
router.get('/:id', getVehicleDetails);
router.patch(
  '/:id',
  authorizeRoles('DRIVER', 'FLEET_OWNER', 'ADMIN'),
  updateVehicle
);
router.delete(
  '/:id',
  authorizeRoles('DRIVER', 'FLEET_OWNER', 'ADMIN'),
  deleteVehicle
);

export default router;