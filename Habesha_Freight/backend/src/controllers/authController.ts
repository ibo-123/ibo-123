import { Request, Response } from 'express';
import db from '../config/db';
import { hashPassword, comparePassword, generateOTP } from '../utils/crypto';
import { generateToken, verifyToken } from '../utils/jwt';
import { AuthenticatedRequest } from '../middleware/auth';
import { FileService } from '../services/fileService';
import { emailService } from '../services/emailService';

export async function register(req: Request, res: Response) {
  try {
    const {
      full_name,
      email,
      phone_number,
      password,
      role,
      license_number,
      company_registration_number,
    } = req.body;
    const file = req.file;

    if (role === 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (!full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email address, and password are required.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await db('users').where({ email: normalizedEmail }).first();
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email address already exists.',
      });
    }

    const hashedPassword = await hashPassword(password);
    const { otp, expiresAt } = generateOTP();
    const targetRole = (role || 'SHIPPER').toUpperCase();

    let uploadedDocUrl: string | null = null;
    if (file) {
      const validation = FileService.validateFile(file, 10);
      if (!validation.valid) {
        return res.status(400).json({ success: false, message: validation.error });
      }
      uploadedDocUrl = await FileService.saveFile(file.buffer, file.originalname, 'registration', 'license');
    }

    const isDriverOrFleet = targetRole === 'DRIVER' || targetRole === 'FLEET_OWNER';
    const initialKycStatus = isDriverOrFleet ? 'PENDING' : 'APPROVED';
    const initialStatus = isDriverOrFleet ? 'PENDING_APPROVAL' : 'ACTIVE';

    const generatedPhone = `+2519${Math.floor(10000000 + Math.random() * 90000000)}`;
    const finalPhoneNumber = phone_number && phone_number.trim() ? phone_number.trim() : generatedPhone;

    const existingPhone = await db('users').where({ phone_number: finalPhoneNumber }).first();
    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message: 'A user with this phone number already exists. Use a different number or log in.',
      });
    }

    const insertData: Record<string, any> = {
      full_name,
      email: normalizedEmail,
      phone_number: finalPhoneNumber,
      password_hash: hashedPassword,
      role: targetRole,
      is_verified: false,
      kyc_status: initialKycStatus,
      status: initialStatus,
      otp_code: otp,
      otp_expires_at: expiresAt,
    };

    if (targetRole === 'DRIVER') {
      if (license_number) insertData.license_number = license_number;
      if (uploadedDocUrl) insertData.license_photo_url = uploadedDocUrl;
    } else if (targetRole === 'FLEET_OWNER') {
      if (company_registration_number) insertData.company_registration_number = company_registration_number;
      if (uploadedDocUrl) insertData.license_photo_url = uploadedDocUrl;
    }

    const [newUser] = await db('users')
      .insert(insertData)
      .returning(['id', 'full_name', 'email', 'phone_number', 'role', 'is_verified', 'kyc_status', 'status']);

    const token = isDriverOrFleet
      ? generateToken({
          userId: newUser.id,
          role: newUser.role,
          phoneNumber: newUser.phone_number,
          email: newUser.email,
        })
      : null;

    if (!isDriverOrFleet) {
      // Send real Email OTP via Nodemailer for SHIPPER only
      emailService.sendOtpEmail(normalizedEmail, otp, full_name).catch((err) => {
        console.error('❌ [BACKGROUND EMAIL ERROR]:', err);
      });
    }

    return res.status(201).json({
      success: true,
      message: isDriverOrFleet
        ? 'Registration successful. Your account has been submitted for Admin approval.'
        : 'Registration successful. A 6-digit OTP has been sent to your email address.',
      data: {
        user: newUser,
        token: token || undefined,
      },
    });
  } catch (error: any) {
    console.error('Registration Error:', error);
    if (error?.code === '23505') {
      const detail = String(error?.detail || '');
      if (detail.includes('phone_number')) {
        return res.status(409).json({
          success: false,
          message: 'A user with this phone number already exists. Use a different number or log in.',
        });
      }
      if (detail.includes('email')) {
        return res.status(409).json({
          success: false,
          message: 'A user with this email address already exists.',
        });
      }
      return res.status(409).json({
        success: false,
        message: 'An account with these details already exists.',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Internal server error during registration.',
    });
  }
}

