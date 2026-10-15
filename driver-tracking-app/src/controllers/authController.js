import asyncHandler from "../utils/asyncHandler.js";
import * as authService from "../services/authService.js";

export const register = asyncHandler(async (req, res) => {
  const { user, token } = await authService.registerUser(req.body);
  res.status(201).json({ success: true, data: { user, token } });
});

export const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.loginUser(req.body);
  res.status(200).json({ success: true, data: { user, token } });
});

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: { user: req.user.toSafeObject() } });
});

export const logout = asyncHandler(async (req, res) => {
  // JWTs are stateless; logout is handled client-side by discarding the token.
  // This endpoint exists for API symmetry / future token-blacklist support.
  res.status(200).json({ success: true, message: "Logged out." });
});

export default { register, login, getMe, logout };
