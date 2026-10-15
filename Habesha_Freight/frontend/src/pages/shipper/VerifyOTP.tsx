import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export default function VerifyOTP() {
  const navigate = useNavigate();
  const { verifyOtp } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [email, setEmail] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const savedEmail = localStorage.getItem('registrationEmail');
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (resendTimer === 0 && !canResend) {
      setCanResend(true);
    }
  }, [resendTimer, canResend]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(0, 1);
    setOtp(newOtp);
    setOtpError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d*$/.test(pasteData)) return;

    const digits = pasteData.split('');
    const newOtp = [...otp];
    digits.forEach((digit, idx) => {
      if (idx < 6) newOtp[idx] = digit;
    });
    setOtp(newOtp);

    const nextIndex = Math.min(digits.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join('');
    if (otpString.length < 6) {
      setOtpError('Please enter all 6 digits');
      return;
    }

    setIsVerifying(true);
    setOtpError('');

    try {
      const user = await verifyOtp(email, otpString);
      setOtpVerified(true);
      
      const isPendingRole = user.role === 'DRIVER' || user.role === 'FLEET_OWNER';
      const isPendingStatus = user.kyc_status === 'PENDING' || user.status === 'PENDING_APPROVAL';

      setTimeout(() => {
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
      }, 600);
    } catch (err: any) {
      setOtpError(err.message || 'Invalid OTP code. Please check your email and try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      setOtpError('Please enter your email address first.');
      return;
    }
    try {
      setResendMessage('Sending new OTP code...');
      await api.post('/auth/resend-otp', { email: email.trim() });
      setOtp(['', '', '', '', '', '']);
      setOtpError('');
      setResendTimer(60);
      setCanResend(false);
      setResendMessage('New OTP sent to your email!');
    } catch (err: any) {
      setOtpError(err.message || 'Failed to resend OTP.');
      setResendMessage('');
    }
  };

  return (
    <div className="register-page">
      <header className="register-header">
        <div className="register-header-content">
          <Link to="/register" className="register-back">
            ← Back
          </Link>
          <div className="register-brand">
            <span className="brand-icon">🚚</span>
            <span className="brand-habesha">Habesha</span>
            <span className="brand-freight">Freight</span>
          </div>
        </div>
      </header>

      <div className="register-page-content">
        <div className="register-card">
          <div className="register-switch">
            <Link to="/login" className="register-tab">Log In</Link>
            <Link to="/register" className="register-tab">Register</Link>
          </div>

          <h1 className="register-welcome">Verify Email Address</h1>
          <p className="register-subtitle">
            Enter the 6-digit verification code for your account:
          </p>

          <div className="form-group" style={{ marginBottom: '16px', textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
              Registered Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                localStorage.setItem('registrationEmail', e.target.value.trim());
              }}
              placeholder="Enter your registered email address"
              className="form-input"
            />
          </div>

          <div className="otp-container">
            <div className="otp-inputs">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={handleOtpPaste}
                  className={`otp-input ${otpError ? 'otp-input-error' : ''}`}
                  disabled={isVerifying || otpVerified}
                />
              ))}
            </div>
            {otpError && (
              <span className="input-error-text otp-error-text">{otpError}</span>
            )}
          </div>

          <div className="otp-resend">
            <span className="otp-resend-text">
              {resendTimer > 0 ? `Resend code available in ${resendTimer}s` : "Didn't receive the email?"}
            </span>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={!canResend}
              className="otp-resend-btn"
            >
              Resend OTP
            </button>
          </div>
          {resendMessage && (
            <div style={{ color: '#059669', fontSize: '13px', textAlign: 'center', marginTop: '6px' }}>
              {resendMessage}
            </div>
          )}

          <div className="register-details-actions">
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="register-back-btn"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={otp.join('').length < 6 || isVerifying || otpVerified}
              className={`register-next-btn ${otp.join('').length < 6 ? 'otp-continue-disabled' : ''}`}
            >
              {isVerifying ? 'Verifying...' : 'Verify & Continue →'}
            </button>
          </div>

          <div className="register-login-prompt">
            Already have an account? <Link to="/login" className="register-login-link">Log In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}