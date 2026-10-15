import { validateBody, required, isEmail, minLength, isIn } from "./validate.js";
import { ROLE_VALUES } from "../model/User.js";

export const registerValidator = validateBody({
  name: [required],
  email: [required, isEmail],
  password: [required, minLength(8)],
  role: [(value) => (value ? isIn(ROLE_VALUES)(value) : null)],
});

export const loginValidator = validateBody({
  email: [required, isEmail],
  password: [required],
});


export const forgotPasswordValidator = validateBody({
  email: [required, isEmail],
});

export const verifyOtpValidator = validateBody({
  email: [required, isEmail],
  otp: [required, minLength(6)],
  mode: [],
  newPassword: [],
});

export const resendOtpValidator = validateBody({
  email: [required, isEmail],
  mode: [],
});

export default {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  verifyOtpValidator,
  resendOtpValidator,
};
