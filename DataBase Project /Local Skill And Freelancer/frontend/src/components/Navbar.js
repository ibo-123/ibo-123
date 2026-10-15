import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const NavLink = ({ to, children, className = '' }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        className={`rounded-full px-4 py-2 transition-all duration-200 ${
          isActive
            ? 'bg-blue-100 text-blue-700 font-semibold'
            : 'text-slate-700 hover:bg-slate-100'
        } ${className}`}
      >
        {children}
      </Link>
    );
  };

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white shadow-sm'
    }`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">LS</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 hidden sm:inline">
                Local Skill
              </span>
              <span className="text-xl font-bold tracking-tight text-slate-900 sm:hidden">
                LSM
              </span>
            </Link>
            <span className="hidden sm:inline-block rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-700">
              Freelance
            </span>
          </div>

          <div className="hidden md:flex md:items-center md:gap-2">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/jobs">Browse Jobs</NavLink>
            {user?.role === 'client' && (
              <Link
                to="/post-job"
                className="rounded-full bg-blue-600 px-5 py-2 text-white transition-all duration-200 hover:bg-blue-700 hover:shadow-md"
              >
                Post Job
              </Link>
            )}
            {user?.role === 'freelancer' && <NavLink to="/my-proposals">My Proposals</NavLink>}
            {user ? (
              <div className="relative group ml-2">
                <button className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 transition hover:bg-slate-50">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                    {getInitials(user.name)}
                  </div>
                  <span className="text-sm font-medium text-slate-700 hidden lg:inline">
                    {user.name?.split(' ')[0] || 'User'}
                  </span>
                  <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    <Link to="/profile" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                      Your Profile
                    </Link>
                    <Link to="/settings" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                      Settings
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="rounded-full border border-slate-200 px-5 py-2 text-slate-700 transition-all duration-200 hover:bg-slate-100"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-blue-600 px-5 py-2 text-white transition-all duration-200 hover:bg-blue-700 hover:shadow-md"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus:outline-none"
            aria-label="Toggle menu"
          >
            <div className="space-y-1.5">
              <span
                className={`block h-0.5 w-6 bg-current transition-transform duration-300 ${
                  isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''
                }`}
              />
              <span className={`block h-0.5 w-6 bg-current transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
              <span
                className={`block h-0.5 w-6 bg-current transition-transform duration-300 ${
                  isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
                }`}
              />
            </div>
          </button>
        </div>

        <div className={`md:hidden overflow-hidden transition-all duration-300 ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="space-y-2 pb-4 pt-2">
            <Link to="/" className="block rounded-lg px-4 py-2 text-slate-700 hover:bg-slate-100">
              Home
            </Link>
            <Link to="/dashboard" className="block rounded-lg px-4 py-2 text-slate-700 hover:bg-slate-100">
              Dashboard
            </Link>
            <Link to="/jobs" className="block rounded-lg px-4 py-2 text-slate-700 hover:bg-slate-100">
              Browse Jobs
            </Link>
            {user?.role === 'client' && (
              <Link to="/post-job" className="block rounded-lg bg-blue-600 px-4 py-2 text-white text-center hover:bg-blue-700">
                Post Job
              </Link>
            )}
            {user?.role === 'freelancer' && (
              <Link to="/my-proposals" className="block rounded-lg px-4 py-2 text-slate-700 hover:bg-slate-100">
                My Proposals
              </Link>
            )}
            {user ? (
              <> 
                <Link to="/profile" className="block rounded-lg px-4 py-2 text-slate-700 hover:bg-slate-100">
                  Profile
                </Link>
                <Link to="/settings" className="block rounded-lg px-4 py-2 text-slate-700 hover:bg-slate-100">
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full rounded-lg px-4 py-2 text-red-600 text-left hover:bg-red-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="space-y-2 pt-2">
                <Link to="/login" className="block rounded-lg border border-slate-200 px-4 py-2 text-slate-700 text-center hover:bg-slate-100">
                  Login
                </Link>
                <Link to="/register" className="block rounded-lg bg-blue-600 px-4 py-2 text-white text-center hover:bg-blue-700">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
