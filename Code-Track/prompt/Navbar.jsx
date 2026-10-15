import { 
  Bell, 
  Search, 
  User, 
  Settings, 
  LogOut, 
  HelpCircle,
  ChevronDown,
  Moon,
  Sun,
  Menu,
  X
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function Navbar({ 
  username = "User", 
  userAvatar = "",
  onMenuClick,
  isMobileMenuOpen = false 
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, message: "New contest available!", read: false, time: "5 min ago" },
    { id: 2, message: "Your profile was viewed 10 times", read: false, time: "1 hour ago" },
    { id: 3, message: "Achievement unlocked: Problem Solver", read: true, time: "2 days ago" },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

  // Get current page title from route
  const getPageTitle = () => {
    const path = location.pathname;
    const titles = {
      "/dashboard": "Dashboard",
      "/profile": "Profile",
      "/settings": "Settings",
      "/analytics": "Analytics",
      "/contests": "Contests",
      "/notifications": "Notifications",
      "/help": "Help & Support",
    };
    return titles[path] || "Dashboard";
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get user initials
  const getInitials = () => {
    const name = username || user?.name || "User";
    return name.charAt(0).toUpperCase();
  };

  // Get avatar URL
  const getAvatarUrl = () => {
    if (userAvatar) return userAvatar;
    if (user?.avatar) {
      // Handle avatar URL
      const avatar = user.avatar;
      if (avatar.startsWith("http") || avatar.startsWith("data:")) {
        return avatar;
      }
      const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/api$/, "") || "http://localhost:5000";
      return `${baseUrl}${avatar.startsWith("/") ? avatar : `/${avatar}`}`;
    }
    return null;
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    logout();
    navigate("/login");
    setIsDropdownOpen(false);
  };

  const handleNotificationClick = (id) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header
      className="
        h-16
        bg-white
        border-b
        flex
        items-center
        justify-between
        px-4
        md:px-6
        sticky
        top-0
        z-40
        shadow-sm
      "
    >
      {/* Left Section - Mobile Menu + Title */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <X className="w-5 h-5 text-slate-600" />
          ) : (
            <Menu className="w-5 h-5 text-slate-600" />
          )}
        </button>

        {/* Page Title */}
        <div>
          <h2 className="font-semibold text-xl text-slate-800">
            {getPageTitle()}
          </h2>
          <p className="text-xs text-slate-400 hidden sm:block">
            Welcome back, {username || user?.name || "User"}
          </p>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Search Bar (Hidden on mobile) */}
        <div className="hidden md:flex items-center relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48 lg:w-64 transition-all"
          />
          <kbd className="absolute right-3 text-xs text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
            ⌘K
          </kbd>
        </div>

        {/* Dark Mode Toggle (Optional) */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="hidden md:flex p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-500 hover:text-blue-600 font-medium"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notifications</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif.id)}
                      className={`px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors ${
                        !notif.read ? "bg-blue-50/50" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          !notif.read ? "bg-blue-500" : "bg-slate-300"
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${
                            !notif.read ? "font-medium text-slate-800" : "text-slate-600"
                          }`}>
                            {notif.message}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">{notif.time}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="px-4 py-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    navigate("/notifications");
                  }}
                  className="text-xs text-blue-500 hover:text-blue-600 font-medium w-full text-center"
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 md:gap-3 hover:bg-slate-50 rounded-lg px-2 py-1.5 transition-colors"
            aria-label="User menu"
          >
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm md:text-base flex-shrink-0 overflow-hidden">
              {getAvatarUrl() ? (
                <img 
                  src={getAvatarUrl()} 
                  alt={username || user?.name || "User"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                getInitials()
              )}
            </div>
            
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-slate-700">
                {username || user?.name || "User"}
              </p>
              <p className="text-xs text-slate-400">
                {user?.email || "user@example.com"}
              </p>
            </div>
            
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isDropdownOpen ? "rotate-180" : ""
            }`} />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-50">
              {/* User Info */}
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <p className="font-medium text-slate-800">
                  {username || user?.name || "User"}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {user?.email || "user@example.com"}
                </p>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate("/profile");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>My Profile</span>
                </button>
                
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate("/settings");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Settings</span>
                </button>
                
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate("/help");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                  <span>Help & Support</span>
                </button>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-100" />

              {/* Logout */}
              <div className="py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                  <kbd className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    ⌘Q
                  </kbd>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;