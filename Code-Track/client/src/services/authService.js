
import api from "./api";

export const loginUser = async (data) => {
  const response = await api.post("/auth/login", data);
  return response.data;
};

export const registerUser = async (data) => {
  const response = await api.post("/auth/register", data);
  return response.data;
};

// Legacy email-token verification
export const verifyEmailToken = async (token) => {
  const response = await api.get(
    `/auth/verify-email?token=${encodeURIComponent(token)}`
  );

  return response.data;
};

// Legacy email-token resend
export const resendVerificationEmail = async (email) => {
  const response = await api.post("/auth/resend-verification", {
    email,
  });

  return response.data;
};

// OTP verification
export const verifyOtp = async (data) => {
  const response = await api.post("/auth/verify-otp", data);
  return response.data;
};

// OTP resend
export const resendOtp = async (data) => {
  const response = await api.post("/auth/resend-otp", data);
  return response.data;
};
