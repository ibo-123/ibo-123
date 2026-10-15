const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new AppError(401, 'Authentication required');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new AppError(401, 'Invalid or expired token');
  }

  if (!decoded?.id || !mongoose.Types.ObjectId.isValid(decoded.id)) {
    throw new AppError(401, 'Invalid or expired token');
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new AppError(401, 'Authentication required');
  }

  if (user.isActive === false) {
    throw new AppError(403, 'This account is inactive');
  }

  req.user = user;
  next();
});

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError(403, 'You do not have permission to access this resource'));
    }

    next();
  };
}

module.exports = { authenticate, authorize };
