import { ReactNode, useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Search,
  ClipboardList,
  Tags,
  CreditCard,
  MessageSquare,
  Truck,
  History,
  Star,
  User,
  LogOut,
  Building2,
} from 'lucide-react';
import { clearSession, getStoredUser } from '../../services/authService';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';

interface ShipperLayoutProps {
  children?: ReactNode;
}

const SHIPPER_NAV: { path: string; label: string; icon: LucideIcon }[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/shipments/create', label: 'Find Truck', icon: Search },
  { path: '/shipments', label: 'Requests', icon: ClipboardList },
  { path: '/bids', label: 'Bids', icon: Tags },
  { path: '/payments', label: 'Escrow & Payments', icon: CreditCard },
  { path: '/messages', label: 'Messages', icon: MessageSquare },
  { path: '/tracking', label: 'Deliveries', icon: Truck },
  { path: '/history', label: 'History', icon: History },
  { path: '/ratings', label: 'Ratings', icon: Star },
  { path: '/profile', label: 'Profile', icon: User },
];

export default function ShipperLayout({ children }: ShipperLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();
  const { theme } = useTheme();

  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 769);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 769);
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const saved = localStorage.getItem('shipper_sidebar_width');
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
      localStorage.setItem('shipper_sidebar_width', String(newWidth));
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

  const displayName = user?.full_name || 'Shipper Partner';
  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const currentWidth = isCollapsed ? 72 : sidebarWidth;
  const contentMargin = isDesktop && sidebarOpen ? currentWidth : 0;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans overflow-x-hidden">
      {sidebarOpen && !isDesktop && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 bg-slate-950/50 z-[90] border-0 cursor-pointer"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className="fixed top-0 bottom-0 left-0 bg-[#071426] text-white flex flex-col z-[100] no-scrollbar admin-sidebar-nav"
        style={{
          width: `${currentWidth}px`,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: isResizing ? 'none' : 'transform 0.2s ease, width 0.2s ease',
          userSelect: isResizing ? 'none' : 'auto',
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

        <div className={`p-5 border-b border-white/10 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <div>
              <div className="flex items-center gap-1 cursor-pointer" onClick={() => navigate('/dashboard')}>
                <span className="text-[#C8933A] font-bold text-[1.35rem] tracking-tight">Habesha</span>
                <span className="text-white font-bold text-[1.35rem] tracking-tight">Freight</span>
              </div>
              <div className="text-xs text-white/50 mt-1 uppercase tracking-wider">Shipper Account</div>
            </div>
          )}
          {isDesktop && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-7 h-7 rounded bg-white/10 text-white border-0 cursor-pointer"
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              {isCollapsed ? '»' : '«'}
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-1 no-scrollbar">
          {SHIPPER_NAV.map((item) => {
            const Icon = item.icon;
            if (item.path === '/shipments/create') {
              return (
                <div key="find-truck-group" className="flex flex-col gap-1">
                  <NavLink
                    to="/shipments/create"
                    title={isCollapsed ? 'Find Truck' : undefined}
                    className={({ isActive }) =>
                      `flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-lg text-sm transition-all ${
                        isActive || location.pathname === '/fleet'
                          ? 'bg-[#1A2E46] text-white font-semibold'
                          : 'text-white/60 hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    <Icon size={18} strokeWidth={1.85} />
                    {!isCollapsed && <span>Find Truck</span>}
                  </NavLink>
                  {!isCollapsed && (
                    <div className="flex flex-col gap-1 pl-9 pr-2 py-1">
                      <NavLink
                        to="/shipments/create"
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-3 py-2 rounded-md text-xs ${
                            isActive ? 'bg-[#2B4365] text-white font-semibold' : 'text-white/50 hover:text-white hover:bg-white/5'
                          }`
                        }
                      >
                        <Truck size={14} strokeWidth={1.85} />
                        <span>Single Truck</span>
                      </NavLink>
                      <NavLink
                        to="/fleet"
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-3 py-2 rounded-md text-xs ${
                            isActive ? 'bg-[#2B4365] text-white font-semibold' : 'text-white/50 hover:text-white hover:bg-white/5'
                          }`
                        }
                      >
                        <Building2 size={14} strokeWidth={1.85} />
                        <span>Multiple Trucks</span>
                      </NavLink>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/dashboard'}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-lg text-sm transition-all ${
                    isActive
                      ? 'bg-[#1A2E46] text-white font-semibold'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <Icon size={18} strokeWidth={1.85} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className={`p-4 border-t border-white/10 bg-[#05101F] ${isCollapsed ? 'text-center' : ''}`}>
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'mb-3'}`}>
            <div className="w-9 h-9 rounded-full bg-[#C8933A] text-white font-bold flex items-center justify-center text-sm flex-shrink-0">
              {initials}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm text-white truncate">{displayName}</div>
                <div className="text-xs text-white/50 capitalize">{user?.role?.toLowerCase() ?? 'Shipper'}</div>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={handleLogout}
              className="text-xs text-white/50 hover:text-white transition-colors flex items-center gap-1.5 p-0 bg-transparent border-none cursor-pointer"
            >
              <LogOut size={12} />
              Log Out
            </button>
          )}
        </div>
      </aside>

      <div
        className="flex-1 flex flex-col min-w-0"
        style={{
          marginLeft: contentMargin,
          transition: isResizing ? 'none' : 'margin-left 0.2s ease',
        }}
      >
        <header
          className="h-[56px] px-3 sm:px-4 flex items-center justify-between sticky top-0 z-40 border-b"
          style={{
            backgroundColor: theme === 'dark' ? '#1A222C' : '#FFFFFF',
            borderColor: theme === 'dark' ? 'rgba(155,168,184,0.18)' : '#E2E8F0',
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              className="w-10 h-10 rounded-lg border border-slate-200 bg-white text-slate-800 text-lg font-bold cursor-pointer flex items-center justify-center shrink-0"
              aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {sidebarOpen && isDesktop ? '«' : '☰'}
            </button>
            <span className="text-sm font-semibold text-slate-500 truncate">Shipper Control Portal</span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="w-8 h-8 rounded-full bg-[#C8933A] text-white font-bold flex items-center justify-center text-xs">
              {initials}
            </div>
          </div>
        </header>

        <div className="flex-1 w-full min-w-0 overflow-x-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
