const authMiddleware = require("./authMiddleware");
const validationMiddleware = require("./validationMiddleware");
const errorMiddleware = require("./errorMiddleware");
const uploadMiddleware = require("./uploadMiddleware");
const loggingMiddleware = require("./loggingMiddleware");
const cacheMiddleware = require("./catchMiddleware");
const compressionMiddleware = require("./compressionMiddleware");

/* =========================
   1. REQUEST HELPERS
   Add utility functions to req object
========================= */
const requestHelpers = async (req, res, next) => {
  req.success = (data = {}, message = "Success", statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message,
      ...data
    });
  };

  req.error = (message, statusCode = 400, errors = null) => {
    const response = { success: false, message };
    if (errors) response.errors = errors;
    return res.status(statusCode).json(response);
  };

  req.paginate = (data, total, page, limit) => {
    return {
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  };

  next();
};

/* =========================
   2. EXPORT ALL MIDDLEWARE
========================= */
module.exports = {
  // Authentication
  protect: authMiddleware.protect,
  authorize: authMiddleware.authorize,
  adminOnly: authMiddleware.adminOnly,
  memberOrAdmin: authMiddleware.memberOrAdmin,
  optionalAuth: authMiddleware.optionalAuth,
  checkOwnership: authMiddleware.checkOwnership,
  rateLimit: authMiddleware.rateLimit,
  maintenanceMode: authMiddleware.maintenanceMode,
  csrfProtection: authMiddleware.csrfProtection,
  validateSource: authMiddleware.validateSource,

  // Validation
  handleValidationErrors: validationMiddleware.handleValidationErrors,
  validateObjectId: validationMiddleware.validateObjectId,
  validatePagination: validationMiddleware.validatePagination,
  validateUser: validationMiddleware.validateUser,
  validateCourse: validationMiddleware.validateCourse,
  validateAttendance: validationMiddleware.validateAttendance,
  validateAchievement: validationMiddleware.validateAchievement,
  validateEvent: validationMiddleware.validateEvent,
  validateFileUpload: validationMiddleware.validateFileUpload,
  validateSearch: validationMiddleware.validateSearch,
  validateDateRange: validationMiddleware.validateDateRange,

  // Error Handling
  errorHandler: errorMiddleware.errorHandler,
  asyncHandler: errorMiddleware.asyncHandler,
  notFound: errorMiddleware.notFound,
  handleUnhandledRejection: errorMiddleware.handleUnhandledRejection,
  handleUncaughtException: errorMiddleware.handleUncaughtException,

  // File Upload
  uploadSingle: uploadMiddleware.uploadSingle,
  uploadMultiple: uploadMiddleware.uploadMultiple,
  uploadProfilePicture: uploadMiddleware.uploadProfilePicture,
  uploadCourseThumbnail: uploadMiddleware.uploadCourseThumbnail,
  uploadAchievementEvidence: uploadMiddleware.uploadAchievementEvidence,
  uploadCourseAttachments: uploadMiddleware.uploadCourseAttachments,
  uploadEventBanner: uploadMiddleware.uploadEventBanner,
  deleteFile: uploadMiddleware.deleteFile,
  serveUploadedFiles: uploadMiddleware.serveUploadedFiles,

  // Logging
  morganLogger: loggingMiddleware.morganLogger,
  requestLogger: loggingMiddleware.requestLogger,
  responseTime: loggingMiddleware.responseTime,
  performanceMonitor: loggingMiddleware.performanceMonitor,
  securityHeaders: loggingMiddleware.securityHeaders,
  cors: loggingMiddleware.cors,
  requestId: loggingMiddleware.requestId,

  // Cache
  cacheMiddleware: cacheMiddleware.cacheMiddleware,
  clearCache: cacheMiddleware.clearCache,
  cacheStats: cacheMiddleware.cacheStats,
  cacheData: cacheMiddleware.cacheData,
  getCachedData: cacheMiddleware.getCachedData,
  deleteCachedData: cacheMiddleware.deleteCachedData,
  cacheUserData: cacheMiddleware.cacheUserData,
  getUserCachedData: cacheMiddleware.getUserCachedData,

  // Compression
  compress: compressionMiddleware.compress,
  gzipCompression: compressionMiddleware.gzipCompression,
  brotliCompression: compressionMiddleware.brotliCompression,
  responseSizeLogger: compressionMiddleware.responseSizeLogger,

  // Request helpers
  requestHelpers
};
