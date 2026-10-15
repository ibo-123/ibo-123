/** Public API for the identity domain. Cross-domain imports must use this barrel. */
export { AuthGate, AuthRedirect } from './AuthGate';
export {
  changePassword,
  fetchMe,
  login,
  logout,
  register,
  sendPhoneOtp,
  submitOnboarding,
  verifyPhoneOtp,
} from './api';
export {
  describeChangePasswordError,
  useChangePassword,
  type ChangePasswordErrorView,
} from './hooks/useChangePassword';
export { describeLoginError, useLogin, type LoginErrorView } from './hooks/useLogin';
export { useLogout } from './hooks/useLogout';
export { describeRegisterError, useRegister, type RegisterErrorView } from './hooks/useRegister';
export {
  describeVerifyOtpError,
  useVerifyOtp,
  type VerifyOtpErrorView,
} from './hooks/useVerifyOtp';
export { useMe } from './hooks/useMe';
export { SessionBridgeRegistrar } from './SessionBridgeRegistrar';
export { ChangePasswordScreen } from './screens/ChangePasswordScreen';
export { LoginScreen } from './screens/LoginScreen';
export { OnboardingScreen } from './screens/OnboardingScreen';
export { ProfileScreen } from './screens/ProfileScreen';
export { SignUpScreen } from './screens/SignUpScreen';
export { TwoFactorStubScreen } from './screens/TwoFactorStubScreen';
export { VerifyOtpScreen } from './screens/VerifyOtpScreen';
export {
  getSessionTokens,
  hasSessionTokens,
  useSessionStore,
  type SessionTokens,
} from './session.store';
export type {
  ChangePasswordRequest,
  ChangePasswordResult,
  CurrentUser,
  LoginOutcome,
  LoginRequest,
  LoginResponse,
  RegisterOutcome,
  RegisterRequest,
  RegisterResponse,
  SendOtpRequest,
  SendOtpResponse,
  TokenPairResponse,
  VerifyOtpOutcome,
  OnboardingRequest,
  OnboardingResult,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from './types';
