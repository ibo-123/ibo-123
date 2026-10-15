const compression = require("compression");
const zlib = require("zlib");

// @desc    Compression middleware
exports.compress = (options = {}) => {
  return compression({
    level: zlib.constants.Z_BEST_COMPRESSION,
    threshold: 1024, // Only compress responses larger than 1KB
    filter: (req, res) => {
      // Don't compress if x-no-compression header is present
      if (req.headers["x-no-compression"]) {
        return false;
      }
      
      // Use compression filter
      return compression.filter(req, res);
    },
    ...options
  });
};

// @desc    Gzip compression for specific routes
exports.gzipCompression = () => {
  return (req, res, next) => {
    // Skip for certain file types
    const skipTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/mpeg",
      "application/pdf",
      "application/zip"
    ];
    
    if (skipTypes.includes(res.getHeader("Content-Type"))) {
      return next();
    }
    
    // Apply compression
    return exports.compress()(req, res, next);
  };
};

// @desc    Brotli compression (better than gzip)
exports.brotliCompression = () => {
  const brotli = require("iltorb"); // You need to install iltorb
  
  return (req, res, next) => {
    // Check if browser supports brotli
    const acceptEncoding = req.headers["accept-encoding"] || "";
    
    if (acceptEncoding.includes("br")) {
      res.setHeader("Content-Encoding", "br");
      
      const brotliCompress = brotli.compressStream({
        quality: 11 // Maximum compression
      });
      
      const originalWrite = res.write;
      const originalEnd = res.end;
      
      res.write = function(data) {
        brotliCompress.write(data);
        return true;
      };
      
      res.end = function(data) {
        if (data) {
          brotliCompress.write(data);
        }
        
        brotliCompress.end();
        brotliCompress.pipe(res);
        
        originalEnd.call(res);
      };
    }
    
    next();
  };
};

// @desc    Response size logger
exports.responseSizeLogger = (req, res, next) => {
  const originalWrite = res.write;
  const originalEnd = res.end;
  
  let responseSize = 0;
  
  res.write = function(chunk, encoding, callback) {
    if (chunk) {
      responseSize += chunk.length;
    }
    return originalWrite.call(this, chunk, encoding, callback);
  };
  
  res.end = function(chunk, encoding, callback) {
    if (chunk) {
      responseSize += chunk.length;
    }
    
    // Log large responses
    if (responseSize > 1024 * 1024) { // More than 1MB
      console.warn(`Large response detected: ${req.method} ${req.originalUrl} - ${(responseSize / 1024 / 1024).toFixed(2)}MB`);
    }
    
    // Set response size header
    res.setHeader("X-Response-Size", responseSize);
    
    return originalEnd.call(this, chunk, encoding, callback);
  };
  
  next();
};