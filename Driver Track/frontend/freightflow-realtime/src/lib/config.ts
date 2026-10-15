/**
 * Runtime configuration.
 *
 * Never hardcode localhost: both values come from Vite env vars so the same
 * build works from a phone on the LAN (e.g. VITE_API_URL=http://10.0.0.12:5000).
 * When the vars are missing we fall back to the current host on port 5000,
 * which keeps LAN access working without a rebuild.
 */
const FALLBACK_PORT = "5000";

function hostFallback() {
  if (typeof window === "undefined") return `http://localhost:${FALLBACK_PORT}`;
  return `${window.location.protocol}//${window.location.hostname}:${FALLBACK_PORT}`;
}

export function getApiUrl(): string {
  return (import.meta.env['VITE_API_URL'] as string | undefined) || hostFallback();
}

export function getSocketUrl(): string {
  const rawUrl = (import.meta.env['VITE_SOCKET_URL'] as string | undefined) || getApiUrl();
  return rawUrl.replace(/\/+$/, "").replace(/\/api$/i, "");
}

export const TOKEN_STORAGE_KEY = "habeshafreight.token";
export const USER_STORAGE_KEY = "habeshafreight.user";
export const THEME_STORAGE_KEY = "habeshafreight.theme";

/** TRIP-XXXXXX (6+ alphanumeric, case-insensitive) */
export const TRIP_ID_PATTERN = /^TRIP-[A-Z0-9]{4,12}$/i;

export function normalizeTripId(value: string): string {
  return value.trim().toUpperCase();
}

export function isValidTripId(value: string): boolean {
  return TRIP_ID_PATTERN.test(normalizeTripId(value));
}
