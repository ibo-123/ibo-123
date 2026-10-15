import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../service/authService";
import { useAuth } from "../context/AuthContext";
import "./Register.css"; // We'll create this CSS file

function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validation
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await registerUser({
        name,
        email,
        password,
        role,
      });

      login(data);

      if (data.user.role === "driver") {
        navigate("/driver");
      } else {
        navigate("/customer");
      }
    } catch (error) {
      setError(error.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        {/* Brand Section */}
        <div className="register-brand">
          <div className="brand-icon">📝</div>
          <h1>Create Account</h1>
          <p>Join our delivery network today</p>
        </div>

        {/* Registration Card */}
        <div className="register-card">
          <h2>Get Started</h2>
          <p className="register-subtitle">Fill in your details to create an account</p>

          <form onSubmit={handleSubmit} className="register-form">
            {/* Full Name Field */}
            <div className="form-group">
              <label htmlFor="name">
                <span className="label-icon">👤</span>
                Full Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                className="form-input"
                disabled={loading}
              />
            </div>

            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email">
                <span className="label-icon">📧</span>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="form-input"
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password">
                <span className="label-icon">🔒</span>
                Password
              </label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={6}
                  required
                  className="form-input password-input"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              <span className="input-hint">Password must be at least 6 characters</span>
            </div>

            {/* Role Selection */}
            <div className="form-group">
              <label htmlFor="role">
                <span className="label-icon">🎯</span>
                Account Type
              </label>
              <div className="role-selector">
                <button
                  type="button"
                  className={`role-option ${role === "customer" ? "active" : ""}`}
                  onClick={() => setRole("customer")}
                  disabled={loading}
                >
                  <span className="role-icon">🛒</span>
                  Customer
                  <span className="role-desc">Track deliveries</span>
                </button>
                <button
                  type="button"
                  className={`role-option ${role === "driver" ? "active" : ""}`}
                  onClick={() => setRole("driver")}
                  disabled={loading}
                >
                  <span className="role-icon">🚚</span>
                  Driver
                  <span className="role-desc">Make deliveries</span>
                </button>
              </div>
              <input
                type="hidden"
                value={role}
                onChange={() => {}}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-message">
                <span className="error-icon">❌</span>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="register-btn"
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>

            {/* Divider */}
            <div className="divider">
              <span>or</span>
            </div>

            {/* Login Link */}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="login-link-btn"
              disabled={loading}
            >
              Already have an account? <span>Sign In</span>
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="register-footer">
          <p>© 2026 Delivery Tracker. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

export default Register;