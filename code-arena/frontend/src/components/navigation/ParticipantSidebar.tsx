// frontend/src/components/navigation/ParticipantSidebar.tsx
import { NavLink, Link } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  Trophy,
  Users,
  Mail,
  User,
  LogOut,
  Zap,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const ParticipantSidebar = () => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/dashboard/tournaments", label: "My Tournaments", icon: Trophy },
    { to: "/dashboard/standings", label: "Standings", icon: Users },
    { to: "/dashboard/invitations", label: "Invitations", icon: Mail },
    { to: "/dashboard/profile", label: "Profile", icon: User },
  ];

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="sidebar-mobile-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle sidebar"
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Overlay */}
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        {/* Glow */}
        <div className="sidebar-glow" />

        {/* Header */}
        <Link to="/" className="sidebar-header" onClick={() => setMobileOpen(false)}>
          <div className="sidebar-brand-icon">
            <Zap size={18} />
          </div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand">Code Arena</span>
            <span className="sidebar-role">Participant</span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-nav-label">Navigation</div>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/dashboard"}
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              <div className="sidebar-link-icon">
                <Icon size={18} />
              </div>
              <span className="sidebar-link-text">{label}</span>
              <ChevronRight size={14} className="sidebar-link-arrow" />
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">
              {user?.username?.charAt(0).toUpperCase() || "?"}
              <span className="user-status-dot" />
            </div>
            <div className="user-info">
              <span className="user-name">{user?.username || "Guest"}</span>
              <span className="user-role">Competitor</span>
            </div>
          </div>

          <button onClick={logout} className="sidebar-logout">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>

        <style>{`
          .sidebar {
            position: fixed;
            left: 0;
            top: 0;
            bottom: 0;
            width: 260px;
            background: rgba(10, 12, 22, 0.95);
            backdrop-filter: blur(20px);
            border-right: 1px solid rgba(255, 255, 255, 0.06);
            display: flex;
            flex-direction: column;
            padding: 20px 16px;
            z-index: 100;
            overflow: hidden;
          }

          .sidebar-glow {
            position: absolute;
            top: -20%;
            left: -30%;
            width: 300px;
            height: 300px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(41, 121, 255, 0.08), transparent 70%);
            filter: blur(60px);
            pointer-events: none;
          }

          /* Header */
          .sidebar-header {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 12px 24px;
            text-decoration: none;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            margin-bottom: 20px;
            position: relative;
            z-index: 1;
          }

          .sidebar-brand-icon {
            width: 40px;
            height: 40px;
            border-radius: 12px;
            background: linear-gradient(135deg, #2979FF, #1565C0);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            box-shadow: 0 8px 24px rgba(41, 121, 255, 0.35);
            flex-shrink: 0;
            position: relative;
            overflow: hidden;
          }

          .sidebar-brand-icon::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, rgba(255,255,255,0.2), transparent);
          }

          .sidebar-brand-text {
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 0;
          }

          .sidebar-brand {
            font-size: 17px;
            font-weight: 800;
            color: white;
            letter-spacing: -0.02em;
            white-space: nowrap;
          }

          .sidebar-role {
            font-size: 10px;
            font-weight: 700;
            color: #64B5F6;
            text-transform: uppercase;
            letter-spacing: 1.2px;
          }

          /* Navigation */
          .sidebar-nav {
            display: flex;
            flex-direction: column;
            gap: 4px;
            flex: 1;
            position: relative;
            z-index: 1;
          }

          .sidebar-nav-label {
            font-size: 10px;
            font-weight: 700;
            color: rgba(255, 255, 255, 0.25);
            text-transform: uppercase;
            letter-spacing: 1.2px;
            padding: 0 12px 10px;
          }

          .sidebar-link {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 11px 12px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.55);
            text-decoration: none;
            transition: all 0.25s ease;
            position: relative;
            overflow: hidden;
          }

          .sidebar-link::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 3px;
            height: 0;
            background: linear-gradient(180deg, #2979FF, #64B5F6);
            border-radius: 0 4px 4px 0;
            transition: height 0.25s ease;
          }

          .sidebar-link:hover {
            color: white;
            background: rgba(255, 255, 255, 0.04);
          }

          .sidebar-link:hover::before {
            height: 60%;
          }

          .sidebar-link.active {
            color: white;
            background: linear-gradient(90deg, rgba(41, 121, 255, 0.15), rgba(41, 121, 255, 0.04));
            border: 1px solid rgba(41, 121, 255, 0.2);
          }

          .sidebar-link.active::before {
            height: 60%;
          }

          .sidebar-link-icon {
            width: 32px;
            height: 32px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.03);
            flex-shrink: 0;
            transition: all 0.25s ease;
          }

          .sidebar-link.active .sidebar-link-icon {
            background: linear-gradient(135deg, #2979FF, #1565C0);
            color: white;
            box-shadow: 0 4px 12px rgba(41, 121, 255, 0.35);
          }

          .sidebar-link-text {
            flex: 1;
            white-space: nowrap;
          }

          .sidebar-link-arrow {
            opacity: 0;
            transform: translateX(-4px);
            transition: all 0.25s ease;
            color: #64B5F6;
          }

          .sidebar-link:hover .sidebar-link-arrow,
          .sidebar-link.active .sidebar-link-arrow {
            opacity: 1;
            transform: translateX(0);
          }

          /* Footer */
          .sidebar-footer {
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding-top: 16px;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
            position: relative;
            z-index: 1;
          }

          .sidebar-user {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 12px;
            background: rgba(255, 255, 255, 0.02);
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.04);
          }

          .user-avatar {
            width: 40px;
            height: 40px;
            border-radius: 12px;
            background: linear-gradient(135deg, #2979FF, #EAB308);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 800;
            font-size: 16px;
            flex-shrink: 0;
            position: relative;
          }

          .user-status-dot {
            position: absolute;
            bottom: -2px;
            right: -2px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #22C55E;
            border: 2px solid rgba(10, 12, 22, 0.95);
            box-shadow: 0 0 8px rgba(76, 175, 80, 0.6);
          }

          .user-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 0;
            flex: 1;
          }

          .user-name {
            font-size: 14px;
            font-weight: 700;
            color: white;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .user-role {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.4);
            font-weight: 500;
          }

          .sidebar-logout {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 11px;
            border-radius: 12px;
            background: rgba(255, 107, 107, 0.06);
            border: 1px solid rgba(255, 107, 107, 0.15);
            color: #FF6B6B;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.25s ease;
            font-family: inherit;
          }

          .sidebar-logout:hover {
            background: rgba(255, 107, 107, 0.12);
            border-color: rgba(255, 107, 107, 0.3);
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(255, 107, 107, 0.15);
          }

          /* Mobile toggle & overlay */
          .sidebar-mobile-toggle {
            display: none;
            position: fixed;
            top: 16px;
            left: 16px;
            z-index: 102;
            width: 44px;
            height: 44px;
            border-radius: 12px;
            background: rgba(10, 12, 22, 0.9);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: white;
            cursor: pointer;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
          }

          .sidebar-mobile-toggle:hover {
            background: rgba(41, 121, 255, 0.15);
            border-color: rgba(41, 121, 255, 0.3);
          }

          .sidebar-overlay {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
            z-index: 99;
          }

          @media (max-width: 900px) {
            .sidebar-mobile-toggle {
              display: flex;
            }

            .sidebar-overlay {
              display: block;
            }

            .sidebar {
              transform: translateX(-100%);
              transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
              box-shadow: 0 0 60px rgba(0, 0, 0, 0.5);
            }

            .sidebar.mobile-open {
              transform: translateX(0);
            }
          }
        `}</style>
      </aside>
    </>
  );
};
