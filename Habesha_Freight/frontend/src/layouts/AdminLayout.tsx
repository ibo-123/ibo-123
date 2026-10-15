import { ReactNode, useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  Truck,
  Building2,
  Bus,
  Package,
  BadgeCheck,
  CreditCard,
  AlertTriangle,
  BarChart3,
  ScrollText,
} from 'lucide-react';
import { clearSession, getStoredUser } from '../services/authService';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

interface AdminLayoutProps {
  children: ReactNode;
}

const adminNavItems: { path: string; label: string; icon: LucideIcon }[] = [
  { path: '/admin', label: 'Overview', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/drivers', label: 'Drivers', icon: Truck },
  { path: '/admin/companies', label: 'Transport Companies', icon: Building2 },
  { path: '/admin/vehicles', label: 'Vehicles', icon: Bus },
  { path: '/admin/deliveries', label: 'Deliveries', icon: Package },
  { path: '/admin/verification', label: 'Verification', icon: BadgeCheck },
  { path: '/admin/payments', label: 'Payments / Escrow', icon: CreditCard },
  { path: '/admin/disputes', label: 'Disputes', icon: AlertTriangle },
  { path: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { path: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();
  const { theme } = useTheme();

  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 769);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 769);
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const saved = localStorage.getItem('admin_sidebar_width');
    return saved ? Math.min(420, Math.max(180, Number(saved))) : 260;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (!isDesktop) setSidebarOpen(false);
  }, [location.pathname, isDesktop]);

  useEffect(() => {
    const onResize = () => {
      const desktop = window.innerWidth >= 769;
      setIsDesktop(desktop);
      setSidebarOpen(desktop);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.min(420, Math.max(180, e.clientX));
      setSidebarWidth(newWidth);
      localStorage.setItem('admin_sidebar_width', String(newWidth));
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  const currentWidth = isCollapsed ? 72 : sidebarWidth;
  const contentMargin = isDesktop && sidebarOpen ? currentWidth : 0;
  const initials =
    (user?.full_name ?? 'Admin')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'AD';

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: theme === 'dark' ? '#11161D' : '#F4F6F9',
        fontFamily: 'DM Sans, sans-serif',
        overflowX: 'hidden',
      }}
    >
      {sidebarOpen && !isDesktop && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.5)',
            border: 'none',
            zIndex: 90,
            cursor: 'pointer',
          }}
        />
      )}

      <aside
        style={{
          width: `${currentWidth}px`,
          backgroundColor: '#071426',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 100,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: isResizing ? 'none' : 'transform 0.2s ease, width 0.2s ease',
          userSelect: isResizing ? 'none' : 'auto',
          boxShadow: '2px 0 10px rgba(0,0,0,0.15)',
        }}
      >
        {!isCollapsed && isDesktop && (
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              setIsResizing(true);
            }}
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: '6px',
              cursor: 'col-resize',
              zIndex: 110,
              backgroundColor: isResizing ? '#C8933A' : 'transparent',
            }}
            title="Drag to resize"
          />
        )}

        <div
          style={{
            padding: isCollapsed ? '1.25rem 0.5rem' : '1.5rem 1.25rem 1.25rem',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
          }}
        >
          {!isCollapsed && (
            <div>
              <Link to="/admin" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ color: '#C8933A', fontWeight: 700, fontSize: '1.35rem' }}>Habesha</span>
                <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '1.35rem' }}>Freight</span>
              </Link>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.2rem', textTransform: 'uppercase' }}>
                Admin Console
              </div>
            </div>
          )}
          {isDesktop && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                border: 'none',
                borderRadius: '0.35rem',
                color: '#FFFFFF',
                width: '28px',
                height: '28px',
                cursor: 'pointer',
              }}
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              {isCollapsed ? '»' : '«'}
            </button>
          )}
        </div>

        <nav
          className="no-scrollbar admin-sidebar-nav"
          style={{
            flex: 1,
            padding: isCollapsed ? '1rem 0.35rem' : '1rem 0.75rem',
            overflowY: 'auto',
          }}
        >
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                title={isCollapsed ? item.label : undefined}
                style={({ isActive }: { isActive: boolean }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  gap: isCollapsed ? 0 : '0.85rem',
                  padding: '0.7rem 0.85rem',
                  margin: '0.25rem 0',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  fontSize: '0.925rem',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.65)',
                  backgroundColor: isActive ? '#1A2E46' : 'transparent',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                })}
              >
                <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                  <Icon size={18} strokeWidth={1.85} />
                </span>
                {!isCollapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div style={{ padding: isCollapsed ? '0.75rem 0.25rem' : '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#05101F' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'flex-start', gap: '0.75rem', marginBottom: isCollapsed ? 0 : '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#C8933A',
                color: '#FFFFFF',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
              }}
              title={user?.full_name || 'Admin'}
            >
              {initials}
            </div>
            {!isCollapsed && (
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.full_name || 'Admin'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Super Admin</div>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={handleLogout}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.825rem',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              ← Log Out
            </button>
          )}
        </div>
      </aside>

      <div
        style={{
          marginLeft: contentMargin,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          transition: isResizing ? 'none' : 'margin-left 0.2s ease',
        }}
      >
        <header
          style={{
            height: '60px',
            backgroundColor: theme === 'dark' ? '#1A222C' : '#FFFFFF',
            borderBottom: `1px solid ${theme === 'dark' ? 'rgba(155,168,184,0.18)' : '#E2E8F0'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1rem',
            position: 'sticky',
            top: 0,
            zIndex: 80,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '0.5rem',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                cursor: 'pointer',
                fontWeight: 700,
                flexShrink: 0,
              }}
              aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {sidebarOpen && isDesktop ? '«' : '☰'}
            </button>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: theme === 'dark' ? '#9BA8B8' : '#64748B' }}>
              Habesha Freight Control Console
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ThemeToggle />
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#C8933A',
                color: '#FFFFFF',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
              }}
            >
              {initials}
            </div>
          </div>
        </header>

        <div style={{ flex: 1, width: '100%', minWidth: 0, overflowX: 'hidden' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
