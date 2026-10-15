import express from "express";

import {
  register,
  login,
  verifyEmailOtp,
  resendVerificationOtp,
  getCurrentUser,
} from "../controller/auth.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();


/*
  Register
  POST /api/auth/register
*/
router.post(
  "/register",
  register
);


/*
  Verify OTP
  POST /api/auth/verify-otp
*/
router.post(
  "/verify-otp",
  verifyEmailOtp
);


/*
  Resend OTP
  POST /api/auth/resend-otp
*/
router.post(
  "/resend-otp",
  resendVerificationOtp
);


/*
  Login
  POST /api/auth/login
*/
router.post(
  "/login",
  login
);


/*
  Current user
  GET /api/auth/me
*/
router.get(
  "/me",
  authMiddleware,
  getCurrentUser
);


export default router;