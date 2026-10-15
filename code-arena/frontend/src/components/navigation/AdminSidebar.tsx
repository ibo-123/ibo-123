// frontend/src/components/navigation/AdminSidebar.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Trophy,
  Users,
  Calendar,
  Video,
  BarChart3,
  GitBranch,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Search,
  Crown,
  Command,
  Sparkles,
  FileText,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useAdmin } from "../../context/AdminContext";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  badge?: number;
  end?: boolean;
}

interface NavGroup {
  key: string;
  label: string;
  items: NavItem[];
  collapsible?: boolean;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export const AdminSidebar = () => {
  const { logout, user } = useAuth();
  const { selectedTournament, tournaments } = useAdmin();
  const location = useLocation();

  const [showTournamentMenu, setShowTournamentMenu] = useState(false);
  const [tournamentSearch, setTournamentSearch] = useState("");
  const [tournamentGroupOpen, setTournamentGroupOpen] = useState(true);
  const menuRef = useRef<HTMLDivElement | null>(null);

  /* ---- Close tournament menu on outside click ----------------- */
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (showTournamentMenu && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowTournamentMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showTournamentMenu]);

  /* ---- Close menu on route change ------------------------------ */
  useEffect(() => {
    setShowTournamentMenu(false);
  }, [location.pathname]);

