import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { authorizeRoles } from '../middleware/rbac';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

import {
  getCompanyProfile,
  updateCompanyProfile,
  uploadCompanyLogo,
  removeCompanyLogo,
  getCompanyStats,
  getCompanyFleetRequests,
  getCompanyFleetRequest,
  acceptFleetRequest,
  declineFleetRequest,
  assignDriverToFleetRequest,
  getCompanyDeliveries,
  getCompanyDelivery,
  getCompanyVehicles,
  createCompanyVehicle,
  updateCompanyVehicle,
  updateCompanyVehicleStatus,
  assignDriverToVehicle,
  unassignDriverFromVehicle,
  getCompanyDrivers,
  createCompanyDriver,
  getCompanyDriverDetails,
  updateCompanyDriverAssignment,
  removeCompanyDriver,
} from '../controllers/companyController';

const router = Router();

// All company routes require authentication
router.use(authenticateToken);
router.use(authorizeRoles('FLEET_OWNER'));

// Profile Management
router.get('/profile', getCompanyProfile);
router.put('/profile', updateCompanyProfile);
router.post('/profile/logo', upload.single('logo'), uploadCompanyLogo);
router.delete('/profile/logo', removeCompanyLogo);

// Stats
router.get('/stats', getCompanyStats);

// Fleet Requests
router.get('/fleet-requests', getCompanyFleetRequests);
router.get('/fleet-requests/:id', getCompanyFleetRequest);
router.patch('/fleet-requests/:id/accept', acceptFleetRequest);
router.patch('/fleet-requests/:id/decline', declineFleetRequest);
router.post('/fleet-requests/:id/assign', assignDriverToFleetRequest);

// Deliveries
router.get('/deliveries', getCompanyDeliveries);
router.get('/deliveries/:id', getCompanyDelivery);

// Vehicles
router.get('/vehicles', getCompanyVehicles);
router.post('/vehicles', createCompanyVehicle);
router.put('/vehicles/:id', updateCompanyVehicle);
router.patch('/vehicles/:id/status', updateCompanyVehicleStatus);
router.patch('/vehicles/:id/assign-driver', assignDriverToVehicle);
router.patch('/vehicles/:id/unassign-driver', unassignDriverFromVehicle);

// Drivers
router.get('/drivers', getCompanyDrivers);
router.post('/drivers', createCompanyDriver);
router.get('/drivers/:id', getCompanyDriverDetails);
router.patch('/drivers/:id/assign', updateCompanyDriverAssignment);
router.delete('/drivers/:id', removeCompanyDriver);

export default router;
