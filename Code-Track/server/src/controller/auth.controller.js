import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import User from "../models/UserModel.js";

import {
  sendVerificationOtp,
} from "../services/email.service.js";

import {
  generateOtp,
  generateOtpExpiry,
} from "../util/generateOtp.js";


/**
 * REGISTER
 */
export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    const existingUser =
      await User.findOne({
        email: normalizedEmail,
      });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const otp = generateOtp();

    const otpExpires =
      generateOtpExpiry();

    const user = await User.create({
      name: name.trim(),

      email: normalizedEmail,

      password: hashedPassword,

      isVerified: false,

      verificationOtp: otp,

      verificationOtpExpires: otpExpires,
    });

    console.log(
      "Generated OTP:",
      otp
    );

    console.log(
      "OTP expiry:",
      otpExpires
    );

    try {
      await sendVerificationOtp(
        user.email,
        user.name,
        otp
      );

      console.log(
        "✅ Verification OTP sent to:",
        user.email
      );

    } catch (emailError) {

      console.error(
        "❌ Verification OTP failed:",
        emailError.message
      );

      // Delete account if email could not be sent
      await User.findByIdAndDelete(
        user._id
      );

      return res.status(500).json({
        success: false,
        message:
          "Registration failed because verification email could not be sent.",
      });
    }

    const userResponse =
      user.toObject();

    delete userResponse.password;
    delete userResponse.verificationOtp;
    delete userResponse.verificationOtpExpires;

    return res.status(201).json({
      success: true,

      message:
        "Registration successful. Please check your email for the verification code.",

      user: userResponse,
    });

  } catch (error) {

    console.error(
      "❌ Registration error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


/**
 * VERIFY EMAIL OTP
 */
export const verifyEmailOtp = async (
  req,
  res
) => {
  try {
    const {
      email,
      otp,
    } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message:
          "Email and verification code are required",
      });
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    const user =
      await User.findOne({
        email: normalizedEmail,
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message:
          "Email is already verified",
      });
    }

    if (!user.verificationOtp) {
      return res.status(400).json({
        success: false,
        message:
          "No verification code found. Please request a new code.",
      });
    }

    if (
      !user.verificationOtpExpires ||
      user.verificationOtpExpires <= new Date()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Verification code has expired. Please request a new code.",
      });
    }

    if (
      String(user.verificationOtp) !==
      String(otp).trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid verification code",
      });
    }

    user.isVerified = true;

    user.verificationOtp = null;

    user.verificationOtpExpires = null;

    await user.save();

    return res.status(200).json({
      success: true,

      message:
        "Email verified successfully.",
    });

  } catch (error) {

    console.error(
      "❌ OTP verification error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


/**
 * RESEND OTP
 */
export const resendVerificationOtp = async (
  req,
  res
) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    const user =
      await User.findOne({
        email: normalizedEmail,
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message:
          "Email is already verified",
      });
    }

    const otp = generateOtp();

    const otpExpires =
      generateOtpExpiry();

    user.verificationOtp = otp;

    user.verificationOtpExpires =
      otpExpires;

    await user.save();

    try {

      await sendVerificationOtp(
        user.email,
        user.name,
        otp
      );

    } catch (emailError) {

      console.error(
        "❌ Resend OTP email failed:",
        emailError.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to send verification code",
      });
    }

    return res.status(200).json({
      success: true,

      message:
        "A new verification code has been sent to your email.",
    });

  } catch (error) {

    console.error(
      "❌ Resend OTP error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


/**
 * LOGIN
 */
export const login = async (
  req,
  res
) => {
  try {

    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required",
      });
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    const user =
      await User.findOne({
        email: normalizedEmail,
      });

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message:
          "Please verify your email before logging in.",
      });
    }

    const isMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    const token =
      jwt.sign(
        {
          id: user._id,
          email: user.email,
          role: user.role,
        },

        process.env.JWT_SECRET,

        {
          expiresIn:
            process.env.JWT_EXPIRES_IN ||
            "7d",
        }
      );

    const userResponse =
      user.toObject();

    delete userResponse.password;

    delete userResponse.verificationOtp;

    delete userResponse.verificationOtpExpires;

    return res.status(200).json({
      success: true,

      message: "Login successful",

      token,

      user: userResponse,
    });

  } catch (error) {

    console.error(
      "❌ Login error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


/**
 * GET CURRENT USER
 */
export const getCurrentUser = async (
  req,
  res
) => {
  try {

    const user =
      await User.findById(
        req.user.id
      ).select(
        "-password -verificationOtp -verificationOtpExpires"
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });

  } catch (error) {

    console.error(
      "❌ Get current user error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};