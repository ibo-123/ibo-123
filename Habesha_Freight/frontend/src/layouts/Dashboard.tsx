import { ReactNode, useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import type { NavItem, Person2Role } from '../types/person2';
import { clearSession, getStoredUser } from '../services/authService';

interface Person2LayoutProps {
  role: Person2Role;
  navItems: NavItem[];
  children: ReactNode;
}

const roleLabels: Record<Person2Role, string> = {
  driver: 'Driver Portal',
  company: 'Company Portal',
  admin: 'Admin Console',
  shipper: 'Shipper Dashboard',
};

export default function Person2Layout({ role, navItems, children }: Person2LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const user = getStoredUser();

  // Resizable & Collapsible Sidebar State
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const saved = localStorage.getItem(`${role}_sidebar_width`);
    return saved ? Math.min(420, Math.max(180, Number(saved))) : 260;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  // Drag Resizing Logic
  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.min(420, Math.max(180, e.clientX));
      setSidebarWidth(newWidth);
      localStorage.setItem(`${role}_sidebar_width`, String(newWidth));
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
      }
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, role]);

  const currentWidth = isCollapsed ? 72 : sidebarWidth;

  return (
    <div className="p2-layout">
      <aside
        className={`p2-sidebar no-scrollbar admin-sidebar-nav ${sidebarOpen ? 'p2-sidebar--open' : ''}`}
        style={{
          width: `${currentWidth}px`,
          transition: isResizing ? 'none' : 'width 0.2s ease',
          userSelect: isResizing ? 'none' : 'auto',
        }}
      >
        {/* Drag-to-Resize Right Edge Handle */}
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

        <div className="p2-sidebar-brand" style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between' }}>
          {!isCollapsed && (
            <div>
              <Link to={role === 'shipper' ? '/dashboard' : `/${role}`} className="p2-brand-link">
                <span className="p2-brand-habesha">Habesha</span>
                <span className="p2-brand-freight">Freight</span>
              </Link>
              <span className="p2-role-badge">{roleLabels[role]}</span>
            </div>
          )}

          {/* Desktop Collapse / Expand Toggle Button */}
          {window.innerWidth >= 769 && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                border: 'none',
                borderRadius: '0.35rem',
                color: '#FFFFFF',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? '»' : '«'}
            </button>
          )}
        </div>

        <nav className="p2-nav no-scrollbar" style={{ overflowY: 'auto', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          {navItems.map((item) => (
            <div key={item.path} className="p2-nav-group">
              <NavLink
                to={item.path}
                end={item.path === `/${role}`}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `p2-nav-link ${isActive ? 'p2-nav-link--active' : ''}`
                }
                style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', whiteSpace: 'nowrap' }}
                onClick={() => setSidebarOpen(false)}
              >
                {item.icon && <span className="p2-nav-icon">{item.icon}</span>}
                {!isCollapsed && item.label}
              </NavLink>
              {!isCollapsed && item.children?.map((child) => (
                <NavLink
                  key={child.path}
                  to={child.path}
                  className={({ isActive }) =>
                    `p2-nav-sublink ${isActive ? 'p2-nav-link--active' : ''}`
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  {child.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="p2-sidebar-footer">
          <div className="p2-user-chip" style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
            <div className="p2-user-avatar" title={user?.full_name ?? 'User'}>
              {(user?.full_name ?? 'U').charAt(0).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div>
                <div className="p2-user-name">{user?.full_name ?? 'User'}</div>
                <div className="p2-user-role">{user?.role ?? ''}</div>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button type="button" className="p2-logout-btn" onClick={handleLogout}>
              Log out
            </button>
          )}
        </div>
      </aside>

      <div
        className="p2-main"
        style={{
          marginLeft: window.innerWidth >= 769 ? `${currentWidth}px` : undefined,
          transition: isResizing ? 'none' : 'margin-left 0.2s ease',
        }}
      >
        <header className="p2-topbar">
          <button
            type="button"
            className="p2-menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            ☰
          </button>
          <span className="p2-topbar-title">{roleLabels[role]}</span>
        </header>
        <div className="p2-content">{children}</div>
      </div>

      {sidebarOpen && (
        <button
          type="button"
          className="p2-sidebar-overlay"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
