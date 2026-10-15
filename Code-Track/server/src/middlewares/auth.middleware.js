import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  try {
    // Get Authorization header
    const authHeader = req.headers.authorization;
    console.log('[AUTH] Authorization header:', authHeader ? 'Present' : 'Missing');

    // Check if header exists
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log('[AUTH] No token provided');
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // Extract token
    const token = authHeader.split(" ")[1];
    console.log('[AUTH] Token extracted (first 10 chars):', token.substring(0, 10) + '...');

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('[AUTH] Token verified for user:', decoded.id || decoded.userId);

    // Attach user info to request
    req.user = decoded;

    next();
  } catch (error) {
    console.error('[AUTH] Token verification failed:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }
    
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export default authMiddleware;