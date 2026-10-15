import { Router } from 'express';
import { createReview, listReviews } from '../controllers/reviewController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.post('/', createReview);
router.get('/', listReviews);

export default router;
