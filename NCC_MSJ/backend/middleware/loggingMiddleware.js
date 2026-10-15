const morgan = require("morgan");
const AuditLog = require("../models/AuditLog.model");

// Custom Morgan token for user ID
morgan.token("user-id", (req) => {
  return req.user?.id || "anonymous";
});

// Custom Morgan token for response time in milliseconds
morgan.token("response-time-ms", (req, res) => {
  return `${res.get("X-Response-Time")}ms`;
});

// Development format
const devFormat = ":method :url :status :response-time-ms - :user-id";

// Production format (minimal)
const prodFormat = ":remote-addr - :user-id [:date[clf]] \":method :url HTTP/:http-version\" :status :res[content-length] \":referrer\" \":user-agent\"";

// @desc    Morgan logger middleware
exports.morganLogger = (env = process.env.NODE_ENV) => {
  const format = env === "production" ? prodFormat : devFormat;
  
  return morgan(format, {
    stream: {
      write: (message) => {
        console.log(message.trim());
      }
    }
  });
};

// @desc    Request logging middleware
exports.requestLogger = async (req, res, next) => {
  const startTime = Date.now();
  
  // Capture response finish
  res.on("finish", async () => {
    const duration = Date.now() - startTime;
    
    // Only log API requests, not static files
    if (req.originalUrl.startsWith("/api")) {
      try {
        await AuditLog.log({
          userId: req.user?.id,
          action: req.method.toLowerCase(),
          resource: req.path,
          resourceName: `${req.method} ${req.path}`,
          status: res.statusCode >= 400 ? "failure" : "success",
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
          executionTime: duration,
          memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024 // MB
        });
      } catch (error) {
        console.error("Failed to log request:", error);
      }
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      const statusColor = res.statusCode >= 400 ? "\x1b[31m" : "\x1b[32m"; // Red for errors, green for success
      const methodColor = req.method === "GET" ? "\x1b[36m" : 
                         req.method === "POST" ? "\x1b[33m" : 
                         req.method === "PUT" ? "\x1b[34m" : 
                         req.method === "DELETE" ? "\x1b[31m" : "\x1b[37m";
      
      console.log(
        `${methodColor}${req.method}\x1b[0m`,
        req.originalUrl,
        statusColor + res.statusCode + "\x1b[0m",
        `${duration}ms`,
        req.user?.id ? `(User: ${req.user.id})` : ""
      );
    }
  });
  
  // Add response time header
  res.setHeader("X-Response-Time", `${Date.now() - startTime}`);
  
  next();
};

// @desc    Response time middleware
exports.responseTime = (req, res, next) => {
  const start = Date.now();
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    res.setHeader("X-Response-Time", duration);
    
    // Log slow requests
    if (duration > 1000) { // More than 1 second
      console.warn(`Slow request detected: ${req.method} ${req.originalUrl} took ${duration}ms`);
    }
  });
  
  next();
};

// @desc    Performance monitoring middleware
exports.performanceMonitor = (req, res, next) => {
  const startMemory = process.memoryUsage();
  const startTime = Date.now();
  
  res.on("finish", () => {
    const endMemory = process.memoryUsage();
    const endTime = Date.now();
    
    const memoryDiff = endMemory.heapUsed - startMemory.heapUsed;
    const timeDiff = endTime - startTime;
    
    // Log performance issues
    if (timeDiff > 2000 || memoryDiff > 50 * 1024 * 1024) { // >2s or >50MB memory increase
      console.warn("Performance issue detected:", {
        url: req.originalUrl,
        method: req.method,
        duration: timeDiff,
        memoryIncrease: `${(memoryDiff / 1024 / 1024).toFixed(2)}MB`,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  next();
};

// @desc    Security headers middleware
exports.securityHeaders = (req, res, next) => {
  // Remove X-Powered-By header
  res.removeHeader("X-Powered-By");
  
  // Set security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  
  // Content Security Policy
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'"
  );
  
  next();
};

// @desc    CORS middleware
exports.cors = (req, res, next) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : ["http://localhost:3000"];
  
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-CSRF-Token, X-API-Key");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Max-Age", "86400"); // 24 hours
  
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  
  next();
};

// @desc    Request ID middleware
exports.requestId = (req, res, next) => {
  const requestId = crypto.randomUUID();
  
  req.requestId = requestId;
  res.setHeader("X-Request-ID", requestId);
  
  next();
};