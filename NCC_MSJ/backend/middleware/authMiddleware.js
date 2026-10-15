const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const AuditLog = require("../models/AuditLog.model");

// @desc    Protect routes - Verify JWT
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    // Check for token in cookies
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route"
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if token was issued before password change
      const user = await User.findById(decoded.id).select("+passwordChangedAt");
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User no longer exists"
        });
      }

      // Check if user changed password after token was issued
      if (user.passwordChangedAt) {
        const changedTimestamp = parseInt(
          user.passwordChangedAt.getTime() / 1000,
          10
        );

        if (decoded.iat < changedTimestamp) {
          return res.status(401).json({
            success: false,
            message: "User recently changed password. Please login again."
          });
        }
      }

      // Check if user is active
      if (user.status !== "Active") {
        return res.status(403).json({
          success: false,
          message: `Account is ${user.status.toLowerCase()}. Please contact administrator.`
        });
      }

      // Attach user to request
      req.user = {
        id: user._id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        role: user.role,
        status: user.status
      };

      // Update last activity
      user.lastActivity = Date.now();
      await user.save({ validateBeforeSave: false });

      next();
    } catch (error) {
      console.error("Token verification error:", error);

      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message: "Invalid token"
        });
      }

      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token has expired"
        });
      }

      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route"
      });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Authentication failed"
    });
  }
};

// @desc    Authorize roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated"
      });
    }

    if (!roles.includes(req.user.role)) {
      // Log unauthorized access attempt
      AuditLog.log({
        userId: req.user.id,
        action: "read",
        resource: req.path,
        resourceName: `Unauthorized access attempt to ${req.path}`,
        status: "failure",
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        errorMessage: `Role ${req.user.role} not authorized for ${req.method} ${req.path}`
      }).catch(console.error);

      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} is not authorized to access this resource`
      });
    }

    next();
  };
};

// @desc    Check if user is admin
exports.adminOnly = (req, res, next) => {
  return exports.authorize("admin")(req, res, next);
};

// @desc    Check if user is member or admin
exports.memberOrAdmin = (req, res, next) => {
  return exports.authorize("member", "admin")(req, res, next);
};

// @desc    Optional authentication - attach user if token exists
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (user && user.status === "Active") {
          req.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            studentId: user.studentId,
            role: user.role,
            status: user.status
          };
        }
      } catch (error) {
        // Token is invalid or expired, but we don't throw error
        console.error("Optional auth token error:", error.message);
      }
    }

    next();
  } catch (error) {
    console.error("Optional auth middleware error:", error);
    next();
  }
};

// @desc    Check resource ownership
exports.checkOwnership = (modelName, idParam = "id", userField = "user") => {
  return async (req, res, next) => {
    try {
      const Model = require(`../models/${modelName}.model`);
      const resourceId = req.params[idParam];

      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: "Resource ID is required"
        });
      }

      const resource = await Model.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: "Resource not found"
        });
      }

      // Check if user owns the resource or is admin
      const resourceOwner = resource[userField]?.toString();
      const currentUser = req.user.id;

      if (req.user.role !== "admin" && resourceOwner !== currentUser) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to access this resource"
        });
      }

      // Attach resource to request for use in controller
      req.resource = resource;
      next();
    } catch (error) {
      console.error("Check ownership middleware error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to verify resource ownership"
      });
    }
  };
};

// @desc    Rate limiting middleware
exports.rateLimit = (maxRequests = 100, windowMinutes = 15) => {
  const requests = new Map();

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;

    if (!requests.has(ip)) {
      requests.set(ip, []);
    }

    const userRequests = requests.get(ip);
    
    // Remove old requests
    const recentRequests = userRequests.filter(time => now - time < windowMs);
    requests.set(ip, recentRequests);

    // Check if rate limit exceeded
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later."
      });
    }

    // Add current request
    recentRequests.push(now);

    // Set headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - recentRequests.length);
    res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());

    next();
  };
};

// @desc    Maintenance mode middleware
exports.maintenanceMode = async (req, res, next) => {
  try {
    const Settings = require("../models/Settings.model");
    const settings = await Settings.getSettings();

    if (settings.maintenanceMode?.enabled) {
      // Check if IP is allowed
      const allowedIPs = settings.maintenanceMode.allowedIPs || [];
      const clientIP = req.ip;

      if (allowedIPs.includes(clientIP)) {
        return next();
      }

      // Check if user is admin
      if (req.user && req.user.role === "admin") {
        return next();
      }

      // Return maintenance response
      return res.status(503).json({
        success: false,
        message: settings.maintenanceMode.message || "System is under maintenance",
        maintenance: true,
        estimatedRestore: settings.maintenanceMode.estimatedRestore
      });
    }

    next();
  } catch (error) {
    console.error("Maintenance mode middleware error:", error);
    next();
  }
};

// @desc    CSRF protection middleware
exports.csrfProtection = (req, res, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // Check CSRF token
  const csrfToken = req.headers["x-csrf-token"] || req.body._csrf;
  const sessionToken = req.session?.csrfToken;

  if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
    return res.status(403).json({
      success: false,
      message: "Invalid CSRF token"
    });
  }

  next();
};

// @desc    Validate request source (API key or Referer)
exports.validateSource = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  const referer = req.headers.referer || req.headers.referrer;

  // Check API key (if required)
  if (process.env.API_KEY_REQUIRED === "true" && !apiKey) {
    return res.status(401).json({
      success: false,
      message: "API key is required"
    });
  }

  if (apiKey && apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      success: false,
      message: "Invalid API key"
    });
  }

  // Check referer if needed
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : [];

  if (allowedOrigins.length > 0 && referer) {
    const origin = new URL(referer).origin;
    if (!allowedOrigins.includes(origin)) {
      return res.status(403).json({
        success: false,
        message: "Request origin not allowed"
      });
    }
  }

  next();
};