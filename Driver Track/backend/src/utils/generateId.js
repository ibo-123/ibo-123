const TRIP_ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I ambiguity
const TRIP_ID_LENGTH = 6;

/**
 * Generates a human-readable trip ID like "TRIP-H5UGGP".
 * Uniqueness against the database is enforced by the caller (see tripService),
 * which retries on collision.
 */
export function generateTripId() {
  let code = "";
  for (let i = 0; i < TRIP_ID_LENGTH; i++) {
    code += TRIP_ID_ALPHABET[Math.floor(Math.random() * TRIP_ID_ALPHABET.length)];
  }
  return `TRIP-${code}`;
}

/**
 * Normalizes user-entered trip IDs so lookups are case-insensitive
 * and forgiving of stray whitespace, e.g. " trip-h5uggp " -> "TRIP-H5UGGP".
 */
export function normalizeTripId(rawId = "") {
  return rawId.trim().toUpperCase();
}

/**
 * Generates a driver-facing ID like "DRV-4F2A".
 */
export function generateDriverId() {
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += TRIP_ID_ALPHABET[Math.floor(Math.random() * TRIP_ID_ALPHABET.length)];
  }
  return `DRV-${code}`;
}

/**
 * Generates a vehicle-facing ID like "VEH-9K3P".
 */
export function generateVehicleId() {
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += TRIP_ID_ALPHABET[Math.floor(Math.random() * TRIP_ID_ALPHABET.length)];
  }
  return `VEH-${code}`;
}

export default { generateTripId, normalizeTripId, generateDriverId, generateVehicleId };
