const express = require("express");
const router = express.Router();

// Controllers
const authController = require("../controllers/auth.controller");

// Middlewares (from your middleware index)
const {
  protect,
  rateLimit,
  requestHelpers
} = require("../middleware/authMiddleware");

/* =========================
   Global helpers
========================= */
// router.use(requestHelpers);

/* =========================
   Public Routes
========================= */

// Register
router.post("/register", authController.register);

// Login (rate limited)
router.post(
  "/login",
  rateLimit(10, 15), // 10 attempts per 15 minutes
  authController.login
);

// Forgot password
router.post(
  "/forgotpassword",
  rateLimit(5, 15),
  authController.forgotPassword
);

// Reset password
router.put(
  "/resetpassword/:resettoken",
  authController.resetPassword
);

// Verify email
router.get(
  "/verifyemail/:verificationtoken",
  authController.verifyEmail
);

/* =========================
   Protected Routes
========================= */
router.use(protect);

// Logout
router.post("/logout", authController.logout);

// Get current user
router.get("/me", authController.getMe);

// Update profile details
router.put("/updatedetails", authController.updateDetails);

// Update password
router.put("/updatepassword", authController.updatePassword);

// Resend verification email
router.post("/resendverification", authController.resendVerification);

module.exports = router;
