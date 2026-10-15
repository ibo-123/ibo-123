const NodeCache = require("node-cache");
const crypto = require("crypto");

// Create cache instance
const cache = new NodeCache({
  stdTTL: 300, // Default TTL: 5 minutes
  checkperiod: 60, // Check for expired keys every 60 seconds
  useClones: false // Better performance
});

// Generate cache key from request
const generateCacheKey = (req) => {
  const keyParts = [
    req.method,
    req.originalUrl,
    JSON.stringify(req.query),
    JSON.stringify(req.body),
    req.user?.id || "anonymous"
  ];
  
  const keyString = keyParts.join("|");
  return crypto.createHash("md5").update(keyString).digest("hex");
};

// @desc    Cache middleware
exports.cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }
    
    // Skip cache for authenticated users with certain roles
    if (req.user?.role === "admin") {
      return next();
    }
    
    const key = generateCacheKey(req);
    const cachedResponse = cache.get(key);
    
    if (cachedResponse) {
      console.log(`Cache hit for key: ${key}`);
      
      // Set cache headers
      res.setHeader("X-Cache", "HIT");
      res.setHeader("X-Cache-Key", key);
      res.setHeader("X-Cache-TTL", cache.getTtl(key) - Date.now());
      
      return res.json(cachedResponse);
    }
    
    console.log(`Cache miss for key: ${key}`);
    
    // Override res.json to cache response
    const originalJson = res.json;
    
    res.json = function(data) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, data, duration);
        
        // Set cache headers
        res.setHeader("X-Cache", "MISS");
        res.setHeader("X-Cache-Key", key);
        res.setHeader("X-Cache-TTL", duration * 1000);
        res.setHeader("Cache-Control", `public, max-age=${duration}`);
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// @desc    Clear cache for specific routes
exports.clearCache = (patterns = []) => {
  return (req, res, next) => {
    // Store original send function
    const originalSend = res.send;
    
    res.send = function(data) {
      // Clear cache after successful non-GET requests
      if (req.method !== "GET" && res.statusCode >= 200 && res.statusCode < 300) {
        const keys = cache.keys();
        
        keys.forEach(key => {
          // Clear cache based on patterns
          let shouldClear = false;
          
          if (patterns.length === 0) {
            shouldClear = true; // Clear all if no patterns specified
          } else {
            patterns.forEach(pattern => {
              if (key.includes(pattern)) {
                shouldClear = true;
              }
            });
          }
          
          if (shouldClear) {
            cache.del(key);
            console.log(`Cleared cache key: ${key}`);
          }
        });
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

// @desc    Cache statistics middleware
exports.cacheStats = (req, res, next) => {
  if (req.path === "/api/cache/stats" && req.user?.role === "admin") {
    const stats = cache.getStats();
    const keys = cache.keys();
    
    return res.json({
      success: true,
      data: {
        stats,
        keysCount: keys.length,
        keys: keys.slice(0, 50) // Show first 50 keys
      }
    });
  }
  
  if (req.path === "/api/cache/clear" && req.user?.role === "admin") {
    cache.flushAll();
    
    return res.json({
      success: true,
      message: "Cache cleared successfully"
    });
  }
  
  next();
};

// @desc    Cache specific data
exports.cacheData = (key, data, ttl = 300) => {
  cache.set(key, data, ttl);
  return data;
};

// @desc    Get cached data
exports.getCachedData = (key) => {
  return cache.get(key);
};

// @desc    Delete cached data
exports.deleteCachedData = (key) => {
  cache.del(key);
};

// @desc    Cache user-specific data
exports.cacheUserData = (userId, data, ttl = 300) => {
  const key = `user:${userId}:${Date.now()}`;
  return exports.cacheData(key, data, ttl);
};

// @desc    Get user cached data
exports.getUserCachedData = (userId) => {
  const keys = cache.keys().filter(key => key.startsWith(`user:${userId}:`));
  
  if (keys.length === 0) {
    return null;
  }
  
  // Get the most recent cached data
  const sortedKeys = keys.sort((a, b) => {
    const timestampA = parseInt(a.split(":").pop());
    const timestampB = parseInt(b.split(":").pop());
    return timestampB - timestampA;
  });
  
  return cache.get(sortedKeys[0]);
};