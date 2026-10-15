import express from "express";
import { 
  getProfile, 
  updateProfile, 
  changePassword 
} from "../controller/setting.controller.js";
import  authMiddleware from "../middlewares/auth.middleware.js";
import upload from "../middlewares/upload.middleware.js";

const router = express.Router();

// GET profile - authenticated
router.get('/users/profile', authMiddleware, getProfile);

// PUT profile - update with optional avatar
router.put('/users/profile', authMiddleware, upload.single('avatar'), updateProfile);

// PUT change password
router.put('/users/password', authMiddleware, changePassword);

export default router;