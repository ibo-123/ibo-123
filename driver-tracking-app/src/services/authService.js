import jwt from "jsonwebtoken";
import User from "../model/User.js";
import ApiError from "../utils/ApiError.js";

export function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

export async function registerUser({ name, email, phone, password, role }) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new ApiError(409, "An account with this email already exists.");

  // Only allow self-registration as customer or driver from the public endpoint.
  // Admin/dispatcher accounts should be created by an existing admin (see userController).
  const safeRole = ["customer", "driver"].includes(role) ? role : "customer";

  const user = await User.create({ name, email, phone, password, role: safeRole });
  const token = signToken(user);
  return { user: user.toSafeObject(), token };
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user) throw new ApiError(401, "Invalid email or password.");
  if (!user.isActive) throw new ApiError(403, "This account has been deactivated.");

  const match = await user.comparePassword(password);
  if (!match) throw new ApiError(401, "Invalid email or password.");

  const token = signToken(user);
  return { user: user.toSafeObject(), token };
}

export default { signToken, registerUser, loginUser };
