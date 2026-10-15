const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

const generateToken = (userId, role = 'USER') => {
  return jwt.sign(
    { userId, role, id: userId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};

const register = async (req, res) => {
  try {
    const { username, email, password, name, codeforcesUsername } = req.body;

    if (!username || !email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: username, email, password, name'
      });
    }

    const existingUser = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: email.toLowerCase() }
      ]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this username or email already exists'
      });
    }

    const user = new User({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: password,
      name,
      codeforcesUsername: codeforcesUsername ? codeforcesUsername.trim() : '',
      role: 'USER'
    });

    await user.save();

    const token = generateToken(user._id, user.role);

    await AuditLog.create({
      action: 'USER_REGISTERED',
      description: `User ${username} registered`,
      admin: user._id,
      details: { username, email }
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username and password'
      });
    }

    const user = await User.findOne({
      username: username.trim().toLowerCase()
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    const isValidPassword = await user.comparePassword(password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    const token = generateToken(user._id, user.role);

    await AuditLog.create({
      action: 'USER_LOGIN',
      description: `User ${username} logged in`,
      admin: user._id,
      details: { username, timestamp: new Date().toISOString() }
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getMe = async (req, res) => {
  try {
    // req.user is populated by authenticate middleware from JWT payload
    // Fetch fresh user data from database to ensure latest info
    const user = await User.findById(req.user.userId || req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userResponse = user.toObject();
    delete userResponse.password;

    return res.json({
      success: true,
      user: userResponse
    });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get user data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const logout = async (req, res) => {
  try {
    if (req.user) {
      await AuditLog.create({
        action: 'USER_LOGOUT',
        description: `User ${req.user.username} logged out`,
        admin: req.user._id,
        details: { username: req.user.username }
      });
    }

    return res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout
};