// components/navbar.jsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../app/hooks/useAuth";

/**
 * @typedef {Object} NavLink
 * @property {string} href  
 * @property {string} label
 * @property {boolean} [auth]
 * @property {boolean} [admin]
 */

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  /** @type {NavLink[]} */  
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/dashboard", label: "Dashboard", auth: true },
    { href: "/attendance", label: "Attendance", auth: true },
    { href: "/courses", label: "Courses", auth: true },
    { href: "/achievements", label: "Achievements", auth: true },
    { href: "/events", label: "Events", auth: true },
    { href: "/users", label: "Users", admin: true },
  ];

  const filteredLinks = navLinks.filter((link) => {
    if (link.auth && !isAuthenticated) return false;
    if (link.admin && !isAdmin) return false;
    return true;
  });

  return (
    <nav className="bg-gray-900/90 backdrop-blur-sm border-b border-green-900/30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-700 to-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">NCC</span>
            </div>
            <span className="text-white font-bold text-lg hidden md:block">
              MSJ Tech
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {filteredLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === link.href
                    ? "bg-green-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="flex items-center space-x-3 focus:outline-none"
                >
                  <div className="hidden md:block text-right">
                    <p className="text-sm font-medium text-white">
                      {user?.name}
                    </p>
                    <p className="text-xs text-green-400 capitalize">
                      {user?.role}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-green-700 to-emerald-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-green-900/30 rounded-xl shadow-2xl py-1">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                      onClick={() => setIsOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                      onClick={() => setIsOpen(false)}
                    >
                      Dashboard
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/dashboard/admin"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                        onClick={() => setIsOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        setIsOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium text-green-400 border border-green-600 rounded-lg hover:bg-green-600/10"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
