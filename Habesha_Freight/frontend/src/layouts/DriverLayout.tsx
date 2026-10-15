import { ReactNode, useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Search,
  CircleDollarSign,
  Truck,
  Wallet,
  History,
  MessageSquare,
  Star,
  User,
  Globe,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { clearSession, getStoredUser } from '../services/authService';
import ThemeToggle from '../components/ThemeToggle';

interface DriverLayoutProps {
  children: ReactNode;
}

const NAV_ITEMS: { path: string; icon: LucideIcon; label: string }[] = [
  { path: '/driver/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/driver/requests', icon: Search, label: 'Requests' },
  { path: '/driver/bids', icon: CircleDollarSign, label: 'My Bids' },
  { path: '/driver/active-delivery', icon: Truck, label: 'Active Delivery' },
  { path: '/driver/wallet', icon: Wallet, label: 'Wallet & Payouts' },
  { path: '/driver/history', icon: History, label: 'History' },
  { path: '/driver/messages', icon: MessageSquare, label: 'Messages' },
  { path: '/driver/ratings', icon: Star, label: 'Ratings' },
  { path: '/driver/profile', icon: User, label: 'Profile' },
];

export default function DriverLayout({ children }: DriverLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 769);

  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();

  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const saved = localStorage.getItem('driver_sidebar_width');
    return saved ? Math.min(420, Math.max(180, Number(saved))) : 260;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const initials = (user?.full_name ?? 'AG')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  useEffect(() => {
    if (window.innerWidth < 769) setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 769) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.min(420, Math.max(180, e.clientX));
      setSidebarWidth(newWidth);
      localStorage.setItem('driver_sidebar_width', String(newWidth));
    };

    const handleMouseUp = () => {
      if (isResizing) setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const toggle = () => setSidebarOpen((v) => !v);

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  const currentPage =
    NAV_ITEMS.find((n) => location.pathname.startsWith(n.path))?.label ?? 'Dashboard';

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const currentWidth = isCollapsed ? 72 : sidebarWidth;

  return (
    <div className={`dl-layout ${sidebarOpen ? 'dl-layout--sidebar-open' : 'dl-layout--sidebar-closed'}`}>
      <aside
        className={`dl-sidebar no-scrollbar admin-sidebar-nav ${sidebarOpen ? 'dl-sidebar--open' : ''}`}
        aria-label="Driver navigation sidebar"
        style={{
          width: `${currentWidth}px`,
          transition: isResizing ? 'none' : 'width 0.2s ease, transform 0.28s ease',
          userSelect: isResizing ? 'none' : 'auto',
        }}
      >
        {!isCollapsed && window.innerWidth >= 769 && (
          <div
            onMouseDown={startResizing}
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: '6px',
              cursor: 'col-resize',
              zIndex: 110,
              backgroundColor: isResizing ? '#C8933A' : 'transparent',
              transition: 'background-color 0.2s ease',
            }}
            title="Drag left/right to resize sidebar width"
          />
        )}

        <button
          id="dl-close-sidebar-btn"
          type="button"
          className="dl-sidebar-close"
          aria-label="Close sidebar"
          onClick={toggle}
        >
          ×
        </button>

        <div
          className="dl-brand"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
          }}
        >
          {!isCollapsed && (
            <div>
              <Link to="/driver/dashboard" className="dl-brand-link">
                <Truck size={20} strokeWidth={2} className="dl-brand-mark" />
                <span className="dl-brand-habesha">Habesha</span>
                <span className="dl-brand-freight">Freight</span>
              </Link>
              <p className="dl-brand-sub">Driver Account</p>
            </div>
          )}

          {window.innerWidth >= 769 && (
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="dl-collapse-btn"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
          )}
        </div>

        <nav
          className="dl-nav no-scrollbar"
          aria-label="Driver navigation"
          style={{ overflowY: 'auto', msOverflowStyle: 'none', scrollbarWidth: 'none' }}
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/driver/dashboard' || item.path === '/driver/requests'}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `dl-nav-item ${isActive ? 'dl-nav-item--active' : ''}`
                }
                style={{
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  whiteSpace: 'nowrap',
                }}
              >
                <span className="dl-nav-icon">
                  <Icon size={18} strokeWidth={1.85} />
                </span>
                {!isCollapsed && <span className="dl-nav-label">{item.label}</span>}
              </NavLink>
            );
          })}

          <div
            style={{
              height: '1px',
              backgroundColor: 'rgba(255,255,255,0.08)',
              margin: '0.5rem 0',
            }}
          />

          <Link
            to="/"
            className="dl-nav-item"
            style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}
            title={isCollapsed ? 'Main Landing Page' : undefined}
          >
            <span className="dl-nav-icon">
              <Globe size={18} strokeWidth={1.85} />
            </span>
            {!isCollapsed && <span className="dl-nav-label">Main Landing Page</span>}
          </Link>
        </nav>

        <div className="dl-footer">
          <div className="dl-user-row" style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
            <div
              className="dl-user-avatar"
              aria-hidden="true"
              title={user?.full_name ?? 'Driver'}
            >
              {initials}
            </div>
            {!isCollapsed && (
              <div className="dl-user-info">
                <p className="dl-user-name">{user?.full_name ?? 'Driver'}</p>
                <p className="dl-user-meta">
                  <Star size={12} className="dl-star-icon" fill="currentColor" />
                  4.8 · <span className="dl-verified">Verified Driver</span>
                </p>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '0.75rem',
              }}
            >
              <button
                id="dl-logout-btn"
                className="dl-logout-btn"
                type="button"
                onClick={handleLogout}
              >
                <LogOut size={14} />
                Log Out
              </button>
            </div>
          )}
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="dl-backdrop"
          aria-label="Close menu"
          onClick={toggle}
        />
      )}

      <div
        className="dl-main"
        style={{
          marginLeft:
            sidebarOpen && typeof window !== 'undefined' && window.innerWidth >= 769
              ? `${currentWidth}px`
              : 0,
          transition: isResizing ? 'none' : 'margin-left 0.2s ease',
        }}
      >
        <header className="dl-topbar">
          <button
            id="dl-hamburger-btn"
            type="button"
            className={`dl-hamburger ${sidebarOpen ? 'dl-hamburger--open' : ''}`}
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            aria-expanded={sidebarOpen}
            onClick={toggle}
          >
            <span className="dl-hamburger-bar" />
            <span className="dl-hamburger-bar" />
            <span className="dl-hamburger-bar" />
          </button>

          <div className="dl-topbar-left">
            <h1 className="dl-topbar-title">{currentPage}</h1>
            <span className="dl-topbar-date">{today}</span>
          </div>

          <div className="dl-topbar-actions">
            <ThemeToggle />
            <Link to="/" className="dl-topbar-link">
              <Globe size={14} />
              Landing
            </Link>
            <Link to="/driver/dashboard" className="dl-topbar-brand">
              <span>Habesha</span>
              <span className="dl-brand-freight">Freight</span>
            </Link>
          </div>
        </header>

        <main className="dl-content">{children}</main>
      </div>
    </div>
  );
}
