import React from "react";
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
  Video,
  BarChart3,
  Swords,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useAdmin } from "../context/AdminContext";
import type { Tournament } from "../types";

const AdminLayout: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedTournament, tournaments, setSelectedTournament, refreshTournaments } = useAdmin();
  const [showTournamentMenu, setShowTournamentMenu] = React.useState(false);

  React.useEffect(() => {
    refreshTournaments();
  }, [location.pathname, refreshTournaments]);

  const handleTournamentChange = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    localStorage.setItem("admin-selected-tournament", tournament._id);
    setShowTournamentMenu(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // ✅ Updated navigation — includes Contests, Videos, Standings, Matches
  const navItems = [
    { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { label: "Contests", path: "/admin/contests", icon: Trophy },
    { label: "Participants", path: "/admin/participants", icon: Users },
    { label: "Groups", path: "/admin/groups", icon: Layers },
    { label: "Standings", path: "/admin/standings", icon: BarChart3 },
    { label: "Bracket", path: "/admin/bracket", icon: GitBranch },
    { label: "Matches", path: "/admin/matches", icon: Swords },
    { label: "Videos", path: "/admin/videos", icon: Video },
    { label: "Logs", path: "/admin/logs", icon: FileText },
    { label: "Settings", path: "/admin/settings", icon: Settings },
  ];

  const getStatusColor = (status?: string): string => {
    if (!status) return "#f59e0b";
    const s = status.toUpperCase();
    if (s === "COMPLETED" || s === "FINISHED") return "#3b82f6";
    if (s === "REGISTRATION" || s === "ACTIVE" || s === "GROUP_STAGE") return "#22c55e";
    if (s === "DRAFT") return "#f59e0b";
    return "#f59e0b";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
      }}
    >
      {/* SIDEBAR */}
      <aside
        style={{
          width: "280px",
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
        }}
      >
        {/* Logo (unchanged) */}
        <div
          style={{
            padding: "28px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.02)",
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
                fontSize: "20px",
                boxShadow: "0 4px 12px rgba(59,130,246,0.4)",
                position: "relative",
              }}
            >
              CA
              <Sparkles
                size={14}
                style={{ position: "absolute", top: -4, right: -4, color: "#fbbf24", opacity: 0.8 }}
              />
            </div>
            <div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  letterSpacing: "-0.5px",
                  background: "linear-gradient(135deg, #fff 60%, #94a3b8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
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
          </Link>
        </div>

        {/* Tournament selector (unchanged) */}
        <div style={{ padding: "20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
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

          {tournaments.length > 0 ? (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowTournamentMenu(!showTournamentMenu)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.05)",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  textAlign: "left",
                }}
              >
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
                          background: getStatusColor(selectedTournament.status),
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
                    transform: showTournamentMenu ? "rotate(180deg)" : "none",
                  }}
                />
              </button>

              {showTournamentMenu && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    left: 0,
                    right: 0,
                    background: "#1e293b",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "12px",
                    overflow: "hidden",
                    zIndex: 100,
                    maxHeight: "280px",
                    overflowY: "auto",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                  }}
                >
                  {tournaments.map((tournament) => (
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
                        borderLeft:
                          selectedTournament?._id === tournament._id
                            ? "3px solid #3b82f6"
                            : "3px solid transparent",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: selectedTournament?._id === tournament._id ? "#60a5fa" : "#f1f5f9",
                        }}
                      >
                        {tournament.name}
                      </div>
                      {tournament.status && (
                        <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "4px" }}>
                          {tournament.status}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
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
          )}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "20px 12px", overflowY: "auto" }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/admin"}
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 14px",
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
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom actions (unchanged) */}
        <div
          style={{
            padding: "16px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <button
            onClick={() => navigate("/admin/tournaments/create")}
            style={{
              width: "100%",
              padding: "12px",
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
              boxShadow: "0 4px 12px rgba(59,130,246,0.3)",
            }}
          >
            <Plus size={18} />
            New Tournament
          </button>

          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "10px",
              border: "none",
              background: "transparent",
              color: "#94a3b8",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "14px",
            }}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN AREA — unchanged */}
      <main
        style={{
          marginLeft: "280px",
          width: "calc(100% - 280px)",
          minHeight: "100vh",
          background: "var(--bg-primary)",
          color: "var(--text-primary)",
        }}
      >
        <header
          style={{
            height: "80px",
            background: "rgba(255,255,255,0.03)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 40px",
            position: "sticky",
            top: 0,
            zIndex: 40,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "22px",
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.5px",
              }}
            >
              Admin Dashboard
            </h1>
            {selectedTournament && (
              <div
                style={{
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  marginTop: "4px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: getStatusColor(selectedTournament.status),
                  }}
                />
                {selectedTournament.name}
              </div>
            )}
          </div>
        </header>

        <div
          style={{
            padding: "32px 40px",
            maxWidth: "1440px",
            margin: "0 auto",
            minHeight: "calc(100vh - 80px)",
          }}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
