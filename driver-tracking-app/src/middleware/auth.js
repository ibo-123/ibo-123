import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import User from "../model/User.js";

/**
 * Verifies the Bearer JWT and attaches the authenticated user to req.user.
 * Never trust a role/id sent in the request body - identity always comes
 * from the verified token.
 */
export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    throw new ApiError(401, "Not authenticated. No token provided.");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(401, "Invalid or expired token.");
  }

  const user = await User.findById(decoded.sub);
  if (!user) throw new ApiError(401, "User no longer exists.");
  if (!user.isActive) throw new ApiError(403, "This account has been deactivated.");

  req.user = user;
  next();
});

/**
 * Restricts a route to a set of roles. Use after `protect`.
 * Example: router.get("/", protect, authorize("admin", "dispatcher"), handler)
 */
export const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) throw new ApiError(401, "Not authenticated.");
  if (!allowedRoles.includes(req.user.role)) {
    throw new ApiError(403, "You do not have permission to perform this action.");
  }
  next();
};

export default { protect, authorize };
