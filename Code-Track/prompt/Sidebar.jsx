import {
  LayoutDashboard,
  User,
  Trophy,
  BarChart3,
  Settings,
  LogOut,
  Code2,
  Award,
  Bell,
  HelpCircle,
} from "lucide-react";

import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    // Clear any user data
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    logout();
    navigate("/login");
  };

  // Main navigation links
  const mainLinks = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      description: "Overview & stats",
    },
    {
      name: "Profile",
      path: "/profile",
      icon: User,
      description: "Your account",
    },
    {
      name: "Analytics",
      path: "/analytics",
      icon: BarChart3,
      description: "Performance metrics",
    },
    {
      name: "Contests",
      path: "/contests",
      icon: Trophy,
      description: "Competitions",
    },
  ];

  // Secondary navigation links
  const secondaryLinks = [
    {
      name: "Settings",
      path: "/settings",
      icon: Settings,
      description: "Preferences",
    },
    {
      name: "Notifications",
      path: "/notifications",
      icon: Bell,
      description: "Alerts & updates",
    },
  ];

  // Helper to check if a link is active
  const isActiveLink = (path) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={`
        bg-slate-900
        text-white
        min-h-screen
        p-5
        hidden
        md:flex
        flex-col
        transition-all
        duration-300
        ${isCollapsed ? "w-20" : "w-64"}
        relative
        border-r
        border-slate-800
      `}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 bg-slate-800 rounded-full p-1 border border-slate-700 hover:bg-slate-700 transition-colors"
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <svg
          className={`w-4 h-4 transition-transform duration-300 ${
            isCollapsed ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
          />
        </svg>
      </button>

      {/* Logo / Brand */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Code2 className="w-6 h-6 text-white" />
        </div>
        {!isCollapsed && (
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              CodeTrack
            </h1>
            {user && (
              <p className="text-xs text-slate-400 truncate">
                Welcome, {user.name || "User"}
              </p>
            )}
          </div>
        )}
      </div>

      {/* User Avatar (when collapsed) */}
      {isCollapsed && user && (
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
            {user.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="space-y-1 flex-1">
        <p className={`text-xs uppercase text-slate-500 font-semibold ${isCollapsed ? 'text-center' : 'px-4'} mb-3`}>
          {isCollapsed ? "•" : "Main Menu"}
        </p>
        
        {mainLinks.map((link) => {
          const Icon = link.icon;
          const isActive = isActiveLink(link.path);

          return (
            <NavLink
              key={link.name}
              to={link.path}
              className={`
                flex items-center gap-3
                px-4 py-3
                rounded-lg
                transition-all
                group
                relative
                ${isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                  : "hover:bg-slate-800 text-slate-300 hover:text-white"
                }
                ${isCollapsed ? "justify-center" : ""}
              `}
              title={isCollapsed ? link.name : ""}
            >
              <Icon size={20} className="flex-shrink-0" />
              
              {!isCollapsed && (
                <>
                  <span className="flex-1">{link.name}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 bg-white rounded-full" />
                  )}
                </>
              )}
              
              {/* Tooltip for collapsed mode */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {link.name}
                  <span className="text-xs text-slate-400 block">
                    {link.description}
                  </span>
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Divider */}
      <div className={`border-t border-slate-800 my-4 ${isCollapsed ? 'mx-2' : ''}`} />

      {/* Secondary Navigation */}
      <nav className="space-y-1">
        {secondaryLinks.map((link) => {
          const Icon = link.icon;
          const isActive = isActiveLink(link.path);

          return (
            <NavLink
              key={link.name}
              to={link.path}
              className={`
                flex items-center gap-3
                px-4 py-3
                rounded-lg
                transition-all
                group
                relative
                ${isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                  : "hover:bg-slate-800 text-slate-300 hover:text-white"
                }
                ${isCollapsed ? "justify-center" : ""}
              `}
              title={isCollapsed ? link.name : ""}
            >
              <Icon size={20} className="flex-shrink-0" />
              
              {!isCollapsed && (
                <>
                  <span className="flex-1">{link.name}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 bg-white rounded-full" />
                  )}
                </>
              )}
              
              {/* Tooltip for collapsed mode */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {link.name}
                  <span className="text-xs text-slate-400 block">
                    {link.description}
                  </span>
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Help & Support Link */}
      <NavLink
        to="/help"
        className={`
          flex items-center gap-3
          px-4 py-3
          rounded-lg
          transition-all
          hover:bg-slate-800
          text-slate-400
          hover:text-white
          mt-2
          ${isCollapsed ? "justify-center" : ""}
        `}
        title={isCollapsed ? "Help & Support" : ""}
      >
        <HelpCircle size={20} className="flex-shrink-0" />
        {!isCollapsed && <span className="flex-1">Help & Support</span>}
      </NavLink>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className={`
          flex items-center gap-3
          mt-4
          px-4 py-3
          rounded-lg
          bg-red-500/10
          hover:bg-red-500/20
          text-red-400
          hover:text-red-300
          transition-all
          w-full
          border border-red-500/20
          hover:border-red-500/40
          ${isCollapsed ? "justify-center" : ""}
        `}
        title={isCollapsed ? "Logout" : ""}
      >
        <LogOut size={20} className="flex-shrink-0" />
        {!isCollapsed && (
          <>
            <span className="flex-1 text-left">Logout</span>
            <kbd className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
              ⌘Q
            </kbd>
          </>
        )}
      </button>

      {/* Version info */}
      {!isCollapsed && (
        <div className="mt-4 pt-4 border-t border-slate-800">
          <p className="text-xs text-slate-500 text-center">
            v2.0.1 • {new Date().getFullYear()}
          </p>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;