  /* ---- Keyboard: ⌘K opens tournament switcher ------------------ */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowTournamentMenu((v) => !v);
      }
      if (e.key === "Escape") {
        setShowTournamentMenu(false);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  /* ---- Nav groups ---------------------------------------------- */
  const navGroups: NavGroup[] = useMemo(
    () => [
      {
        key: "general",
        label: "General",
        items: [
          { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
          { to: "/admin/tournaments", label: "Tournaments", icon: Trophy },
        ],
      },
      {
        key: "tournament",
        label: "Tournament",
        collapsible: true,
        items: [
          {
            to: "/admin/tournaments/current/participants",
            label: "Participants",
            icon: Users,
          },
          {
            to: "/admin/tournaments/current/contests",
            label: "Contests",
            icon: Calendar,
          },
          {
            to: "/admin/tournaments/current/videos",
            label: "Video Reviews",
            icon: Video,
          },
          {
            to: "/admin/tournaments/current/standings",
            label: "Standings",
            icon: BarChart3,
          },
          {
            to: "/admin/tournaments/current/bracket",
            label: "Bracket",
            icon: GitBranch,
          },
        ],
      },
      {
        key: "system",
        label: "System",
        items: [
          { to: "/admin/logs", label: "Logs", icon: FileText },
          { to: "/admin/settings", label: "Settings", icon: Settings },
        ],
      },
    ],
    [],
  );

  /* ---- Filter tournaments ------------------------------------- */
  const filteredTournaments = useMemo(() => {
    const q = tournamentSearch.trim().toLowerCase();
    if (!q) return tournaments;
    return tournaments.filter((t) => t.name.toLowerCase().includes(q));
  }, [tournaments, tournamentSearch]);

  /* ---- Active state helper ------------------------------------ */
  const isRouteActive = (path: string, end?: boolean) => {
    if (end) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="sidebar admin-sidebar">
      {/* ============================================================
          HEADER — brand + tournament switcher
      ============================================================ */}
      <div className="sidebar-header">
        <Link to="/admin" className="sidebar-brand-link">
          <span className="sidebar-brand-icon">
            <Crown size={18} />
            <Sparkles size={11} className="sidebar-brand-spark" />
          </span>
          <span className="sidebar-brand">Code Arena</span>
          <span className="sidebar-role admin">Admin</span>
        </Link>
      </div>

      {/* ============================================================
          TOURNAMENT SELECTOR
      ============================================================ */}
      <div className="sidebar-tournament" ref={menuRef}>
        <div className="sidebar-tournament-label">Active Tournament</div>

        {tournaments.length > 0 ? (
          <div className="sidebar-tournament-wrap">
            <button
              type="button"
              className="sidebar-tournament-btn"
              onClick={() => setShowTournamentMenu((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={showTournamentMenu}
            >
              <span
                className="sidebar-tournament-dot"
                data-status={selectedTournament?.status ?? "DRAFT"}
              />
              <span className="sidebar-tournament-name">
                {selectedTournament?.name ?? "Select Tournament"}
              </span>
              <ChevronDown
                size={14}
                className={`sidebar-tournament-chevron${showTournamentMenu ? " open" : ""}`}
              />
            </button>

            {showTournamentMenu && (
              <div className="sidebar-tournament-menu" role="listbox">
                {/* Search */}
                <div className="sidebar-tournament-search">
                  <Search size={13} />
                  <input
                    autoFocus
                    value={tournamentSearch}
                    onChange={(e) => setTournamentSearch(e.target.value)}
                    placeholder="Search tournaments…"
                  />
                  <span className="sidebar-tournament-kbd">
                    <Command size={9} />K
                  </span>
                </div>

                {/* List */}
                <div className="sidebar-tournament-list">
                  {filteredTournaments.length === 0 ? (
                    <div className="sidebar-tournament-empty">No tournaments match</div>
                  ) : (
                    filteredTournaments.map((t) => {
                      const active = selectedTournament?._id === t._id;
                      return (
                        <button
                          key={t._id}
                          type="button"
                          role="option"
                          aria-selected={active}
                          className={`sidebar-tournament-option${active ? " active" : ""}`}
                          onClick={() => {
                            // Your AdminContext likely exposes
                            // a setter — adjust if the method differs.
                            // For now, persist to localStorage and
                            // let AdminContext pick it up on reload.
                            try {
                              localStorage.setItem("admin-selected-tournament", t._id);
                            } catch {
                              /* ignore */
                            }
                            setShowTournamentMenu(false);
                            setTournamentSearch("");
                            // Force a route-level refresh:
                            window.location.reload();
                          }}
                        >
                          <span
                            className="sidebar-tournament-dot"
                            data-status={t.status ?? "DRAFT"}
                          />
                          <div className="sidebar-tournament-info">
                            <div className="sidebar-tournament-name-sm">{t.name}</div>
                            {t.status && (
                              <div className="sidebar-tournament-status">{t.status}</div>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="sidebar-tournament-empty-box">
            <Crown size={18} />
            <span>No tournaments yet</span>
            <Link to="/admin/tournaments/create" className="sidebar-tournament-cta">
              Create one
            </Link>
          </div>
        )}
      </div>

      {/* ============================================================
          NAVIGATION
      ============================================================ */}
      <nav className="sidebar-nav">
        {navGroups.map((group) => {
          const groupHasActiveItem = group.items.some((item) => isRouteActive(item.to, item.end));

          return (
            <div key={group.key} className="sidebar-group">
              {group.collapsible ? (
                <button
                  type="button"
                  className={`sidebar-group-toggle${groupHasActiveItem ? " active" : ""}`}
                  onClick={() => setTournamentGroupOpen((v) => !v)}
                  aria-expanded={tournamentGroupOpen}
                >
                  <span>{group.label}</span>
                  {tournamentGroupOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
              ) : (
                <div className="sidebar-group-label">{group.label}</div>
              )}

              {(!group.collapsible || tournamentGroupOpen) && (
                <div className="sidebar-group-items">
                  {group.items.map(({ to, label, icon: Icon, badge, end }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={end}
                      className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
                    >
                      <Icon size={18} />
                      <span className="sidebar-link-label">{label}</span>
                      {badge !== undefined && badge > 0 && (
                        <span className="sidebar-link-badge">{badge}</span>
                      )}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ============================================================
          FOOTER — user + logout
      ============================================================ */}
      <div className="sidebar-footer">
        {user && (
          <div className="sidebar-user">
            <span className="sidebar-user-avatar">
              {(user.username ?? "A").charAt(0).toUpperCase()}
            </span>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.username ?? "Admin"}</div>
              <div className="sidebar-user-role">Administrator</div>
            </div>
          </div>
        )}

        <button type="button" onClick={logout} className="sidebar-logout">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
