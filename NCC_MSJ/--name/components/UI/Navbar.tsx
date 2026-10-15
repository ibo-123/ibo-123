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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    <nav className="bg-background border-b border-border sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm group-hover:shadow-lg transition-shadow">
              NCC
            </div>
            <span className="font-semibold text-foreground hidden md:block group-hover:text-primary transition-colors">
              MSJ Platform
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {filteredLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === link.href
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-foreground hover:bg-muted transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>

          {/* User Menu and Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Mobile Menu Items - Mobile users won't see desktop menu, show here */}
            {isAuthenticated && isMobileMenuOpen && (
              <div className="absolute top-16 left-0 right-0 bg-card border-b border-border md:hidden">
                <div className="flex flex-col">
                  {filteredLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-4 py-3 text-sm font-medium border-b border-border transition-all ${
                        pathname === link.href
                          ? "bg-primary/20 text-primary"
                          : "text-foreground hover:bg-muted"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="flex items-center gap-2 p-1.5 hover:bg-muted rounded-lg transition-colors"
                >
                  <div className="hidden md:flex flex-col items-end">
                    <p className="text-sm font-medium text-foreground">
                      {user?.name}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {user?.role}
                    </p>
                  </div>
                  <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-semibold text-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                </button>

                {isOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg py-1">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Dashboard
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/dashboard/admin"
                        className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors border-t border-border"
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
                      className="block w-full text-left px-4 py-2 text-sm text-destructive hover:bg-muted transition-colors border-t border-border"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:opacity-90 transition-opacity"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors"
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
