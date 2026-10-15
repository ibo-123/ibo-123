const PHONE_SEPARATORS = /[\s\-().]+/g;
const ETHIOPIAN_NATIONAL = /^[79]\d{8}$/;

/**
 * Normalise an Ethiopian mobile number to E.164 (`+2519XXXXXXXX` / `+2517XXXXXXXX`).
 * Accepts what students type next to the fixed +251 prefix (`91 234 5678`), the local
 * form (`0912345678`), and country-code forms (`251…`, `+251…`).
 * Returns `null` instead of guessing when the input isn't a valid Ethiopian mobile number.
 * Rules match the backend's `normalize_ethiopian_phone`.
 */
export function toEthiopianE164(input: string): string | null {
  const cleaned = input.trim().replace(PHONE_SEPARATORS, '');
  if (!/^\+?\d+$/.test(cleaned)) {
    return null;
  }

  let national: string;
  if (cleaned.startsWith('+')) {
    if (!cleaned.startsWith('+251')) {
      return null;
    }
    national = cleaned.slice(4);
  } else if (/^251\d{9}$/.test(cleaned)) {
    national = cleaned.slice(3);
  } else if (/^0\d{9}$/.test(cleaned)) {
    national = cleaned.slice(1);
  } else {
    national = cleaned;
  }

  return ETHIOPIAN_NATIONAL.test(national) ? `+251${national}` : null;
}
