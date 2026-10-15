import { useState } from "react";
import { changePassword } from "../../services/settingsService";
import { Eye, EyeOff, CheckCircle, AlertCircle, Lock, Key } from "lucide-react";

function ChangePassword() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value
    });
    // Clear errors when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ""
      });
    }
    // Clear success message when user types
    if (successMessage) {
      setSuccessMessage("");
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Current password validation
    if (!form.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    // New password validation
    if (!form.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (form.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(form.newPassword)) {
      newErrors.newPassword = "Password must contain at least one uppercase letter";
    } else if (!/[a-z]/.test(form.newPassword)) {
      newErrors.newPassword = "Password must contain at least one lowercase letter";
    } else if (!/[0-9]/.test(form.newPassword)) {
      newErrors.newPassword = "Password must contain at least one number";
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.newPassword)) {
      newErrors.newPassword = "Password must contain at least one special character";
    }

    // Confirm password validation
    if (form.confirmPassword && form.newPassword !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setSuccessMessage("");

    try {
      const res = await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      });

      setSuccessMessage(res.message || "Password changed successfully!");
      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 5000);

    } catch (error) {
      const errorMessage = error.response?.data?.message || "Something went wrong";
      setErrors({
        currentPassword: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function for password strength indicator
  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(form.newPassword);
  const getStrengthColor = (strength) => {
    if (strength === 0) return "bg-gray-200";
    if (strength <= 2) return "bg-red-500";
    if (strength <= 3) return "bg-yellow-500";
    if (strength <= 4) return "bg-blue-500";
    return "bg-green-500";
  };

  const getStrengthLabel = (strength) => {
    if (strength === 0) return "";
    if (strength <= 2) return "Weak";
    if (strength <= 3) return "Fair";
    if (strength <= 4) return "Good";
    return "Strong";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-md mx-auto">
      {/* Title */}
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Key className="w-5 h-5 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800">
          Change Password
        </h3>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700 font-medium">
            {successMessage}
          </p>
        </div>
      )}

      {/* Current Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Current Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type={showCurrentPassword ? "text" : "password"}
            name="currentPassword"
            placeholder="Enter current password"
            value={form.currentPassword}
            onChange={handleChange}
            disabled={isLoading}
            className={`
              w-full pl-10 pr-12 py-3 border rounded-xl
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition-all
              ${errors.currentPassword 
                ? "border-red-300 bg-red-50" 
                : "border-gray-200 hover:border-gray-300"
              }
              ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
            `}
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {showCurrentPassword ? (
              <EyeOff className="w-5 h-5 text-gray-400" />
            ) : (
              <Eye className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>
        {errors.currentPassword && (
          <div className="mt-1.5 flex items-center gap-1 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{errors.currentPassword}</span>
          </div>
        )}
      </div>

      {/* New Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          New Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type={showNewPassword ? "text" : "password"}
            name="newPassword"
            placeholder="Enter new password"
            value={form.newPassword}
            onChange={handleChange}
            disabled={isLoading}
            className={`
              w-full pl-10 pr-12 py-3 border rounded-xl
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition-all
              ${errors.newPassword 
                ? "border-red-300 bg-red-50" 
                : "border-gray-200 hover:border-gray-300"
              }
              ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
            `}
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {showNewPassword ? (
              <EyeOff className="w-5 h-5 text-gray-400" />
            ) : (
              <Eye className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>

        {/* Password Strength Indicator */}
        {form.newPassword && (
          <div className="mt-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getStrengthColor(passwordStrength)} transition-all duration-300`}
                  style={{ width: `${(passwordStrength / 5) * 100}%` }}
                />
              </div>
              {getStrengthLabel(passwordStrength) && (
                <span className="text-xs font-medium text-gray-600">
                  {getStrengthLabel(passwordStrength)}
                </span>
              )}
            </div>
            {errors.newPassword && (
              <div className="mt-1.5 flex items-center gap-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errors.newPassword}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Confirm New Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            placeholder="Confirm new password"
            value={form.confirmPassword}
            onChange={handleChange}
            disabled={isLoading}
            className={`
              w-full pl-10 pr-12 py-3 border rounded-xl
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition-all
              ${errors.confirmPassword 
                ? "border-red-300 bg-red-50" 
                : "border-gray-200 hover:border-gray-300"
              }
              ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
            `}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {showConfirmPassword ? (
              <EyeOff className="w-5 h-5 text-gray-400" />
            ) : (
              <Eye className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <div className="mt-1.5 flex items-center gap-1 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{errors.confirmPassword}</span>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className={`
          w-full bg-gradient-to-r from-blue-600 to-blue-700
          text-white py-3 rounded-xl font-medium
          hover:from-blue-700 hover:to-blue-800
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          transition-all duration-200
          flex items-center justify-center gap-2
          ${isLoading ? "opacity-70 cursor-not-allowed" : ""}
        `}
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Changing Password...
          </>
        ) : (
          "Change Password"
        )}
      </button>
    </form>
  );
}

export default ChangePassword;