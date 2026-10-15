import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { authorizeRoles } from '../middleware/rbac';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

import {
  getShipperProfile,
  updateShipperProfile,
  uploadProfilePhoto,
  removeProfilePhoto,
  createShipmentRequest,
  getShipperRequests,
  cancelRequest,
  getRequestBids,
  getAllShipperBids,
  acceptBid,
  counterOffer,
  rejectBid,
  confirmDelivery,
  rateDriver,
  rateCompany,
  getPaymentInfo,
  openDispute,
  getMessages,
  getThreadMessages,
  sendMessage,
  searchFleetCompanies,
  getCompanyDetails,
  createFleetRequest,
} from '../controllers/shipperController';

const router = Router();

// All shipper routes require authentication
router.use(authenticateToken);
router.use(authorizeRoles('SHIPPER'));

// Fleet Company Search & Requests
router.get('/companies', searchFleetCompanies);
router.get('/companies/:id', getCompanyDetails);
router.post('/fleet-requests', createFleetRequest);

// Profile Management
router.get('/profile', getShipperProfile);
router.put('/profile', updateShipperProfile);
router.post('/profile/photo', upload.single('photo'), uploadProfilePhoto);
router.delete('/profile/photo', removeProfilePhoto);

// Request Management
router.post('/requests', createShipmentRequest);
router.get('/requests', getShipperRequests);
router.get('/bids', getAllShipperBids);
router.patch('/requests/:id/cancel', cancelRequest);
router.get('/requests/:id/bids', getRequestBids);
router.patch('/requests/:id/bids/:bid_id/accept', acceptBid);
router.post('/requests/:id/bids/:bid_id/counter', counterOffer);
router.patch('/requests/:id/bids/:bid_id/reject', rejectBid);

// Delivery Operations
router.patch('/deliveries/:id/confirm', confirmDelivery);

// Ratings
router.post('/ratings/driver', rateDriver);
router.post('/ratings/company', rateCompany);

// Payments
router.get('/payments/:delivery_id', getPaymentInfo);

// Disputes
router.post('/disputes', openDispute);

// Messages
router.get('/messages', getMessages);
router.get('/messages/:thread_id', getThreadMessages);
router.post('/messages/:thread_id', sendMessage);

export default router;
