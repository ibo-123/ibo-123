/**
 * BACKWARD COMPATIBILITY LAYER
 * Re-exports from the centralized auth.js middleware
 * Do not modify this file. Update auth.js instead.
 */

const { authenticate, authorize } = require('./auth');

const protect = authenticate;

module.exports = {
  protect,
  authenticate,
  authorize,
};