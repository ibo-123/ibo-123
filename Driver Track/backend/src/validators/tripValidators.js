import ApiError from "../utils/ApiError.js";
import { isValidCoordinate } from "../utils/geo.js";

function validatePoint(point, label) {
  if (!point || typeof point !== "object") {
    return `${label} is required.`;
  }
  const { latitude, longitude } = point;
  if (!isValidCoordinate(latitude, longitude)) {
    return `${label} must have a valid latitude (-90 to 90) and longitude (-180 to 180).`;
  }
  return null;
}

/**
 * Validates trip creation payloads. Kept as an explicit function (rather than
 * the generic schema helper) because origin/destination are nested objects.
 */
export function createTripValidator(req, res, next) {
  const { customerId, origin, destination } = req.body;
  const errors = {};

  if (!customerId) errors.customerId = "customerId is required.";

  const originError = validatePoint(origin, "origin");
  if (originError) errors.origin = originError;

  const destinationError = validatePoint(destination, "destination");
  if (destinationError) errors.destination = destinationError;

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, "Validation failed", errors);
  }

  next();
}

export default { createTripValidator };
