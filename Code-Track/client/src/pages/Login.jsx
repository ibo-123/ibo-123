// pages/Login.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  LogIn, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Code2,
  Shield,
  Fingerprint,

} from "lucide-react";

import { loginUser } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

// Custom Chrome icon as a fallback
const ChromeIcon = ({ className }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="4"/>
    <line x1="21.17" y1="8" x2="12" y2="8"/>
    <line x1="3.95" y1="6.06" x2="8.54" y2="14"/>
    <line x1="10.88" y1="21.94" x2="15.46" y2="14"/>
  </svg>
);
const Github = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.49.5.092.682-.217.682-.483 0-.237-.009-.866-.013-1.7-2.782.604-3.369-1.342-3.369-1.342-.455-1.157-1.11-1.465-1.11-1.465-.908-.62.069-.608.069-.608 1.004.071 1.532 1.03 1.532 1.03.892 1.529 2.341 1.087 2.91.831.091-.646.349-1.087.635-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0 1 12 6.844a9.56 9.56 0 0 1 2.504.337c1.909-1.294 2.748-1.025 2.748-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.744 0 .268.18.58.688.482A10.002 10.002 0 0 0 22 12C22 6.477 17.523 2 12 2Z" />
  </svg>
);
function Login() {
  const navigate = useNavigate();
  const { saveToken } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [touched, setTouched] = useState({});

  // Load saved email from localStorage
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setForm(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value,
    });
    setError("");
    
    if (name === "email") setEmailError("");
    if (name === "password") setPasswordError("");
  };

  const handleBlur = (e) => {
    setTouched({
      ...touched,
      [e.target.name]: true,
    });
    
    if (e.target.name === "email" && e.target.value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(e.target.value)) {
        setEmailError("Please enter a valid email address");
      }
    }
  };

  const validate = () => {
    let isValid = true;
    const errors = {};

    if (!form.email) {
      errors.email = "Email is required";
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        errors.email = "Please enter a valid email address";
        isValid = false;
      }
    }

    if (!form.password) {
      errors.password = "Password is required";
      isValid = false;
    } else if (form.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
      isValid = false;
    }

    return { isValid, errors };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // prevent duplicate submissions when a request is in-flight
    if (loading) return;

    setTouched({ email: true, password: true });
    
    const { isValid, errors } = validate();
    
    if (!isValid) {
      setEmailError(errors.email || "");
      setPasswordError(errors.password || "");
      toast.error("Please fix the errors before continuing");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await loginUser(form);
      saveToken(data.token);

      if (rememberMe) {
        localStorage.setItem("rememberedEmail", form.email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      toast.success("Welcome back! Redirecting to dashboard...");
      
      setTimeout(() => {
        navigate("/dashboard");
      }, 500);

    } catch (error) {
      console.log("========== LOGIN DEBUG ==========");
  console.log("Request data:", form);
  console.log("Status:", error.response?.status);
  console.log("Response:", error.response?.data);
  console.log("Message:", error.response?.data?.message);
  console.log("=================================");

  const message =
    error.response?.data?.message ||
    (error.response?.status === 500
      ? "Server error. Please try again later."
      : "Login failed. Please try again.");

  setError(message);
  toast.error(message);

  setForm((prev) => ({ ...prev, password: "" }));
  setPasswordError("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setForm({
      email: "demo@codetrack.com",
      password: "Demo@1234"
    });
    setTouched({ email: true, password: true });
    toast.info("Demo credentials loaded");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"></div>
          
          {/* Header */}
          <div className="text-center mb-8 relative">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 mb-4 shadow-lg relative">
              <Code2 className="w-10 h-10 text-white" />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                <LogIn className="w-4 h-4 text-white" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome Back
            </h1>
            
            <p className="text-sm text-gray-500 mt-2">
              Sign in to continue tracking your progress
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-600 font-medium">Login Failed</p>
                <p className="text-xs text-red-500 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Demo Credentials */}
          <button
            type="button"
            onClick={fillDemoCredentials}
            className="mb-6 w-full p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-xl hover:border-blue-200 transition-colors group"
          >
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 group-hover:text-gray-800">
              <Fingerprint className="w-4 h-4 text-blue-500" />
              <span>Use Demo Credentials</span>
              <ArrowRight className="w-4 h-4 text-blue-500 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 relative">
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
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="you@example.com"
                  disabled={loading}
                  className={`pl-10 h-12 ${
                    touched.email && emailError 
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200" 
                      : touched.email && form.email && !emailError
                        ? "border-green-300 focus:border-green-500 focus:ring-green-200"
                        : ""
                  }`}
                  autoFocus
                />
                {touched.email && form.email && !emailError && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
              {touched.email && emailError && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {emailError}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter your password"
                  disabled={loading}
                  autoComplete="current-password"
                  className={`pl-10 pr-12 h-12 ${
                    touched.password && passwordError 
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200" 
                      : touched.password && form.password && !passwordError
                        ? "border-green-300 focus:border-green-500 focus:ring-green-200"
                        : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {touched.password && passwordError && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {passwordError}
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-400">Secure</span>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign in
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </form>

          {/* Social Login */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-4 bg-white text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
              >
                <ChromeIcon className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">Google</span>
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
              >
                <Github className="w-5 h-5 text-gray-700" />
                <span className="text-sm font-medium text-gray-700">GitHub</span>
              </button>
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500 text-center">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                Create one now
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400 flex items-center justify-center gap-2">
            <Shield className="w-3 h-3" />
            Your credentials are encrypted and secure
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;