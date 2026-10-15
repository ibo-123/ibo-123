/** Contract §10 + §8.6 proposed fields on GET /auth/me */
export type CurrentUser = {
  id: string;
  phone_number?: string;
  email?: string;
  email_verified?: boolean;
  full_name: string;
  grade?: number;
  stream?: string;
  phone_verified?: boolean;
  two_factor_enabled?: boolean;
  onboarded: boolean;
  auth_providers?: string[];
};

export type TokenPairResponse = {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
};

/** Contract §6 */
export type LoginRequest = {
  phone_number: string;
  password: string;
};

/** Contract §8.1 shared shape — the backend also returns it on login; §6 doesn't promise it. */
export type LoginUserSummary = {
  id: string;
  full_name: string;
  onboarded: boolean;
};

/** Contract §6 */
export type LoginResponse =
  | (TokenPairResponse & { requires_2fa: false; user?: LoginUserSummary })
  | {
      access_token: null;
      refresh_token: null;
      token_type: 'Bearer';
      requires_2fa: true;
      two_factor_token: string;
    };

export type LoginOutcome =
  | { status: 'signed_in'; onboarded: boolean }
  /** Phase 2 (MOB-18). Nothing is persisted; the challenge token is dropped. */
  | { status: 'two_factor_required' };

/** Contract §4.1 — mobile also sends `password_confirm` so today’s Django register accepts it. */
export type RegisterRequest = {
  phone_number: string;
  password: string;
  password_confirm: string;
  full_name: string;
};

/** Contract §4.1 */
export type RegisterResponse = {
  id: string;
  phone_number: string;
  full_name: string;
  phone_verified: boolean;
  onboarded: boolean;
};

/** Contract §5.1 */
export type SendOtpRequest = {
  phone_number: string;
};

/** Contract §5.1 */
export type SendOtpResponse = {
  message: string;
  expires_in: number;
};

/** After register → send-otp; Verify OTP (MOB-14) consumes this. */
export type RegisterOutcome = {
  phone_number: string;
  expires_in: number;
};

/** Contract §5.2 */
export type VerifyOtpRequest = {
  phone_number: string;
  otp: string;
};

/** Contract §5.2 success — tokens + verified user. */
export type VerifyOtpResponse = TokenPairResponse & {
  user: {
    id: string;
    phone_number?: string;
    full_name: string;
    phone_verified?: boolean;
    onboarded: boolean;
  };
};

export type VerifyOtpOutcome = {
  onboarded: boolean;
};

/** Contract §11. Grade 12 + Natural or Social Science. */
export type OnboardingRequest = {
  grade: 12;
  stream: 'natural_science' | 'social_science';
};

export type OnboardingResult = {
  onboarded: true;
  grade: number;
  stream: string;
};

/** Contract §12. Backend also accepts `old_password` and requires `new_password_confirm`. */
export type ChangePasswordRequest = {
  current_password: string;
  new_password: string;
  new_password_confirm: string;
};

export type ChangePasswordResult = {
  accessToken: string;
  refreshToken: string;
};
