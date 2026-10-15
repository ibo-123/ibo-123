import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Mail, ArrowLeft, RefreshCw, CheckCircle, Clock } from "lucide-react";

import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

import {
  verifyOtp,
  resendOtp,
} from "../services/authService";

function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [isSuccess, setIsSuccess] = useState(false);

  const inputRefs = useRef([]);

  // Redirect if user opens the page directly
  useEffect(() => {
    if (!email) {
      toast.error("Email information is missing.");
      navigate("/register");
    }
  }, [email, navigate]);

  // Countdown for resend
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((previous) => previous - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const handleOtpChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(0, 1);
    setOtp(newOtp);
    setError("");

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Move to previous input on backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }

    // Allow paste
    if (e.key === "v" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      const paste = e.clipboardData.getData("text");
      const digits = paste.replace(/\D/g, "").slice(0, 6);
      
      if (digits) {
        const newOtp = [...otp];
        digits.split("").forEach((digit, idx) => {
          if (idx < 6) newOtp[idx] = digit;
        });
        setOtp(newOtp);
        // Focus last filled input
        const focusIndex = Math.min(digits.length, 5);
        inputRefs.current[focusIndex].focus();
      }
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    const otpString = otp.join("");
    
    if (otpString.length !== 6) {
      const message = "Please enter the 6-digit OTP.";
      setError(message);
      toast.error(message);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await verifyOtp({
        email,
        otp: otpString,
      });

      setIsSuccess(true);
      toast.success(
        response.message || "Email verified successfully!"
      );

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Invalid or expired OTP.";

      setError(message);
      toast.error(message);
      
      // Clear OTP on error
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0].focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;

    setResending(true);
    setError("");

    try {
      const response = await resendOtp({
        email,
      });

      toast.success(
        response.message || "A new OTP has been sent."
      );

      setOtp(["", "", "", "", "", ""]);
      setCountdown(60);
      inputRefs.current[0].focus();
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to resend OTP.";

      setError(message);
      toast.error(message);
    } finally {
      setResending(false);
    }
  };

  if (!email) {
    return null;
  }

  const otpString = otp.join("");
  const isComplete = otpString.length === 6;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900">
              Verify your email
            </h1>

            <p className="text-sm text-gray-500 mt-2">
              We sent a 6-digit verification code to
            </p>

            <p className="font-medium text-gray-700 mt-1">
              {email}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 text-center">
                {error}
              </p>
            </div>
          )}

          {/* Success Message */}
          {isSuccess && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-600 font-medium">
                Verified! Redirecting...
              </p>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
            {/* OTP Inputs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Verification code
              </label>

              <div className="flex gap-2 justify-center">
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    placeholder="0"
                    inputMode="numeric"
                    maxLength={1}
                    className={`w-12 h-14 text-center text-2xl font-semibold rounded-lg border-2 transition-all duration-200 ${
                      digit 
                        ? "border-blue-500 bg-blue-50 text-blue-700" 
                        : "border-gray-200 hover:border-gray-300"
                    } ${
                      error ? "border-red-300 bg-red-50" : ""
                    } focus:border-blue-500 focus:ring-2 focus:ring-blue-200`}
                    disabled={loading || isSuccess}
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              <p className="text-xs text-gray-400 text-center mt-3">
                Enter the 6-digit code sent to your email
              </p>
            </div>

            {/* Verify Button */}
            <Button
              type="submit"
              disabled={loading || !isComplete || isSuccess}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Verifying...
                </span>
              ) : isSuccess ? (
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Verified!
                </span>
              ) : (
                "Verify Email"
              )}
            </Button>
          </form>

          {/* Resend Section */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Didn't receive the code?
              </p>

              <Button
                type="button"
                variant="link"
                onClick={handleResend}
                disabled={countdown > 0 || resending || isSuccess}
                className="mt-1 text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400"
              >
                {resending ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Sending...
                  </span>
                ) : countdown > 0 ? (
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Resend OTP in {countdown}s
                  </span>
                ) : (
                  "Resend OTP"
                )}
              </Button>
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/register")}
              className="w-full text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Register
            </Button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Secure verification powered by OTP
        </p>
      </div>
    </div>
  );
}

export default VerifyOtp;