export async function verifyOtp(req: Request, res: Response) {
  try {
    const { email, phone_number, otp_code } = req.body;

    const identifier = email || phone_number;
    if (!identifier || !otp_code) {
      return res.status(400).json({
        success: false,
        message: 'Email address and OTP code are required.',
      });
    }

    const user = email
      ? await db('users').where({ email: email.toLowerCase().trim() }).first()
      : await db('users').where({ phone_number }).first();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.otp_code !== otp_code) {
      return res.status(400).json({ success: false, message: 'Invalid OTP code.' });
    }

    if (new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({ success: false, message: 'OTP code has expired.' });
    }

    const isDriverOrFleet = user.role === 'DRIVER' || user.role === 'FLEET_OWNER';
    const updatedKycStatus = isDriverOrFleet ? 'PENDING' : 'APPROVED';
    const updatedStatus = isDriverOrFleet ? 'PENDING_APPROVAL' : 'ACTIVE';

    await db('users')
      .where({ id: user.id })
      .update({
        is_verified: true,
        kyc_status: updatedKycStatus,
        status: updatedStatus,
        otp_code: null,
        otp_expires_at: null,
      });

    const token = generateToken({
      userId: user.id,
      role: user.role,
      phoneNumber: user.phone_number,
      email: user.email,
    });

    return res.status(200).json({
      success: true,
      message: isDriverOrFleet
        ? 'Email verified successfully. Your account is currently pending Admin verification.'
        : 'Email verified successfully.',
      data: {
        token,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone_number: user.phone_number,
          role: user.role,
          is_verified: true,
          kyc_status: updatedKycStatus,
          status: updatedStatus,
        },
      },
    });
  } catch (error) {
    console.error('OTP Verification Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during OTP verification.',
    });
  }
}

export async function resendOtp(req: Request, res: Response) {
  try {
    const { email, phone_number } = req.body;

    const identifier = email || phone_number;
    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required.',
      });
    }

    const user = email
      ? await db('users').where({ email: email.toLowerCase().trim() }).first()
      : await db('users').where({ phone_number }).first();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const { otp, expiresAt } = generateOTP();

    await db('users')
      .where({ id: user.id })
      .update({ otp_code: otp, otp_expires_at: expiresAt });

    emailService.sendOtpEmail(user.email, otp, user.full_name).catch((err) => {
      console.error('❌ [BACKGROUND RESEND EMAIL ERROR]:', err);
    });

    return res.status(200).json({
      success: true,
      message: 'New OTP code sent to your email address.',
    });
  } catch (error) {
    console.error('Resend OTP Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during OTP resend.',
    });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, phone_number, password } = req.body;

    const identifier = email || phone_number;
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email address (or phone) and password are required.',
      });
    }

    const user = email
      ? await db('users').where({ email: email.toLowerCase().trim() }).first()
      : await db('users').where({ phone_number: identifier }).first();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      });
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      });
    }

    if (!user.is_verified && user.role === 'SHIPPER') {
      return res.status(401).json({
        success: false,
        message: 'Your email address is not verified. Please verify your OTP code.',
        requires_otp_verification: true,
        email: user.email,
      });
    }

    const token = generateToken({
      userId: user.id,
      role: user.role,
      phoneNumber: user.phone_number,
      email: user.email,
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone_number: user.phone_number,
          role: user.role,
          is_verified: user.is_verified,
          kyc_status: user.kyc_status,
          status: user.status,
        },
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during login.',
    });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;

    const user = await db('users')
      .select('id', 'full_name', 'phone_number', 'email', 'role', 'is_verified', 'kyc_status', 'status', 'created_at')
      .where({ id: userId })
      .first();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get Me Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error fetching user profile.',
    });
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { full_name, email } = req.body;

    const updateData: Record<string, any> = {};
    if (full_name) updateData.full_name = full_name;
    if (email !== undefined) updateData.email = email;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields provided for profile update.',
      });
    }

    const [updatedUser] = await db('users')
      .where({ id: userId })
      .update(updateData)
      .returning(['id', 'full_name', 'phone_number', 'email', 'role', 'is_verified']);

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error updating profile.',
    });
  }
}

