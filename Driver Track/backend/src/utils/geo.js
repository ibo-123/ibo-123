/**
 * Validates that a latitude/longitude pair is within legal bounds.
 * Guards against corrupted or spoofed GPS payloads before they hit the DB.
 */
export function isValidCoordinate(latitude, longitude) {
  if (typeof latitude !== "number" || typeof longitude !== "number") return false;
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return false;
  if (latitude < -90 || latitude > 90) return false;
  if (longitude < -180 || longitude > 180) return false;
  return true;
}

/**
 * Haversine great-circle distance between two points, in kilometers.
 * Used for a dependency-free distance/ETA estimate (see routingService).
 */
export function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default { isValidCoordinate, haversineDistanceKm };
