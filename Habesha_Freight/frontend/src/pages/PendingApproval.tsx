import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function PendingApproval() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(user);
  const [checkingStatus, setCheckingStatus] = useState<boolean>(false);

  const checkLiveStatus = async () => {
    try {
      setCheckingStatus(true);
      const res: any = await api.get('/auth/me');
      const freshUser = res?.data ?? res;
      if (freshUser && freshUser.id) {
        setCurrentUser(freshUser);
        localStorage.setItem('hf_user', JSON.stringify(freshUser));
      }
    } catch (err) {
      console.warn('Failed to refresh user profile:', err);
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    checkLiveStatus();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isApproved =
    currentUser?.kyc_status === 'APPROVED' ||
    (currentUser?.is_verified === true && currentUser?.status === 'ACTIVE' && currentUser?.kyc_status !== 'PENDING' && currentUser?.kyc_status !== 'REJECTED');

  const handleGoToDashboard = () => {
    if (currentUser?.role === 'FLEET_OWNER') {
      navigate('/company');
    } else {
      navigate('/driver');
    }
  };

  return (
    <div className="register-page">
      <header className="register-header">
        <div className="register-header-content">
          <Link to="/" className="register-back">
            ← Home
          </Link>
          <div className="register-brand">
            <span className="brand-icon">🚚</span>
            <span className="brand-habesha">Habesha</span>
            <span className="brand-freight">Freight</span>
          </div>
        </div>
      </header>

      <div className="register-page-content" style={{ padding: '40px 20px' }}>
        <div className="register-card" style={{ maxWidth: '600px', textAlign: 'center', padding: '40px 32px' }}>
          {isApproved ? (
            <>
              <div style={{ fontSize: '58px', marginBottom: '16px' }}>🎉</div>

              <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#16a34a', marginBottom: '12px' }}>
                Account Verified & Approved!
              </h1>

              <div
                style={{
                  background: '#dcfce7',
                  border: '1px solid #86efac',
                  borderRadius: '8px',
                  padding: '14px 18px',
                  color: '#15803d',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '24px',
                  display: 'inline-block',
                }}
              >
                ✓ Status: APPROVED & ACTIVE
              </div>

              <p style={{ color: '#334155', fontSize: '16px', lineHeight: '1.6', marginBottom: '20px' }}>
                Congratulations, <strong>{currentUser?.full_name || 'Partner'}</strong>! Your identity documents and account details have been successfully verified and approved by the Habesha Freight Admin team.
              </p>

              <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.6', marginBottom: '32px' }}>
                You now have full access to your operational dashboard, live freight requests, bidding, and carrier tools.
              </p>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={handleGoToDashboard}
                  style={{
                    background: '#00a651',
                    color: '#ffffff',
                    border: 'none',
                    padding: '14px 28px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '15px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0, 166, 81, 0.25)',
                  }}
                >
                  🚀 Proceed to Dashboard →
                </button>
                <button
                  onClick={handleLogout}
                  style={{
                    background: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    padding: '14px 20px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Log Out
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '54px', marginBottom: '16px' }}>⏳</div>

              <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>
                Account Pending Admin Approval
              </h1>

              <div
                style={{
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  borderRadius: '8px',
                  padding: '14px 18px',
                  color: '#92400e',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '24px',
                  display: 'inline-block',
                }}
              >
                Status: <strong>Awaiting Admin Review & Verification</strong>
              </div>

              <p style={{ color: '#475569', fontSize: '15px', lineHeight: '1.6', marginBottom: '20px' }}>
                Thank you, <strong>{currentUser?.full_name || 'Partner'}</strong>! Your email address has been verified. Because you registered as a <strong>{currentUser?.role === 'DRIVER' ? 'Driver' : 'Transport Company'}</strong>, your account details and uploaded documents have been submitted to our Admin team for verification.
              </p>

              <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', marginBottom: '32px' }}>
                Once our Admin team approves your application, you will immediately unlock full access to your operational portal.
              </p>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={checkLiveStatus}
                  disabled={checkingStatus}
                  style={{
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: checkingStatus ? 'wait' : 'pointer',
                  }}
                >
                  {checkingStatus ? 'Checking Status...' : '🔄 Refresh Status'}
                </button>
                <button
                  onClick={handleLogout}
                  style={{
                    background: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Log Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
