import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Code2,
  Shield,
  Check,
  X
} from "lucide-react";

import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { registerUser } from "../services/authService";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: "",
    color: "",
    requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
    }
  });

  // Password strength checker
  useEffect(() => {
    const pwd = form.password;
    const requirements = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    };

    const passed = Object.values(requirements).filter(Boolean).length;
    
    let score, label, color;
    if (pwd.length === 0) {
      score = 0;
      label = "Enter a password";
      color = "bg-slate-200";
    } else if (passed <= 2) {
      score = 1;
      label = "Weak";
      color = "bg-red-500";
    } else if (passed <= 3) {
      score = 2;
      label = "Fair";
      color = "bg-yellow-500";
    } else if (passed <= 4) {
      score = 3;
      label = "Good";
      color = "bg-blue-500";
    } else {
      score = 4;
      label = "Strong";
      color = "bg-green-500";
    }

    setPasswordStrength({ score, label, color, requirements });
  }, [form.password]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleBlur = (e) => {
    setTouched({
      ...touched,
      [e.target.name]: true,
    });
  };

  const validate = () => {
    const errors = {};

    if (!form.name.trim()) {
      errors.name = "Full name is required";
    } else if (form.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }

    if (!form.email) {
      errors.email = "Email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        errors.email = "Please enter a valid email address";
      }
    }

    if (!form.password) {
      errors.password = "Password is required";
    } else if (form.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    if (!form.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    const errors = validate();
    
    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      setError(firstError);
      toast.error(firstError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email,
        password: form.password,
      };

      const res = await registerUser(payload);

      toast.success(
        res.message || "Registration successful! Check your email for the OTP."
      );

      // Navigate to OTP verification page
      navigate("/verify-email", {
        state: {
          email: form.email,
        },
      });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Registration failed. Please try again.";

      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const errors = validate();
  const isFormValid = Object.keys(errors).length === 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 mb-4 shadow-lg">
              <Code2 className="w-8 h-8 text-white" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900">
              Create your account
            </h1>
            
            <p className="text-sm text-gray-500 mt-2">
              Start tracking your competitive programming journey
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="John Doe"
                  disabled={loading}
                  className={`pl-10 h-11 ${
                    touched.name && errors.name 
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200" 
                      : touched.name && form.name 
                        ? "border-green-300 focus:border-green-500 focus:ring-green-200"
                        : ""
                  }`}
                />
                {touched.name && form.name && !errors.name && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <Check className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
              {touched.name && errors.name && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <X className="w-3 h-3" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="you@example.com"
                  disabled={loading}
                  className={`pl-10 h-11 ${
                    touched.email && errors.email 
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200" 
                      : touched.email && form.email 
                        ? "border-green-300 focus:border-green-500 focus:ring-green-200"
                        : ""
                  }`}
                />
                {touched.email && form.email && !errors.email && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <Check className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
              {touched.email && errors.email && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <X className="w-3 h-3" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Min 8 characters"
                  disabled={loading}
                  className={`pl-10 pr-12 h-11 ${
                    touched.password && errors.password 
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200" 
                      : touched.password && form.password && passwordStrength.score >= 3
                        ? "border-green-300 focus:border-green-500 focus:ring-green-200"
                        : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {form.password && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${
                      passwordStrength.score <= 1 ? "text-red-500" :
                      passwordStrength.score <= 2 ? "text-yellow-500" :
                      passwordStrength.score <= 3 ? "text-blue-500" :
                      "text-green-500"
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>

                  {/* Password Requirements */}
                  <div className="grid grid-cols-2 gap-1">
                    {Object.entries(passwordStrength.requirements).map(([key, met]) => (
                      <div key={key} className="flex items-center gap-1.5">
                        {met ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <div className="w-3 h-3 rounded-full border border-slate-300" />
                        )}
                        <span className={`text-[10px] ${
                          met ? "text-green-600" : "text-slate-400"
                        }`}>
                          {key === "length" ? "8+ characters" :
                           key === "uppercase" ? "Uppercase" :
                           key === "lowercase" ? "Lowercase" :
                           key === "number" ? "Number" :
                           "Special char"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {touched.password && errors.password && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <X className="w-3 h-3" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Confirm your password"
                  disabled={loading}
                  className={`pl-10 pr-12 h-11 ${
                    touched.confirmPassword && errors.confirmPassword 
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200" 
                      : touched.confirmPassword && form.confirmPassword && form.password === form.confirmPassword
                        ? "border-green-300 focus:border-green-500 focus:ring-green-200"
                        : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <X className="w-3 h-3" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Password Match Indicator */}
            {touched.confirmPassword && form.confirmPassword && !errors.confirmPassword && (
              <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <p className="text-xs text-green-600 font-medium">
                  Passwords match
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading || !isFormValid}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Creating account...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Create account
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </div>
          </form>

          {/* Security Badge */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-green-500" />
            <p className="text-xs text-gray-400">
              Your information is encrypted and secure
            </p>
          </div>

          {/* Login Link */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500 text-center">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/login")}
                className="font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

export default Register;