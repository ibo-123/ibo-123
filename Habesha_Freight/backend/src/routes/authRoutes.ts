import { Router } from 'express';
import {
  register,
  verifyOtp,
  resendOtp,
  login,
  getMe,
  updateProfile,
  logout,
  sendOtp,
  faydaVerify,
  faydaLogin,
  refreshToken,
  uploadDriverLicense,
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

// Public Authentication Routes
router.post('/register', upload.single('document'), register);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/logout', logout);

// New Auth Routes
router.post('/otp/send', sendOtp);
router.post('/fayda/verify', faydaVerify);
router.post('/login/fayda', faydaLogin);
router.post('/refresh', refreshToken);
router.post(
  '/register/driver/license',
  upload.single('license'),
  uploadDriverLicense
);

// Protected User Routes (Require JWT Token)
router.get('/me', authenticateToken, getMe);
router.patch('/profile', authenticateToken, updateProfile);

export default router;
