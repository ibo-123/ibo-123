import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { authorizeRoles } from '../middleware/rbac';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

import {
  searchNearbyDrivers,
  getDriverDetails,
  updateDriverLocation,
  getDriverLocation,
} from '../controllers/driverController';

import { placeBid } from '../controllers/bidController';
import {
  getDriverProfile,
  updateDriverProfile,
  uploadDriverProfilePhoto,
  removeDriverProfilePhoto,
  getDriverStats,
  acceptLoadPrice,
  cancelDriverBid,
  getDriverEarnings,
  getDriverEarningsHistory,
  getAvailableLoadsForDriver,
  getDriverBids,
  getDriverShipments,
  getDriverRatings,
} from '../controllers/driverControllerExtras';

const router = Router();

// All driver routes require authentication
router.use(authenticateToken);

// Public driver routes (available to any authenticated user)
router.get('/nearby', searchNearbyDrivers);

// Location endpoints - allow both driver and admin
router.post('/location', updateDriverLocation);
router.get('/location', getDriverLocation);

// Available loads endpoint for driver proximity search
router.get('/loads/available', getAvailableLoadsForDriver);

// Routes that require DRIVER role
router.use(authorizeRoles('DRIVER'));

// Profile Management (DRIVER only)
router.get('/profile', getDriverProfile);
router.put('/profile', updateDriverProfile);
router.post('/profile/photo', upload.single('photo'), uploadDriverProfilePhoto);
router.delete('/profile/photo', removeDriverProfilePhoto);

// Stats (DRIVER only)
router.get('/stats', getDriverStats);

// Ratings (DRIVER only)
router.get('/ratings', getDriverRatings);

// Shipments (DRIVER only)
router.get('/shipments', getDriverShipments);

// Load Operations (DRIVER only)
router.post('/loads/:id/accept', acceptLoadPrice);

// Bids (DRIVER only)
router.get('/bids', getDriverBids);
router.post('/bids', placeBid);
router.delete('/bids/:bid_id', cancelDriverBid);

// Earnings (DRIVER only)
router.get('/earnings', getDriverEarnings);
router.get('/earnings/history', getDriverEarningsHistory);

// Dynamic driver route MUST come AFTER all static routes
router.get('/:id', getDriverDetails);

export default router;
