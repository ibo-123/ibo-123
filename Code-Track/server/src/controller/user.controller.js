import bcrypt from "bcrypt";
import User from "../models/UserModel.js";
import { syncCodeforcesData } from "../services/codeforces.services.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getProfile = async (req, res) => {
  try {
    console.log('[PROFILE] Getting profile for user:', req.user.id);
    
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      console.log('[PROFILE] User not found:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log('[PROFILE] Profile retrieved successfully');
    
    // Determine avatar URL
    const avatarUrl = user.avatar || user.avater || "";
    
    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name || "",
        email: user.email || "",
        phone: user.phoneNumber || user.phone || "",
        location: user.location || "",
        avatar: avatarUrl,
        bio: user.bio || "",
        codeforcesHandle: user.codeforcesHandle || "",
        codeforcesRating: user.codeforcesRating || null,
        codeforcesMaxRating: user.codeforcesMaxRating || null,
        codeforcesRank: user.codeforcesRank || "",
        leetcodeUsername: user.leetcodeUsername || "",
        leetcodeSolved: user.leetcodeSolved || 0,
        website: user.website || "",
        github: user.github || "",
        twitter: user.twitter || "",
        joinedAt: user.createdAt || user.joinedAt || null,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('[PROFILE] Error getting profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    console.log('[PROFILE] Updating profile for user:', req.user.id);
    console.log('[PROFILE] Request body:', req.body);
    console.log('[PROFILE] File:', req.file ? req.file.filename : 'No file');
    console.log('[PROFILE] File path:', req.file ? req.file.path : 'No file');

    const { 
      name, 
      email, 
      phoneNumber, 
      phone, 
      location, 
      bio,
      website,
      github,
      twitter,
      codeforcesHandle,
      leetcodeUsername
    } = req.body;

    // Find user
    const user = await User.findById(req.user.id);
    if (!user) {
      console.log('[PROFILE] User not found:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Build update object
    const updateData = {};
    const phoneValue = phoneNumber || phone;
    
    if (name !== undefined && name !== null && name !== '') {
      updateData.name = name;
    }
    if (email !== undefined && email !== null && email !== '') {
      updateData.email = email;
    }
    if (phoneValue !== undefined && phoneValue !== null) {
      updateData.phoneNumber = phoneValue;
      updateData.phone = phoneValue;
    }
    if (location !== undefined && location !== null) {
      updateData.location = location;
    }
    if (bio !== undefined && bio !== null) {
      updateData.bio = bio;
    }
    if (website !== undefined && website !== null) {
      updateData.website = website;
    }
    if (github !== undefined && github !== null) {
      updateData.github = github;
    }
    if (twitter !== undefined && twitter !== null) {
      updateData.twitter = twitter;
    }
    if (codeforcesHandle !== undefined && codeforcesHandle !== null) {
      updateData.codeforcesHandle = codeforcesHandle;
    }
    if (leetcodeUsername !== undefined && leetcodeUsername !== null) {
      updateData.leetcodeUsername = leetcodeUsername;
    }

    // Handle avatar upload
    if (req.file) {
      // Delete old avatar if it exists
      const oldAvatar = user.avatar || user.avater || "";
      if (oldAvatar && !oldAvatar.includes('default')) {
        const oldAvatarPath = path.join(__dirname, '../uploads', path.basename(oldAvatar));
        if (fs.existsSync(oldAvatarPath)) {
          try {
            fs.unlinkSync(oldAvatarPath);
            console.log('[PROFILE] Deleted old avatar:', oldAvatarPath);
          } catch (err) {
            console.error('[PROFILE] Error deleting old avatar:', err);
          }
        }
      }
      
      // Store new avatar URL
      const avatarUrl = `/uploads/${req.file.filename}`;
      updateData.avatar = avatarUrl;
      updateData.avater = avatarUrl;
      console.log('[PROFILE] Avatar updated to:', avatarUrl);
    }

    // Only update if there are changes
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { 
        new: true,
        runValidators: false
      }
    ).select('-password');

    console.log('[PROFILE] Profile updated successfully');

    // Determine avatar URL from updated user
    const avatarUrl = updatedUser.avatar || updatedUser.avater || "";

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name || "",
        email: updatedUser.email || "",
        phone: updatedUser.phoneNumber || updatedUser.phone || "",
        location: updatedUser.location || "",
        avatar: avatarUrl,
        bio: updatedUser.bio || "",
        codeforcesHandle: updatedUser.codeforcesHandle || "",
        codeforcesRating: updatedUser.codeforcesRating || null,
        codeforcesMaxRating: updatedUser.codeforcesMaxRating || null,
        codeforcesRank: updatedUser.codeforcesRank || "",
        leetcodeUsername: updatedUser.leetcodeUsername || "",
        leetcodeSolved: updatedUser.leetcodeSolved || 0,
        website: updatedUser.website || "",
        github: updatedUser.github || "",
        twitter: updatedUser.twitter || "",
        joinedAt: updatedUser.createdAt || updatedUser.joinedAt || null,
        createdAt: updatedUser.createdAt
      }
    });
  } catch (error) {
    console.error('[PROFILE] Error updating profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required"
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    console.error("[PROFILE] Change password error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};

export const syncCodeforces = async (req, res) => {
  try {
    const result = await syncCodeforcesData(req.user.id);
    if (!result) {
      return res.status(400).json({ success: false, message: "Sync failed. Please ensure Codeforces handle is valid." });
    }
    return res.status(200).json({ success: true, message: "Synced successfully", stats: result.stats });
  } catch (error) {
    console.error("Sync Codeforces error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};