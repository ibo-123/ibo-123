const express = require("express");
const User = require('../models/User');
const {
  register,
  login,
  getMe,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);

router.post('/login', (req, res, next) => {
  console.log('🔥 LOGIN ROUTE HIT');
  next();
}, login);
router.post('/debug-password', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({
      username: username.trim().toLowerCase()
    }).select('+password');

    if (!user) {
      return res.json({
        found: false,
        message: 'User not found'
      });
    }

    const bcrypt = require('bcryptjs');

    const directCompare = await bcrypt.compare(
      password,
      user.password
    );

    const methodCompare = await user.comparePassword(password);

    return res.json({
      found: true,
      username: user.username,
      hasPassword: !!user.password,
      hashPrefix: user.password?.substring(0, 7),
      directCompare,
      methodCompare
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message
    });
  }
});
router.post('/rest-password', async (req, res) => {
  try {
    const { username, newPassword } = req.body;

    if (!username || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'username and newPassword are required'
      });
    }

    const user = await User.findOne({
      username: username.trim().toLowerCase()
    }).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.password = newPassword;

    await user.save();

    return res.json({
      success: true,
      message: 'Development password reset successfully'
    });

  } catch (error) {
    console.error('RESET PASSWORD ERROR:', error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get("/me", protect, getMe);

// Logout (client-side token removal); provide a harmless endpoint to avoid 404s
router.post('/logout', (req, res) => {
  // Nothing to do server-side for JWT stateless logout; respond OK for client convenience
  res.json({ success: true, message: 'Logged out' });
});

module.exports = router;