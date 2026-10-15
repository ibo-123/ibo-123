import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { NotificationBell } from '../components/NotificationBell';
import { BrandMark, Icon, type IconName } from '../components/Icons';
import { useAuth } from '../context/AuthContext';

export type NavItem = { to: string; label: string; end?: boolean; icon: IconName };

const defaultNav: NavItem[] = [{ to: 'dashboard', label: 'Dashboard', end: true, icon: 'dashboard' }];

function initials(name: string | undefined) {
  if (!name) {
    return 'TH';
  }
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function DashboardLayout({
  title,
  navItems = defaultNav,
}: {
  title: string;
  navItems?: NavItem[];
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  const sidebar = (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-slate-800 bg-slate-950 text-white transition-transform md:static md:translate-x-0 ${
        menuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-center gap-3 px-5 py-6">
        <BrandMark />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-300">TemariHub</p>
          <h1 className="truncate text-base font-semibold tracking-tight">{title}</h1>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-white text-slate-950'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon name={item.icon} className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="m-3 rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-xs font-semibold text-teal-100">
            {initials(user?.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user?.name}</p>
            <p className="truncate text-xs text-slate-400">{user?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <Icon name="logout" className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 md:flex">
      {menuOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-20 bg-slate-950/50 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
      {sidebar}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">TemariHub</p>
            <p className="truncate text-xs text-slate-500">{title} workspace</p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 md:hidden"
            >
              <Icon name="menu" className="h-5 w-5" />
            </button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
