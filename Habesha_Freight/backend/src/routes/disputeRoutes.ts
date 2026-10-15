import { Router } from 'express';
import {
  createDispute,
  listDisputes,
  resolveDispute,
} from '../controllers/disputeController';
import { authenticateToken } from '../middleware/auth';
import { authorizeRoles } from '../middleware/rbac';

const router = Router();

router.use(authenticateToken);

router.post('/', createDispute);
router.get('/', listDisputes);
router.post(
  '/:id/resolve',
  authorizeRoles('ADMIN'),
  resolveDispute
);

export default router;
