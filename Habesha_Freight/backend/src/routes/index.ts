import { Router } from 'express';
import authRoutes from './authRoutes';
import adminRoutes from './adminRoutes';
import vehicleRoutes from './vehicleRoutes';
import driverRoutes from './driverRoutes';
import loadRoutes from './loadRoutes';
import bidRoutes from './bidRoutes';
import shipmentRoutes from './shipmentRoutes';
import trackingRoutes from './trackingRoutes';
import escrowRoutes from './escrowRoutes';
import disputeRoutes from './disputeRoutes';
import reviewRoutes from './reviewRoutes';
import shipperRoutes from './shipperRoutes';
import companyRoutes from './companyRoutes';
import messageRoutes from './messageRoutes';

const router = Router();

// Public routes
router.use('/auth', authRoutes);

// Protected routes
router.use('/admin', adminRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/drivers', driverRoutes);
router.use('/loads', loadRoutes);
router.use('/bids', bidRoutes);
router.use('/shipments', shipmentRoutes);
router.use('/tracking', trackingRoutes);
router.use('/escrow', escrowRoutes);
router.use('/disputes', disputeRoutes);
router.use('/reviews', reviewRoutes);
router.use('/shipper', shipperRoutes);
router.use('/company', companyRoutes);
router.use('/messages', messageRoutes);

export default router;
