import asyncHandler from "../utils/asyncHandler.js";
import * as authService from "../services/authService.js";

export const register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body);
  res.status(201).json({ success: true, data: result });
});

export const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.loginUser(req.body);
  res.status(200).json({ success: true, data: { user, token } });
});

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: { user: req.user.toSafeObject() } });
});

export const logout = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: "Logged out." });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.sendForgotPasswordCode(req.body);
  res.status(200).json({ success: true, data: result });
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp, mode, newPassword } = req.body;
  const { user, token } = await authService.verifyOtp({ email, otp, mode, newPassword });
  res.status(200).json({ success: true, data: { user, token } });
});

export const resendOtp = asyncHandler(async (req, res) => {
  const { email, mode } = req.body;
  const result = await authService.resendOtp({ email, mode });
  res.status(200).json({ success: true, data: result });
});

export default { register, login, getMe, logout, forgotPassword, verifyOtp, resendOtp };
