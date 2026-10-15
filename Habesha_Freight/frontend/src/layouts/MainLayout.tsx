import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import { getStoredUser } from '../services/authService';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const barePaths = ['/dashboard', '/login', '/register', '/verify-otp', '/pending-approval'];
  const { theme } = useTheme();

  if (barePaths.some((p) => location.pathname === p || location.pathname.startsWith(p + '/'))) {
    return <>{children}</>;
  }

  const user = getStoredUser();

  const dashboardPath =
    user?.role === 'DRIVER' ? '/driver/dashboard' : '/dashboard';

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    if (location.pathname === '/' || location.pathname === '') {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    }
  };

  return (
    <div className={`main-layout ${theme}`}>
      <header
        className="navbar"
        style={{
          backgroundColor: theme === 'dark' ? '#11161D' : '#0B1F33',
          height: '64px',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '100%',
            padding: '0 1.5rem',
          }}
        >
          {/* Logo */}
          <Link
            to="/"
            className="navbar-logo"
            style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              fontFamily: 'DM Sans, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>🚚</span>
            <span style={{ color: '#FFFFFF' }}>Habesha</span>
            <span style={{ color: '#C8933A' }}>Freight</span>
          </Link>

          {/* Desktop Navigation */}
          <nav
            className="desktop-nav"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '1.5rem',
                alignItems: 'center',
              }}
            >
              <a href="/#search" className="btn-nav" onClick={(e) => handleNavClick(e, 'search')}>
                Find Trucks
              </a>

              <a href="/#how-it-works" className="btn-nav" onClick={(e) => handleNavClick(e, 'how-it-works')}>
                How It Works
              </a>

              <a href="/#features" className="btn-nav" onClick={(e) => handleNavClick(e, 'features')}>
                Features
              </a>

              <a href="/#routes" className="btn-nav" onClick={(e) => handleNavClick(e, 'routes')}>
                Routes
              </a>

              <Link
                to="/driver/dashboard"
                className="btn-nav"
                style={{
                  color: '#C8933A',
                  fontWeight: 600,
                }}
              >
                🚛 Driver Portal
              </Link>
            </div>

            {/* Authentication */}
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'center',
              }}
            >
              {user ? (
                <Link
                  to={dashboardPath}
                  style={{
                    display: 'inline-block',
                    backgroundColor: '#C8933A',
                    color: '#FFFFFF',
                    padding: '0.5rem 1.25rem',
                    borderRadius: '0.5rem',
                    fontWeight: '500',
                    fontFamily: 'DM Sans, sans-serif',
                    textDecoration: 'none',
                  }}
                >
                  Dashboard (
                  {user.full_name
                    ? user.full_name.split(' ')[0]
                    : 'User'}
                  )
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn-nav">
                    Log In
                  </Link>

                  <Link
                    to="/register"
                    style={{
                      display: 'inline-block',
                      backgroundColor: '#C8933A',
                      color: '#FFFFFF',
                      padding: '0.5rem 1.5rem',
                      borderRadius: '0.5rem',
                      fontWeight: '500',
                      fontFamily: 'DM Sans, sans-serif',
                      transition: 'background-color 0.2s',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = '#F0B84A')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = '#C8933A')
                    }
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </nav>

          {/* Right-side Controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <ThemeToggle className="theme-toggle--nav" />

            <button
              className="mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '0.25rem 0.5rem',
              }}
              aria-label="Toggle mobile menu"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div
            style={{
              backgroundColor:
                theme === 'dark' ? '#11161D' : '#0B1F33',
              padding: '1rem 1.5rem',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <a
                href="/#search"
                className="btn-nav"
                onClick={(e) => {
                  handleNavClick(e, 'search');
                  setIsMobileMenuOpen(false);
                }}
                style={{
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  padding: '0.5rem 0',
                }}
              >
                Find Trucks
              </a>

              <a
                href="/#how-it-works"
                className="btn-nav"
                onClick={(e) => {
                  handleNavClick(e, 'how-it-works');
                  setIsMobileMenuOpen(false);
                }}
                style={{
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  padding: '0.5rem 0',
                }}
              >
                How It Works
              </a>

              <a
                href="/#features"
                className="btn-nav"
                onClick={(e) => {
                  handleNavClick(e, 'features');
                  setIsMobileMenuOpen(false);
                }}
                style={{
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  padding: '0.5rem 0',
                }}
              >
                Features
              </a>

              <a
                href="/#routes"
                className="btn-nav"
                onClick={(e) => {
                  handleNavClick(e, 'routes');
                  setIsMobileMenuOpen(false);
                }}
                style={{
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  padding: '0.5rem 0',
                }}
              >
                Routes
              </a>

              <Link
                to="/driver/dashboard"
                className="btn-nav"
                style={{
                  color: '#C8933A',
                  fontWeight: 600,
                  textDecoration: 'none',
                  padding: '0.5rem 0',
                }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                🚛 Driver Portal
              </Link>

              {user ? (
                <Link
                  to={dashboardPath}
                  className="btn-nav"
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{
                    color: '#FFFFFF',
                    textDecoration: 'none',
                    padding: '0.5rem 0',
                  }}
                >
                  My Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="btn-nav"
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{
                      color: '#FFFFFF',
                      textDecoration: 'none',
                      padding: '0.5rem 0',
                    }}
                  >
                    Log In
                  </Link>

                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{
                      display: 'inline-block',
                      backgroundColor: '#C8933A',
                      color: '#FFFFFF',
                      padding: '0.5rem 1.5rem',
                      borderRadius: '0.5rem',
                      fontWeight: '500',
                      fontFamily: 'DM Sans, sans-serif',
                      textAlign: 'center',
                      textDecoration: 'none',
                      alignSelf: 'flex-start',
                      marginTop: '0.25rem',
                    }}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main>{children}</main>
    </div>
  );
}