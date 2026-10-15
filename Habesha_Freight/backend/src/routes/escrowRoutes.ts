import { Router } from 'express';
import {
  getEscrowStatus,
  getEscrowLedger,
  initiateEscrowDeposit,
  handlePaymentWebhook,
  releaseEscrow,
  refundEscrow,
} from '../controllers/escrowController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public webhook endpoint for payment providers (Chapa, Telebirr, CBE Birr)
router.post('/webhook', handlePaymentWebhook);

// Protected endpoints
router.use(authenticateToken);
router.get('/ledger/all', getEscrowLedger);
router.post('/deposit', initiateEscrowDeposit);
router.get('/:shipment_id', getEscrowStatus);
router.post('/:shipment_id/release', releaseEscrow);
router.post('/:shipment_id/refund', refundEscrow);

export default router;
