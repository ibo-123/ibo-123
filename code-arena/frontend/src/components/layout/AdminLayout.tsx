import React, { useEffect, useRef, useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Trophy,
  Users,
  GitBranch,
  Layers,
  FileText,
  Settings,
  LogOut,
  Plus,
  ChevronDown,
  Sparkles,
  Crown,
  Menu,
  X,
  Bell,
  Search,
  ChevronsLeft,
  ChevronsRight,
  Command,
  User as UserIcon,
  ChevronRight,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { tournamentApi } from "../../services/tournamentApi";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface Tournament {
  _id: string;
  name: string;
  description?: string;
  status?: string;
  currentStage?: string;
  maxParticipants?: number;
  numberOfGroups?: number;
}

export interface AdminLayoutContext {
  selectedTournament: Tournament | null;
  tournaments: Tournament[];
}

const SIDEBAR_STORAGE_KEY = "admin-sidebar-collapsed";

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

const AdminLayout: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);

  const [showTournamentMenu, setShowTournamentMenu] = useState(false);
  const [tournamentSearch, setTournamentSearch] = useState("");
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const tournamentMenuRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);

  /* ---- Persist collapsed state -------------------------------- */
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  /* ---- Load tournaments -------------------------------------- */
  useEffect(() => {
    const loadTournaments = async () => {
      try {
        const response = await tournamentApi.list();
        const allTournaments = response?.tournaments || [];
        setTournaments(allTournaments);

        if (allTournaments.length > 0) {
          const savedId = localStorage.getItem("admin-selected-tournament");
          const savedTournament = savedId
            ? allTournaments.find((t: Tournament) => t._id === savedId)
            : null;
          const tournament = savedTournament || allTournaments[0];
          setSelectedTournament(tournament);
          if (!savedTournament) {
            localStorage.setItem("admin-selected-tournament", tournament._id);
          }
        } else {
          setSelectedTournament(null);
          localStorage.removeItem("admin-selected-tournament");
        }
      } catch (error) {
        console.error("Failed to load tournaments:", error);
        setTournaments([]);
        setSelectedTournament(null);
      }
    };

    loadTournaments();
  }, [location.pathname]);

  /* ---- Close menus on route change ---------------------------- */
  useEffect(() => {
    setMobileOpen(false);
    setShowTournamentMenu(false);
    setShowUserMenu(false);
    setShowNotifications(false);
  }, [location.pathname]);

  /* ---- Click-outside handlers -------------------------------- */
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        showTournamentMenu &&
        tournamentMenuRef.current &&
        !tournamentMenuRef.current.contains(target)
      ) {
        setShowTournamentMenu(false);
      }
      if (showUserMenu && userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
      if (showNotifications && notifRef.current && !notifRef.current.contains(target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showTournamentMenu, showUserMenu, showNotifications]);

  /* ---- Keyboard shortcuts ------------------------------------ */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;

      if (meta && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setCollapsed((v) => !v);
      }
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowTournamentMenu(true);
      }
      if (e.key === "Escape") {
        setShowTournamentMenu(false);
        setShowUserMenu(false);
        setShowNotifications(false);
        setMobileOpen(false);
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  /* ---- Actions ----------------------------------------------- */
  const handleTournamentChange = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    localStorage.setItem("admin-selected-tournament", tournament._id);
    setShowTournamentMenu(false);
    setTournamentSearch("");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  /* ---- Nav items --------------------------------------------- */
  const navItems = [
    { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { label: "Contests", path: "/admin/contests", icon: Trophy },
    { label: "Participants", path: "/admin/participants", icon: Users },
    { label: "Bracket", path: "/admin/bracket", icon: GitBranch },
    { label: "Groups", path: "/admin/groups", icon: Layers },
    { label: "Logs", path: "/admin/logs", icon: FileText },
    { label: "Settings", path: "/admin/settings", icon: Settings },
  ];

  /* ---- Filtered tournament list ------------------------------ */
  const filteredTournaments = tournaments.filter((t) =>
    t.name.toLowerCase().includes(tournamentSearch.trim().toLowerCase()),
  );

  /* ---- Breadcrumb -------------------------------------------- */
  const currentNav =
    navItems.find((n) =>
      n.path === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(n.path),
    ) || navItems[0];

  /* ---- Responsive widths ------------------------------------- */
  const sidebarWidth = collapsed ? 72 : 280;

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
      }}
    >
      {/* ============================================================
          MOBILE BACKDROP
      ============================================================ */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 45,
            backdropFilter: "blur(4px)",
            animation: "adminFadeIn 0.2s ease",
          }}
        />
      )}

      {/* ============================================================
          SIDEBAR
      ============================================================ */}
      <aside
        style={{
          width: sidebarWidth,
          minHeight: "100vh",
          background: "linear-gradient(180deg, #0f172a 0%, #1a2332 100%)",
          color: "white",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 50,
          boxShadow: "4px 0 20px rgba(0,0,0,0.2)",
          transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          ...(mobileOpen ? { transform: "translateX(0)" } : { transform: "translateX(-100%)" }),
          // Desktop always visible
          ...(typeof window !== "undefined" && window.innerWidth >= 900
            ? { transform: "translateX(0)" }
            : {}),
        }}
      >
        {/* ---- Logo ---- */}
        <div
          style={{
            padding: collapsed ? "28px 12px" : "28px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.02)",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            gap: "10px",
          }}
        >
          <Link
            to="/admin"
            style={{
              textDecoration: "none",
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "18px",
                boxShadow: "0 4px 12px rgba(59,130,246,0.4)",
                position: "relative",
                flexShrink: 0,
              }}
            >
              CA
              <Sparkles
                size={14}
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  color: "#fbbf24",
                  opacity: 0.8,
                }}
              />
            </div>

            {!collapsed && (
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    letterSpacing: "-0.5px",
                    background: "linear-gradient(135deg, #fff 60%, #94a3b8)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Code Arena
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#94a3b8",
                    marginTop: "2px",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                  }}
                >
                  Admin Panel
                </div>
              </div>
            )}
          </Link>

          {/* Collapse toggle (desktop only) */}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              aria-label="Collapse sidebar"
              title="Collapse sidebar (⌘B)"
              style={{
                background: "transparent",
                border: "none",
                color: "#64748b",
                cursor: "pointer",
                padding: "6px",
                borderRadius: "8px",
                display: "flex",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                e.currentTarget.style.color = "#cbd5e1";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#64748b";
              }}
            >
              <ChevronsLeft size={16} />
            </button>
          )}
        </div>

        {collapsed && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "12px 0 0",
            }}
          >
            <button
              onClick={() => setCollapsed(false)}
              aria-label="Expand sidebar"
              title="Expand sidebar (⌘B)"
              style={{
                background: "transparent",
                border: "none",
                color: "#64748b",
                cursor: "pointer",
                padding: "6px",
                borderRadius: "8px",
                display: "flex",
              }}
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        )}

        {/* ---- Tournament selector ---- */}
        <div
          style={{
            padding: collapsed ? "14px 8px" : "20px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {!collapsed && (
            <div
              style={{
                fontSize: "10px",
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "10px",
                fontWeight: 600,
              }}
            >
              Active Tournament
            </div>
          )}

          {tournaments.length > 0 ? (
            <div style={{ position: "relative" }} ref={tournamentMenuRef}>
              <button
                onClick={() => setShowTournamentMenu(!showTournamentMenu)}
                aria-haspopup="listbox"
                aria-expanded={showTournamentMenu}
                title={collapsed ? selectedTournament?.name || "Select Tournament" : undefined}
                style={{
                  width: "100%",
                  padding: collapsed ? "10px" : "12px 14px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.05)",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: collapsed ? "center" : "space-between",
                  textAlign: "left",
                  transition: "all 0.2s ease",
                  backdropFilter: "blur(10px)",
                }}
              >
                {collapsed ? (
                  <Crown size={18} style={{ color: "#60a5fa" }} />
                ) : (
                  <>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          color: "#f1f5f9",
                        }}
                      >
                        {selectedTournament?.name || "Select Tournament"}
                      </div>
                      {selectedTournament?.status && (
                        <div
                          style={{
                            fontSize: "10px",
                            color: "#94a3b8",
                            marginTop: "4px",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background:
                                selectedTournament.status === "ACTIVE" ||
                                selectedTournament.status === "REGISTRATION"
                                  ? "#22c55e"
                                  : selectedTournament.status === "COMPLETED"
                                    ? "#3b82f6"
                                    : "#f59e0b",
                            }}
                          />
                          {selectedTournament.status}
                        </div>
                      )}
                    </div>
                    <ChevronDown
                      size={16}
                      style={{
                        color: "#94a3b8",
                        transition: "transform 0.2s ease",
                        transform: showTournamentMenu ? "rotate(180deg)" : "none",
                        flexShrink: 0,
                      }}
                    />
                  </>
                )}
              </button>

              {showTournamentMenu && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    left: collapsed ? 0 : 0,
                    right: 0,
                    minWidth: collapsed ? 260 : undefined,
                    background: "#1e293b",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "12px",
                    overflow: "hidden",
                    zIndex: 100,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                  }}
                >
                  {/* Search */}
                  <div
                    style={{
                      padding: "10px",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Search size={14} color="#64748b" />
                    <input
                      autoFocus
                      value={tournamentSearch}
                      onChange={(e) => setTournamentSearch(e.target.value)}
                      placeholder="Search tournaments…"
                      style={{
                        flex: 1,
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        color: "#f1f5f9",
                        fontSize: "12px",
                        fontFamily: "inherit",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "10px",
                        color: "#475569",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "3px",
                        padding: "2px 6px",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "6px",
                      }}
                    >
                      <Command size={9} />K
                    </span>
                  </div>

                  {/* List */}
                  <div style={{ maxHeight: "280px", overflowY: "auto" }}>
                    {filteredTournaments.length === 0 ? (
                      <div
                        style={{
                          padding: "20px",
                          textAlign: "center",
                          fontSize: "12px",
                          color: "#64748b",
                        }}
                      >
                        No tournaments match
                      </div>
                    ) : (
                      filteredTournaments.map((tournament) => (
                        <button
                          key={tournament._id}
                          onClick={() => handleTournamentChange(tournament)}
                          style={{
                            width: "100%",
                            padding: "12px 14px",
                            border: "none",
                            background:
                              selectedTournament?._id === tournament._id
                                ? "rgba(59,130,246,0.2)"
                                : "transparent",
                            color: "white",
                            cursor: "pointer",
                            textAlign: "left",
                            transition: "background 0.15s ease",
                            borderLeft:
                              selectedTournament?._id === tournament._id
                                ? "3px solid #3b82f6"
                                : "3px solid transparent",
                            fontFamily: "inherit",
                          }}
                          onMouseEnter={(e) => {
                            if (selectedTournament?._id !== tournament._id) {
                              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedTournament?._id !== tournament._id) {
                              e.currentTarget.style.background = "transparent";
                            }
                          }}
                        >
                          <div
                            style={{
                              fontSize: "13px",
                              fontWeight: 600,
                              color:
                                selectedTournament?._id === tournament._id ? "#60a5fa" : "#f1f5f9",
                            }}
                          >
                            {tournament.name}
                          </div>
                          {tournament.status && (
                            <div
                              style={{
                                fontSize: "10px",
                                color: "#94a3b8",
                                marginTop: "4px",
                              }}
                            >
                              {tournament.status}
                            </div>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            !collapsed && (
              <div
                style={{
                  padding: "14px",
                  borderRadius: "12px",
                  border: "1px dashed rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.03)",
                  color: "#64748b",
                  fontSize: "12px",
                  textAlign: "center",
                }}
              >
                <Crown size={20} style={{ margin: "0 auto 6px", opacity: 0.3 }} />
                No tournaments yet
              </div>
            )
          )}
        </div>

        {/* ---- Navigation ---- */}
        <nav style={{ flex: 1, padding: "20px 12px", overflowY: "auto" }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/admin"}
                title={collapsed ? item.label : undefined}
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: collapsed ? "12px" : "12px 14px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  marginBottom: "4px",
                  borderRadius: "12px",
                  textDecoration: "none",
                  color: isActive ? "white" : "#94a3b8",
                  background: isActive
                    ? "linear-gradient(135deg, rgba(59,130,246,0.25), rgba(139,92,246,0.15))"
                    : "transparent",
                  fontSize: "14px",
                  fontWeight: isActive ? 600 : 500,
                  transition: "all 0.2s ease",
                  borderLeft: isActive ? "3px solid #3b82f6" : "3px solid transparent",
                })}
              >
                <Icon size={18} style={{ flexShrink: 0 }} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* ---- Bottom actions ---- */}
        <div
          style={{
            padding: collapsed ? "12px 8px" : "16px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <button
            onClick={() => navigate("/admin/tournaments/create")}
            title={collapsed ? "New Tournament" : undefined}
            style={{
              width: "100%",
              padding: collapsed ? "12px" : "12px",
              marginBottom: "10px",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              color: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontSize: "14px",
              fontWeight: 600,
              transition: "all 0.2s ease",
              boxShadow: "0 4px 12px rgba(59,130,246,0.3)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(59,130,246,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(59,130,246,0.3)";
            }}
          >
            <Plus size={18} />
            {!collapsed && "New Tournament"}
          </button>

          <button
            onClick={handleLogout}
            title={collapsed ? "Logout" : undefined}
            style={{
              width: "100%",
              padding: collapsed ? "10px" : "10px 12px",
              borderRadius: "10px",
              border: "none",
              background: "transparent",
              color: "#94a3b8",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              gap: "10px",
              fontSize: "14px",
              transition: "all 0.2s ease",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.1)";
              e.currentTarget.style.color = "#ef4444";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#94a3b8";
            }}
          >
            <LogOut size={18} />
            {!collapsed && "Logout"}
          </button>
        </div>
      </aside>

      {/* ============================================================
          MAIN AREA
      ============================================================ */}
      <main
        style={{
          marginLeft: `${sidebarWidth}px`,
          width: `calc(100% - ${sidebarWidth}px)`,
          minHeight: "100vh",
          background: "var(--bg-primary)",
          color: "var(--text-primary)",
          transition:
            "margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1), width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* ---- Top header ---- */}
        <header
          style={{
            height: "80px",
            background: "rgba(255,255,255,0.03)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 40px",
            position: "sticky",
            top: 0,
            zIndex: 40,
            gap: "16px",
          }}
        >
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="admin-mobile-menu-btn"
            style={{
              display: "none",
              background: "transparent",
              border: "none",
              color: "var(--text-primary)",
              cursor: "pointer",
              padding: "8px",
            }}
          >
            <Menu size={20} />
          </button>

          <div style={{ minWidth: 0, flex: 1 }}>
            {/* Breadcrumb */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "11px",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "1px",
                fontWeight: 600,
                marginBottom: "4px",
              }}
            >
              <span>Admin</span>
              <ChevronRight size={11} />
              <span style={{ color: "var(--text-primary)" }}>{currentNav.label}</span>
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "20px",
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.5px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              {currentNav.label}
              {selectedTournament && (
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#94a3b8",
                    padding: "3px 10px",
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background:
                        selectedTournament.status === "COMPLETED"
                          ? "#3b82f6"
                          : selectedTournament.status === "ACTIVE" ||
                              selectedTournament.status === "REGISTRATION"
                            ? "#22c55e"
                            : "#f59e0b",
                    }}
                  />
                  {selectedTournament.name}
                </span>
              )}
            </h1>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              position: "relative",
            }}
          >
            {/* Notifications */}
            <div ref={notifRef} style={{ position: "relative" }}>
              <button
                onClick={() => setShowNotifications((v) => !v)}
                aria-label="Notifications"
                style={{
                  padding: "8px 10px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  position: "relative",
                }}
              >
                <Bell size={16} />
                <span
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#ef4444",
                    boxShadow: "0 0 6px #ef4444",
                  }}
                />
              </button>

              {showNotifications && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 10px)",
                    right: 0,
                    width: "300px",
                    background: "#0F1420",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "12px",
                    padding: "8px",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                    zIndex: 100,
                  }}
                >
                  <div
                    style={{
                      padding: "8px 10px",
                      fontSize: "10px",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      color: "var(--text-muted)",
                      fontWeight: 700,
                    }}
                  >
                    Notifications
                  </div>
                  {[
                    "Group stage schedule released",
                    "New video submission to review",
                    "Contest results entered",
                  ].map((text) => (
                    <div
                      key={text}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                        display: "flex",
                        gap: "8px",
                        alignItems: "flex-start",
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "#3b82f6",
                          marginTop: 6,
                          flexShrink: 0,
                        }}
                      />
                      {text}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User menu */}
            <div ref={userMenuRef} style={{ position: "relative" }}>
              <button
                onClick={() => setShowUserMenu((v) => !v)}
                aria-label="User menu"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "6px 12px 6px 6px",
                  borderRadius: "100px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "13px",
                    fontWeight: 800,
                  }}
                >
                  {(user?.username || "A").charAt(0).toUpperCase()}
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    maxWidth: "120px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user?.username || "Admin"}
                </span>
              </button>

              {showUserMenu && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 10px)",
                    right: 0,
                    width: "220px",
                    background: "#0F1420",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "12px",
                    padding: "6px",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                    zIndex: 100,
                  }}
                >
                  <div
                    style={{
                      padding: "10px 12px",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      marginBottom: "4px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      {user?.username || "Admin"}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        marginTop: 2,
                      }}
                    >
                      {user?.email || ""}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate("/admin/settings");
                    }}
                    style={menuItemStyle}
                  >
                    <Settings size={14} />
                    Settings
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                    style={{
                      ...menuItemStyle,
                      color: "#ef4444",
                    }}
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* New Tournament (desktop) */}
            <button
              onClick={() => navigate("/admin/tournaments/create")}
              className="admin-hide-mobile"
              style={{
                padding: "10px 20px",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                color: "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                fontWeight: 600,
                transition: "all 0.2s ease",
                boxShadow: "0 4px 12px rgba(59,130,246,0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(59,130,246,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(59,130,246,0.3)";
              }}
            >
              <Plus size={18} />
              New Tournament
            </button>
          </div>
        </header>

        {/* ---- Content area ---- */}
        <div
          style={{
            padding: "32px 40px",
            maxWidth: "1440px",
            margin: "0 auto",
            background: "var(--bg-primary)",
            minHeight: "calc(100vh - 80px)",
          }}
          className="admin-content"
        >
          <Outlet
            context={{
              selectedTournament,
              tournaments,
            }}
          />
        </div>
      </main>

      <style>{`
        @keyframes adminFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @media (max-width: 900px) {
          aside {
            width: 280px !important;
            transform: translateX(${mobileOpen ? "0" : "-100%"}) !important;
          }
          main {
            margin-left: 0 !important;
            width: 100% !important;
          }
          header {
            padding: 0 20px !important;
            height: 72px !important;
          }
          .admin-content {
            padding: 20px !important;
          }
          .admin-mobile-menu-btn {
            display: flex !important;
          }
          .admin-hide-mobile {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Small style helpers                                                 */
/* ------------------------------------------------------------------ */

const menuItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  width: "100%",
  padding: "9px 12px",
  borderRadius: "8px",
  background: "transparent",
  border: "none",
  color: "var(--text-secondary)",
  fontSize: "13px",
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "left",
};

export default AdminLayout;
