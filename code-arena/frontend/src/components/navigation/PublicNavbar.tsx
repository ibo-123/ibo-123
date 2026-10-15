// frontend/src/components/layout/PublicNavbar.tsx
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { LogIn, UserPlus, Menu, X, LayoutDashboard, LogOut, Zap } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./PublicNavbar.css";

const NAV_LINKS = [
  { to: "/tournaments", label: "Tournaments" },
] as const;

export const PublicNavbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // ---- Scroll state (rAF-throttled) ------------------------------------

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 20);
        ticking = false;
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ---- Close mobile menu on route change -------------------------------

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // ---- Close mobile menu on Escape -------------------------------------

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [mobileOpen]);

  // ---- Lock body scroll when mobile menu is open -----------------------

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // ---- Handlers ---------------------------------------------------------

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isActive = (path: string) =>
    location.pathname === path || (path !== "/" && location.pathname.startsWith(`${path}/`));

  const dashboardPath = user?.role === "ADMIN" ? "/admin" : "/dashboard";

  return (
    <nav className={`navbar${scrolled ? " navbar--scrolled" : ""}`} aria-label="Primary">
      <div className="navbar__glow" aria-hidden="true" />

      <div className="navbar__inner">
        {/* Brand */}
        <Link to="/" className="navbar__brand">
          <span className="navbar__brand-icon" aria-hidden="true">
            <Zap size={20} />
          </span>
          <span className="navbar__brand-text">
            <span className="navbar__brand-main">Code</span>
            <span className="navbar__brand-accent">Arena</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="navbar__links">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`navbar__link${isActive(link.to) ? " navbar__link--active" : ""}`}
              aria-current={isActive(link.to) ? "page" : undefined}
            >
              {link.label}
              {isActive(link.to) && <span className="navbar__link-dot" aria-hidden="true" />}
            </Link>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="navbar__actions">
          {isAuthenticated ? (
            <>
              <Link to={dashboardPath} className="navbar__btn navbar__btn--primary">
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="navbar__btn-logout"
                aria-label="Sign out"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar__btn navbar__btn--ghost">
                <LogIn size={16} />
                <span>Login</span>
              </Link>
              <Link to="/register" className="navbar__btn navbar__btn--primary">
                <UserPlus size={16} />
                <span>Register</span>
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          ref={toggleRef}
          className="navbar__toggle"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="navbar-mobile-menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        id="navbar-mobile-menu"
        className={`navbar__mobile${mobileOpen ? " navbar__mobile--open" : ""}`}
      >
        {NAV_LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`navbar__mobile-link${
              isActive(link.to) ? " navbar__mobile-link--active" : ""
            }`}
            aria-current={isActive(link.to) ? "page" : undefined}
          >
            {link.label}
          </Link>
        ))}

        <div className="navbar__mobile-divider" aria-hidden="true" />

        {isAuthenticated ? (
          <>
            <Link to={dashboardPath} className="navbar__mobile-link navbar__mobile-link--dashboard">
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="navbar__mobile-link navbar__mobile-link--logout"
            >
              <LogOut size={16} />
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="navbar__mobile-link">
              <LogIn size={16} />
              Login
            </Link>
            <Link to="/register" className="navbar__mobile-link navbar__mobile-link--register">
              <UserPlus size={16} />
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default PublicNavbar;
