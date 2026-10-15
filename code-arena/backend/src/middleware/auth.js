/**
 * CENTRALIZED AUTHENTICATION MIDDLEWARE
 * This is the single source of truth for auth middleware.
 * authMiddleware.js re-exports these for backward compatibility.
 */

const jwt = require('jsonwebtoken');

/**
 * Middleware: Authenticate using JWT
 * Decodes JWT and attaches decoded payload to req.user
 * Controllers can fetch fresh user data if needed via User.findById(req.user.userId)
 */
const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Attach decoded JWT payload to req.user
    // userId/id/_id are all present from token generation
    req.user = {
      userId: decoded.userId || decoded.id || decoded._id,
      _id: decoded.userId || decoded.id || decoded._id,
      id: decoded.userId || decoded.id || decoded._id,
      role: decoded.role || 'USER',
      ...decoded
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

/**
 * Middleware: Authorize by role
 * Must be called after authenticate()
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};
