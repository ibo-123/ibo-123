import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../model/User.js";
import ApiError from "../utils/ApiError.js";
import { sendVerificationEmail, sendResetCodeEmail } from "./emailService.js";

const VERIFICATION_CODE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashCode(code) {
  return bcrypt.hash(code, 12);
}

async function verifyCode(code, hashedCode) {
  return bcrypt.compare(code, hashedCode);
}

function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

export async function registerUser({ name, email, phone, password, role }) {
  const normalizedEmail = normalizeEmail(email);
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) throw new ApiError(409, "An account with this email already exists.");

  const safeRole = ["customer", "driver"].includes(role) ? role : "customer";
  const verificationCode = generateOtpCode();
  const verificationCodeExpiresAt = new Date(Date.now() + VERIFICATION_CODE_TTL_MS);
  const user = await User.create({
    name,
    email: normalizedEmail,
    phone,
    password,
    role: safeRole,
    isVerified: false,
    verificationCode: await hashCode(verificationCode),
    verificationCodeExpiresAt,
  });

  await sendVerificationEmail(user.email, verificationCode);

  return {
    user: user.toSafeObject(),
    requiresVerification: true,
    email: user.email,
  };
}

export async function loginUser({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail }).select("+password");
  if (!user) throw new ApiError(401, "Invalid email or password.");
  if (!user.isActive) throw new ApiError(403, "This account has been deactivated.");
  if (!user.isVerified) {
    throw new ApiError(403, "Please verify your email before signing in.");
  }

  const match = await user.comparePassword(password);
  if (!match) throw new ApiError(401, "Invalid email or password.");

  const token = signToken(user);
  return { user: user.toSafeObject(), token };
}

export async function sendForgotPasswordCode({ email }) {
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    return { message: "If an account exists for that email, a reset code has been sent." };
  }

  if (!user.isVerified) {
    throw new ApiError(403, "Please verify your account before resetting the password.");
  }

  const resetCode = generateOtpCode();
  user.resetCode = await hashCode(resetCode);
  user.resetCodeExpiresAt = new Date(Date.now() + VERIFICATION_CODE_TTL_MS);
  await user.save({ validateBeforeSave: false });

  await sendResetCodeEmail(user.email, resetCode);
  return { message: "If an account exists for that email, a reset code has been sent." };
}

export async function resendOtp({ email, mode = "verify" }) {
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail }).select(
    "+verificationCode +resetCode"
  );
  if (!user) throw new ApiError(404, "Account not found.");

  if (mode === "verify") {
    if (user.isVerified) throw new ApiError(400, "Account already verified.");

    const verificationCode = generateOtpCode();
    user.verificationCode = await hashCode(verificationCode);
    user.verificationCodeExpiresAt = new Date(Date.now() + VERIFICATION_CODE_TTL_MS);
    await user.save({ validateBeforeSave: false });
    await sendVerificationEmail(user.email, verificationCode);
    return { message: "A new verification code has been sent." };
  }

  if (!user.resetCodeExpiresAt || user.resetCodeExpiresAt < new Date()) {
    throw new ApiError(400, "No active reset request found. Please request a password reset again.");
  }

  const resetCode = generateOtpCode();
  user.resetCode = await hashCode(resetCode);
  user.resetCodeExpiresAt = new Date(Date.now() + VERIFICATION_CODE_TTL_MS);
  await user.save({ validateBeforeSave: false });
  await sendResetCodeEmail(user.email, resetCode);
  return { message: "A new password reset code has been sent." };
}

export async function verifyOtp({ email, otp, mode = "verify", newPassword }) {
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail }).select(
    "+password +verificationCode +verificationCodeExpiresAt +resetCode +resetCodeExpiresAt"
  );

  if (!user) throw new ApiError(401, "Invalid email or code.");

  if (mode === "verify") {
    if (!user.verificationCode || !user.verificationCodeExpiresAt) {
      throw new ApiError(400, "No verification code pending for this account.");
    }
    if (user.verificationCodeExpiresAt < new Date()) {
      throw new ApiError(400, "The verification code has expired.");
    }
    const valid = await verifyCode(otp, user.verificationCode);
    if (!valid) throw new ApiError(401, "Invalid verification code.");

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpiresAt = undefined;
    await user.save({ validateBeforeSave: false });
  } else if (mode === "reset") {
    if (!user.resetCode || !user.resetCodeExpiresAt) {
      throw new ApiError(400, "No password reset request found for this account.");
    }
    if (user.resetCodeExpiresAt < new Date()) {
      throw new ApiError(400, "The password reset code has expired.");
    }
    const valid = await verifyCode(otp, user.resetCode);
    if (!valid) throw new ApiError(401, "Invalid password reset code.");
    if (!newPassword) {
      throw new ApiError(400, "A new password is required to reset the account.");
    }

    user.password = newPassword;
    user.resetCode = undefined;
    user.resetCodeExpiresAt = undefined;
    await user.save();
  } else {
    throw new ApiError(400, "Invalid verification mode.");
  }

  const token = signToken(user);
  return { user: user.toSafeObject(), token };
}

export default {
  signToken,
  registerUser,
  loginUser,
  sendForgotPasswordCode,
  resendOtp,
  verifyOtp,
};
