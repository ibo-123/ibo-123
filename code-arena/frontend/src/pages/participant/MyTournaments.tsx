// frontend/src/pages/participant/MyTournaments.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  Users,
  Calendar,
  ChevronRight,
  Swords,
  Zap,
  Target,
  Award,
  ArrowRight,
  Filter,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { tournamentApi } from "../../services/tournamentApi";
import { LoadingState, ErrorState, StatusBadge } from "../../components/common";
import type { Tournament, Participant } from "../../types";

type FilterType = "all" | "active" | "upcoming" | "completed";

export const MyTournaments = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [participants, setParticipants] = useState<Record<string, Participant>>({});
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    const load = async () => {
      try {
        const { tournaments: allTournaments } = await tournamentApi.list();

        const myTournaments: Tournament[] = [];
        const participantMap: Record<string, Participant> = {};

        for (const t of allTournaments) {
          try {
            const { participants: pList } = await tournamentApi.participants(t._id);
            const myP = pList.find((p) => p.user._id === user?._id);
            if (myP) {
              myTournaments.push(t);
              participantMap[t._id] = myP;
            }
          } catch {
            // Skip tournaments that can't be loaded
          }
        }

        setTournaments(myTournaments);
        setParticipants(participantMap);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading)
    return <LoadingState variant="spinner" size="lg" label="Loading your tournaments..." />;
  if (error) return <ErrorState error={error} />;

  // Filter logic
  const filteredTournaments = tournaments.filter((t) => {
    if (filter === "all") return true;
    if (filter === "active") return t.status !== "COMPLETED" && t.status !== "CANCELLED";
    if (filter === "upcoming") return t.status === "DRAFT" || !t.tournamentStart;
    if (filter === "completed") return t.status === "COMPLETED";
    return true;
  });

  const counts = {
    all: tournaments.length,
    active: tournaments.filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED").length,
    upcoming: tournaments.filter((t) => t.status === "DRAFT" || !t.tournamentStart).length,
    completed: tournaments.filter((t) => t.status === "COMPLETED").length,
  };

  return (
    <div className="my-tournaments">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-glow" />
        <div className="page-header-content">
          <div className="header-icon">
            <Trophy size={26} />
          </div>
          <div>
            <h1>My Tournaments</h1>
            <p className="subtitle">
              {tournaments.length > 0
                ? `You're competing in ${tournaments.length} tournament${tournaments.length > 1 ? "s" : ""}`
                : "Your competitive journey starts here"}
            </p>
          </div>
        </div>
      </div>

      {tournaments.length > 0 ? (
        <>
          {/* Filters */}
          <div className="filter-bar">
            <div className="filter-label">
              <Filter size={14} />
              Filter
            </div>
            <div className="filter-chips">
              {(["all", "active", "upcoming", "completed"] as FilterType[]).map((f) => (
                <button
                  key={f}
                  className={`filter-chip ${filter === f ? "active" : ""}`}
                  onClick={() => setFilter(f)}
                >
                  <span className="chip-label">{f.charAt(0).toUpperCase() + f.slice(1)}</span>
                  <span className="chip-count">{counts[f]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tournaments List */}
          {filteredTournaments.length > 0 ? (
            <div className="tournaments-list">
              {filteredTournaments.map((t) => {
                const p = participants[t._id];
                const isActive = t.status !== "COMPLETED" && t.status !== "CANCELLED";

                return (
                  <Link
                    key={t._id}
                    to={`/dashboard/tournaments/${t._id}`}
                    className="tournament-row"
                  >
                    <div className="row-glow" />

                    {/* Left: Icon + Info */}
                    <div className="row-main">
                      <div className={`row-icon ${isActive ? "active" : "completed"}`}>
                        {isActive ? <Swords size={24} /> : <Award size={24} />}
                      </div>

                      <div className="tournament-info">
                        <div className="tournament-title-row">
                          <h3>{t.name}</h3>
                          {isActive && <span className="live-pill">Active</span>}
                        </div>

                        <div className="tournament-meta">
                          <span className="meta-pill">
                            <Users size={13} />
                            {t.participantCount || 0} participants
                          </span>
                          <span className="meta-pill">
                            <Calendar size={13} />
                            {t.tournamentStart
                              ? new Date(t.tournamentStart).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "TBD"}
                          </span>
                          {p?.group && (
                            <span className="meta-pill group-pill">
                              <Target size={13} />
                              Group {p.group}
                            </span>
                          )}
                          {t.currentStage && (
                            <span className="meta-pill stage-pill">
                              <Zap size={13} />
                              {t.currentStage.replace(/_/g, " ")}
                            </span>
                          )}
                        </div>

                        {/* Mini stat row */}
                        {p && (
                          <div className="tournament-stats">
                            <div className="mini-stat">
                              <span className="mini-stat-label">Rank</span>
                              <span className="mini-stat-value">#{p.rank || "—"}</span>
                            </div>
                            <div className="mini-stat-divider" />
                            <div className="mini-stat">
                              <span className="mini-stat-label">Score</span>
                              <span className="mini-stat-value">{p.score || 0}</span>
                            </div>
                            <div className="mini-stat-divider" />
                            <div className="mini-stat">
                              <span className="mini-stat-label">Solved</span>
                              <span className="mini-stat-value">{p.solved || 0}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Status + Arrow */}
                    <div className="row-status">
                      <div className="status-badge-wrap">
                        <StatusBadge status={p?.registrationStatus || p?.status || "PENDING"} />
                      </div>

                      <div className="row-arrow">
                        <ChevronRight size={20} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <Filter size={40} />
              </div>
              <h3>No {filter} tournaments</h3>
              <p>Try a different filter to see your tournaments.</p>
              <button onClick={() => setFilter("all")} className="btn-secondary">
                Show All
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-icon gold">
            <Trophy size={48} />
          </div>
          <h3>No tournaments yet</h3>
          <p>You haven't joined any tournaments. Browse and register for one!</p>
          <Link to="/tournaments" className="btn-primary btn-large">
            <span>Browse Tournaments</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      )}

      <style>{`
        .my-tournaments {
          display: flex;
          flex-direction: column;
          gap: 28px;
          padding-bottom: 40px;
        }

        /* ============================================
           HEADER
        ============================================ */
        .page-header {
          position: relative;
          padding: 36px 40px;
          border-radius: 28px;
          background: linear-gradient(135deg, rgba(41, 121, 255, 0.08), rgba(56, 189, 248, 0.08));
          border: 1px solid rgba(255, 255, 255, 0.08);
          overflow: hidden;
        }

        .page-header-glow {
          position: absolute;
          top: -60%;
          right: -10%;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 215, 0, 0.15), transparent 70%);
          filter: blur(70px);
          pointer-events: none;
        }

        .page-header-content {
          display: flex;
          align-items: center;
          gap: 22px;
          position: relative;
          z-index: 1;
        }

        .header-icon {
          width: 64px;
          height: 64px;
          border-radius: 20px;
          background: linear-gradient(135deg, #FFD700, #FFA000);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 16px 40px rgba(255, 215, 0, 0.35);
          flex-shrink: 0;
        }

        .page-header h1 {
          font-size: 30px;
          font-weight: 800;
          margin: 0 0 6px;
          background: linear-gradient(135deg, #FFFFFF, #90CAF9);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .page-header .subtitle {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.55);
          margin: 0;
        }

        /* ============================================
           FILTER BAR
        ============================================ */
        .filter-bar {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .filter-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .filter-chips {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .filter-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 18px;
          border-radius: 100px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.07);
          color: rgba(255, 255, 255, 0.6);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
          font-family: inherit;
        }

        .filter-chip:hover {
          background: rgba(255, 255, 255, 0.07);
          border-color: rgba(255, 255, 255, 0.14);
          color: white;
        }

        .filter-chip.active {
          background: linear-gradient(135deg, rgba(41, 121, 255, 0.18), rgba(41, 121, 255, 0.08));
          border-color: rgba(41, 121, 255, 0.35);
          color: white;
          box-shadow: 0 6px 20px rgba(41, 121, 255, 0.2);
        }

        .chip-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 22px;
          height: 22px;
          padding: 0 7px;
          border-radius: 100px;
          background: rgba(255, 255, 255, 0.08);
          font-size: 11px;
          font-weight: 700;
        }

        .filter-chip.active .chip-count {
          background: rgba(41, 121, 255, 0.35);
          color: #90CAF9;
        }

        /* ============================================
           TOURNAMENTS LIST
        ============================================ */
        .tournaments-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .tournament-row {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          padding: 26px 30px;
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 22px;
          text-decoration: none;
          color: inherit;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          isolation: isolate;
        }

        .row-glow {
          position: absolute;
          top: -50%;
          right: -10%;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(41, 121, 255, 0.15), transparent 70%);
          filter: blur(70px);
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: none;
        }

        .tournament-row:hover {
          transform: translateY(-4px);
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(41, 121, 255, 0.25);
          box-shadow: 0 20px 52px rgba(0, 0, 0, 0.4);
        }

        .tournament-row:hover .row-glow {
          opacity: 1;
        }

        .row-main {
          display: flex;
          align-items: center;
          gap: 22px;
          flex: 1;
          min-width: 0;
          position: relative;
          z-index: 1;
        }

        .row-icon {
          width: 60px;
          height: 60px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }

        .row-icon.active {
          background: linear-gradient(135deg, rgba(41, 121, 255, 0.18), rgba(41, 121, 255, 0.06));
          border: 1px solid rgba(41, 121, 255, 0.28);
          color: #64B5F6;
        }

        .row-icon.completed {
          background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 215, 0, 0.05));
          border: 1px solid rgba(255, 215, 0, 0.22);
          color: #FFD700;
        }

        .tournament-row:hover .row-icon {
          transform: scale(1.06) rotate(-3deg);
        }

        .tournament-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .tournament-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .tournament-info h3 {
          font-size: 19px;
          font-weight: 700;
          color: white;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .live-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 100px;
          background: rgba(76, 175, 80, 0.14);
          color: #22C55E;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          border: 1px solid rgba(76, 175, 80, 0.22);
        }

        .live-pill::before {
          content: '';
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22C55E;
          box-shadow: 0 0 8px rgba(76, 175, 80, 0.8);
          animation: livePulse 1.5s infinite;
        }

        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }

        .tournament-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .meta-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 100px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.55);
          font-size: 12px;
          font-weight: 600;
        }

        .meta-pill svg {
          opacity: 0.7;
        }

        .group-pill {
          background: rgba(56, 189, 248, 0.1);
          border-color: rgba(56, 189, 248, 0.18);
          color: #7DD3FC;
        }

        .group-pill svg {
          color: #7DD3FC;
          opacity: 1;
        }

        .stage-pill {
          background: rgba(41, 121, 255, 0.1);
          border-color: rgba(41, 121, 255, 0.18);
          color: #64B5F6;
          text-transform: capitalize;
        }

        .stage-pill svg {
          color: #64B5F6;
          opacity: 1;
        }

        /* Mini stats row */
        .tournament-stats {
          display: flex;
          align-items: center;
          gap: 18px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .mini-stat {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .mini-stat-label {
          font-size: 10px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.35);
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        .mini-stat-value {
          font-size: 15px;
          font-weight: 800;
          color: white;
        }

        .mini-stat-divider {
          width: 1px;
          height: 14px;
          background: rgba(255, 255, 255, 0.07);
        }

        /* Right side */
        .row-status {
          display: flex;
          align-items: center;
          gap: 18px;
          flex-shrink: 0;
          position: relative;
          z-index: 1;
        }

        .status-badge-wrap {
          display: flex;
          align-items: center;
        }

        .row-arrow {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: rgba(41, 121, 255, 0.1);
          border: 1px solid rgba(41, 121, 255, 0.18);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64B5F6;
          transition: all 0.3s ease;
        }

        .tournament-row:hover .row-arrow {
          background: linear-gradient(135deg, #2979FF, #1565C0);
          border-color: transparent;
          color: white;
          transform: translateX(5px);
          box-shadow: 0 10px 28px rgba(41, 121, 255, 0.45);
        }

        /* ============================================
           EMPTY STATE
        ============================================ */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 90px 24px;
          gap: 18px;
          text-align: center;
          background: rgba(255, 255, 255, 0.025);
          border-radius: 28px;
          border: 1px dashed rgba(255, 255, 255, 0.1);
        }

        .empty-icon {
          width: 96px;
          height: 96px;
          border-radius: 32px;
          background: rgba(41, 121, 255, 0.08);
          border: 1px solid rgba(41, 121, 255, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64B5F6;
          margin-bottom: 10px;
        }

        .empty-icon.gold {
          background: rgba(255, 215, 0, 0.08);
          border-color: rgba(255, 215, 0, 0.12);
          color: #FFD700;
        }

        .empty-state h3 {
          font-size: 26px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.75);
          margin: 0;
        }

        .empty-state p {
          color: rgba(255, 255, 255, 0.45);
          margin: 0 0 14px;
          max-width: 420px;
          line-height: 1.6;
        }

        .btn-primary,
        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 13px 26px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s ease;
          cursor: pointer;
          border: none;
          font-family: inherit;
        }

        .btn-primary {
          background: linear-gradient(135deg, #2979FF, #1565C0);
          color: white;
          box-shadow: 0 10px 28px rgba(41, 121, 255, 0.35);
        }

        .btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 14px 36px rgba(41, 121, 255, 0.45);
        }

        .btn-large {
          padding: 15px 30px;
          font-size: 15px;
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: white;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.09);
          border-color: rgba(255, 255, 255, 0.22);
          transform: translateY(-3px);
        }

        /* ============================================
           RESPONSIVE
        ============================================ */
        @media (max-width: 900px) {
          .tournament-row {
            flex-direction: column;
            align-items: stretch;
            gap: 18px;
          }

          .row-status {
            justify-content: space-between;
            padding-top: 18px;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
          }

          .row-arrow {
            width: 38px;
            height: 38px;
          }
        }

        @media (max-width: 640px) {
          .page-header {
            padding: 26px;
          }

          .page-header h1 {
            font-size: 23px;
          }

          .header-icon {
            width: 52px;
            height: 52px;
          }

          .tournament-row {
            padding: 22px;
          }

          .row-icon {
            width: 52px;
            height: 52px;
          }

          .tournament-info h3 {
            font-size: 17px;
          }

          .filter-bar {
            flex-direction: column;
            align-items: flex-start;
            gap: 14px;
          }

          .tournament-stats {
            flex-wrap: wrap;
            gap: 14px;
          }
        }

        @media (max-width: 480px) {
          .page-header-content {
            gap: 16px;
          }

          .tournament-meta {
            gap: 6px;
          }

          .meta-pill {
            font-size: 11px;
            padding: 4px 9px;
          }

          .tournament-title-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .row-main {
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default MyTournaments;
