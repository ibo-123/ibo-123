const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function authenticateCredentials(email, password) {
  const user = await User.findOne({
    email: String(email).toLowerCase().trim(),
  }).select('+password');

  if (!user) {
    return null;
  }

  const matches = await user.comparePassword(password);
  if (!matches) {
    return null;
  }

  return user;
}

function createToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set');
  }

  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  );
}

module.exports = { authenticateCredentials, createToken };
