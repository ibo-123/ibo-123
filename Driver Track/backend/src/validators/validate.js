import ApiError from "../utils/ApiError.js";

/**
 * Lightweight, dependency-free request validator.
 * `schema` maps field -> array of check functions; each check returns
 * an error string (or null/undefined if valid).
 *
 * Example:
 *   validateBody({
 *     email: [required, isEmail],
 *     password: [required, minLength(8)],
 *   })
 */
export const validateBody = (schema) => (req, res, next) => {
  const errors = {};

  for (const [field, checks] of Object.entries(schema)) {
    const value = req.body[field];
    for (const check of checks) {
      const error = check(value, req.body);
      if (error) {
        errors[field] = error;
        break;
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, "Validation failed", errors);
  }

  next();
};

export const required = (value) =>
  value === undefined || value === null || value === "" ? "This field is required." : null;

export const isEmail = (value) =>
  value && !/^\S+@\S+\.\S+$/.test(value) ? "Must be a valid email address." : null;

export const minLength = (n) => (value) =>
  value && String(value).length < n ? `Must be at least ${n} characters.` : null;

export const isIn = (allowed) => (value) =>
  value && !allowed.includes(value) ? `Must be one of: ${allowed.join(", ")}.` : null;

export const isNumber = (value) =>
  value !== undefined && value !== null && typeof value !== "number" ? "Must be a number." : null;

export const isLatitude = (value) =>
  typeof value === "number" && (value < -90 || value > 90) ? "Latitude must be between -90 and 90." : null;

export const isLongitude = (value) =>
  typeof value === "number" && (value < -180 || value > 180) ? "Longitude must be between -180 and 180." : null;

export default { validateBody, required, isEmail, minLength, isIn, isNumber, isLatitude, isLongitude };
