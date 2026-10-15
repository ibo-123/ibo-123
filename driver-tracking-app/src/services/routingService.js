import { haversineDistanceKm } from "../utils/geo.js";

// Assumed average urban delivery speed (km/h) used for the straight-line ETA
// fallback. Swap this module's implementation for OSRM/OpenRouteService/Google
// Directions to get real road-network distance, ETA, and route geometry -
// the rest of the app only depends on the shape returned by estimateRoute().
const ASSUMED_AVERAGE_SPEED_KMH = 30;

/**
 * Estimates distance and ETA between two points.
 * Returns { distanceKm, etaMinutes }.
 *
 * This is a placeholder implementation using a straight-line (haversine)
 * distance. Replace the body of this function with a call to a real
 * routing provider (OSRM/OpenRouteService/Google Directions) for
 * production use - callers do not need to change.
 */
export async function estimateRoute(origin, destination) {
  const distanceKm = haversineDistanceKm(
    origin.latitude,
    origin.longitude,
    destination.latitude,
    destination.longitude
  );
  const etaMinutes = Math.round((distanceKm / ASSUMED_AVERAGE_SPEED_KMH) * 60);

  return {
    distanceKm: Math.round(distanceKm * 100) / 100,
    etaMinutes,
  };
}

export default { estimateRoute };