export async function logout(req: Request, res: Response) {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully. Please clear client-side token.',
  });
}

// ============================================================
// NEW AUTH METHODS
// ============================================================

export async function sendOtp(req: Request, res: Response) {
  try {
    const { phone_number } = req.body;

    if (!phone_number) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required.',
      });
    }

    const user = await db('users').where({ phone_number }).first();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const { otp, expiresAt } = generateOTP();

    await db('users')
      .where({ id: user.id })
      .update({ otp_code: otp, otp_expires_at: expiresAt });

    console.log(`📱 [SMS OTP SEND] Sent OTP ${otp} to ${phone_number}`);

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully.',
      data: { demo_otp: otp },
    });
  } catch (error) {
    console.error('Send OTP Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error sending OTP.',
    });
  }
}

export async function faydaVerify(req: Request, res: Response) {
  try {
    const { fayda_number, phone_number } = req.body;

    if (!fayda_number || !phone_number) {
      return res.status(400).json({
        success: false,
        message: 'Fayda number and phone number are required.',
      });
    }

    // Find user by phone number
    const user = await db('users').where({ phone_number }).first();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // In production, this would call Fayda API to verify
    // For now, we'll simulate verification
    const isVerified = true;

    if (!isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Fayda verification failed.',
      });
    }

    await db('users')
      .where({ id: user.id })
      .update({
        fayda_verified: true,
        fayda_number: fayda_number,
      });

    return res.status(200).json({
      success: true,
      message: 'Fayda number verified successfully.',
      data: {
        verified: true,
        fayda_number: fayda_number,
      },
    });
  } catch (error) {
    console.error('Fayda Verify Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during Fayda verification.',
    });
  }
}

export async function faydaLogin(req: Request, res: Response) {
  try {
    const { fayda_number, phone_number } = req.body;

    if (!fayda_number || !phone_number) {
      return res.status(400).json({
        success: false,
        message: 'Fayda number and phone number are required.',
      });
    }

    const user = await db('users')
      .where({ phone_number, fayda_number })
      .first();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Fayda credentials.',
      });
    }

    const token = generateToken({
      userId: user.id,
      role: user.role,
      phoneNumber: user.phone_number,
    });

    return res.status(200).json({
      success: true,
      message: 'Fayda login successful.',
      data: {
        token,
        user: {
          id: user.id,
          full_name: user.full_name,
          phone_number: user.phone_number,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Fayda Login Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during Fayda login.',
    });
  }
}

export async function refreshToken(req: Request, res: Response) {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required.',
      });
    }

    try {
      const decoded = verifyToken(refresh_token);
      const user = await db('users').where({ id: decoded.userId }).first();

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token.',
        });
      }

      const newToken = generateToken({
        userId: user.id,
        role: user.role,
        phoneNumber: user.phone_number,
      });

      return res.status(200).json({
        success: true,
        message: 'Token refreshed successfully.',
        data: { token: newToken },
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token.',
      });
    }
  } catch (error) {
    console.error('Refresh Token Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error refreshing token.',
    });
  }
}

export async function uploadDriverLicense(req: Request, res: Response) {
  try {
    const { phone_number } = req.body;
    const file = req.file;

    if (!phone_number) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required.',
      });
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'License file is required.',
      });
    }

    const user = await db('users').where({ phone_number }).first();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (user.role !== 'DRIVER') {
      return res.status(403).json({
        success: false,
        message: 'Only drivers can upload license.',
      });
    }

    const validation = FileService.validateFile(file, 10);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error,
      });
    }

    const fileUrl = await FileService.saveFile(
      file.buffer,
      file.originalname,
      user.id,
      'license'
    );

    await db('users')
      .where({ id: user.id })
      .update({
        license_photo_url: fileUrl,
        license_status: 'PENDING',
      });

    return res.status(200).json({
      success: true,
      message: 'Driver license uploaded successfully.',
      data: {
        license_photo_url: fileUrl,
        license_status: 'PENDING',
      },
    });
  } catch (error) {
    console.error('Upload Driver License Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error uploading license.',
    });
  }
}
