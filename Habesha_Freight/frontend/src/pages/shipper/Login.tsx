import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim()) {
      setError('Email address or phone number is required');
      return;
    }
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setIsLoading(true);

    try {
      const user = await login(identifier.trim(), password);

      const isPendingRole = user.role === 'DRIVER' || user.role === 'FLEET_OWNER';
      const isPendingStatus = user.kyc_status === 'PENDING' || user.status === 'PENDING_APPROVAL';

      if (isPendingRole && isPendingStatus) {
        navigate('/pending-approval');
      } else {
        const roleHome: Record<string, string> = {
          DRIVER: '/driver',
          FLEET_OWNER: '/company',
          ADMIN: '/admin',
          SHIPPER: '/dashboard',
        };
        navigate(roleHome[user.role] ?? '/');
      }
    } catch (err: any) {
      if (err.requires_otp_verification) {
        localStorage.setItem('registrationEmail', err.email || identifier.trim());
        navigate('/verify-otp');
        return;
      }
      setError(err.message || 'Login failed. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <header className="login-header">
        <div className="login-header-content">
          <Link to="/" className="login-back">
            ← Back
          </Link>
          <div className="login-brand">
            <span className="brand-icon">🚚</span>
            <span className="brand-habesha">Habesha</span>
            <span className="brand-freight">Freight</span>
          </div>
        </div>
      </header>

      <div className="login-page-content">
        <div className="login-card">
          <div className="auth-switch">
            <button className="auth-tab active">Log In</button>
            <Link to="/register" className="auth-tab">Register</Link>
          </div>

          <h1 className="login-welcome">Welcome back</h1>
          <p className="login-subtitle">Log in to your HabeshaFreight account.</p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address or Phone Number</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="dawit@example.com or +251..."
                disabled={isLoading}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={isLoading}
                  className="form-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                  disabled={isLoading}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="login-btn-primary"
            >
              {isLoading ? 'Logging in...' : 'Log In →'}
            </button>
          </form>

          <div className="login-register-prompt">
            Don't have an account? <Link to="/register" className="register-link">Register</Link>
          </div>
        </div>
      </div>
    </div>
  );
}