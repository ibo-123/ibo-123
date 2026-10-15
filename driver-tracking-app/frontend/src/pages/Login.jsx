import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../service/authService";
import { useAuth } from "../context/AuthContext";
import "./Login.css"; // We'll create this CSS file

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const data = await loginUser(email, password);
      login(data);

      if (data.user.role === "driver") {
        navigate("/driver");
      } else {
        navigate("/customer");
      }
    } catch (error) {
      setError(error.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Brand Section */}
        <div className="login-brand">
          <div className="brand-icon">🚚</div>
          <h1>Delivery Tracker</h1>
          <p>Sign in to manage your deliveries</p>
        </div>

        {/* Login Form */}
        <div className="login-card">
          <h2>Welcome Back</h2>
          <p className="login-subtitle">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit} className="login-form">
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
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="form-input"
                disabled={loading}
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
              className="login-btn"
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Logging in...
                </>
              ) : (
                "Sign In"
              )}
            </button>

            {/* Divider */}
            <div className="divider">
              <span>or</span>
            </div>

            {/* Register Link */}
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="register-btn"
              disabled={loading}
            >
              Create New Account
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <p>© 2026 Delivery Tracker. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

export default Login;