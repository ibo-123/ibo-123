// frontend/src/pages/participant/Dashboard.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Trophy,
  Medal,
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Zap,
  Target,
  TrendingUp,
  Award,
  BarChart3,
  Swords,
  Flame,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { tournamentApi } from "../../services/tournamentApi";
import { LoadingState, ErrorState } from "../../components/common";
import type { Tournament, Participant } from "../../types";
import "./Dashboard.css";

export const ParticipantDashboard = () => {
  const { user } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?._id) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        // ---- 1. Try "my tournaments" (participant-scoped endpoint) ----
        try {
          const res = await tournamentApi.getMyTournaments();
          if (cancelled) return;

          const mine = res.tournaments ?? [];
          const first = mine[0];

          if (first) {
            setTournament(first.tournament);
            setParticipant(first);
            setLoading(false);
            return;
          }
        } catch {
          // Endpoint missing/errored — fall through to list approach
        }

        // ---- 2. Fallback: scan the public tournament list ----
        const { tournaments } = await tournamentApi.list();
        if (cancelled) return;

        const eligible = tournaments.filter(
          (t) => t.status !== "DRAFT" && t.status !== "COMPLETED" && t.status !== "CANCELLED",
        );

        if (eligible.length === 0) {
          setTournament(null);
          setParticipant(null);
          setLoading(false);
          return;
        }

        let foundTournament: Tournament | null = null;
        let foundParticipant: Participant | null = null;

        for (const t of eligible) {
          try {
            const { participants } = await tournamentApi.participants(t._id);
            const me = participants.find((p) => {
              const u = (p as unknown as { user?: unknown }).user;
              const uid =
                typeof u === "string"
                  ? u
                  : u && typeof u === "object"
                    ? ((u as { _id?: string; id?: string })._id ?? (u as { id?: string }).id)
                    : undefined;
              const anyP = p as unknown as {
                userId?: string;
                username?: string;
              };
              return (
                uid === user._id || anyP.userId === user._id || anyP.username === user.username
              );
            });
            if (me) {
              foundTournament = t;
              foundParticipant = me;
              break;
            }
          } catch {
            continue;
          }
        }

        if (cancelled) return;

        if (foundTournament) {
          setTournament(foundTournament);
          setParticipant(foundParticipant);
        } else {
          setTournament(eligible[0]);
          setParticipant(null);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user?._id]); // ← ONLY user._id — constant array size

  if (loading) {
    return <LoadingState variant="spinner" label="Loading dashboard..." />;
  }
  if (error) return <ErrorState error={error} />;

  const isApproved = participant?.registrationStatus === "APPROVED";
  const isPending = participant?.registrationStatus === "PENDING";
  const isRejected = participant?.registrationStatus === "REJECTED";
  const isEliminated = participant?.status === "ELIMINATED";
  const hasAdvanced = participant?.status === "ADVANCED" || participant?.status === "CHAMPION";

  const statusConfig = isApproved
    ? {
        label: "Approved",
        color: "#22C55E",
        icon: CheckCircle2,
        bg: "rgba(76, 175, 80, 0.1)",
      }
    : isPending
      ? {
          label: "Pending",
          color: "#F59E0B",
          icon: Clock,
          bg: "rgba(255, 152, 0, 0.1)",
        }
      : isRejected
        ? {
            label: "Rejected",
            color: "#EF5350",
            icon: XCircle,
            bg: "rgba(239, 83, 80, 0.1)",
          }
        : isEliminated
          ? {
              label: "Eliminated",
              color: "#EF5350",
              icon: XCircle,
              bg: "rgba(239, 83, 80, 0.1)",
            }
          : hasAdvanced
            ? {
                label: "Advanced",
                color: "#FFD700",
                icon: Star,
                bg: "rgba(255, 215, 0, 0.1)",
              }
            : {
                label: "Not Registered",
                color: "#9E9E9E",
                icon: Clock,
                bg: "rgba(158, 158, 158, 0.1)",
              };

  const StatusIcon = statusConfig.icon;

  return (
    <div className="participant-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <div className="dashboard-greeting">
            <div className="greeting-icon">
              <Flame size={26} />
            </div>
            <div>
              <h1>Welcome back, {user?.username}</h1>
              <p className="subtitle">Here's your current tournament status</p>
            </div>
          </div>
        </div>
        <div className="header-glow" aria-hidden="true" />
      </div>

      {participant ? (
        <>
          {/* Status Cards */}
          <div className="status-grid">
            <div className="status-card">
              <div className="status-card-icon">
                <Trophy size={18} />
              </div>
              <div className="status-card-content">
                <div className="status-label">Tournament</div>
                <div className="status-value">{tournament?.name || "—"}</div>
              </div>
            </div>

            <div
              className="status-card"
              style={{ "--status-color": statusConfig.color } as React.CSSProperties}
            >
              <div
                className="status-card-icon"
                style={{
                  background: statusConfig.bg,
                  color: statusConfig.color,
                }}
              >
                <StatusIcon size={18} />
              </div>
              <div className="status-card-content">
                <div className="status-label">Status</div>
                <div className="status-value" style={{ color: statusConfig.color }}>
                  {statusConfig.label}
                </div>
              </div>
            </div>

            <div className="status-card">
              <div className="status-card-icon">
                <Users size={18} />
              </div>
              <div className="status-card-content">
                <div className="status-label">Group</div>
                <div className="status-value">
                  {participant.group ? `Group ${participant.group}` : "—"}
                </div>
              </div>
            </div>

            <div className="status-card">
              <div className="status-card-icon">
                <Target size={18} />
              </div>
              <div className="status-card-content">
                <div className="status-label">Seed</div>
                <div className="status-value">#{participant.seed || "—"}</div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-icon rank">
                <Medal size={22} />
              </div>
              <div className="stat-card-content">
                <div className="stat-label">Rank</div>
                <div className="stat-value">#{participant.rank || "—"}</div>
              </div>
              <div className="stat-card-trend">
                <TrendingUp size={14} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-icon score">
                <Trophy size={22} />
              </div>
              <div className="stat-card-content">
                <div className="stat-label">Score</div>
                <div className="stat-value">
                  {participant.score || 0} <span className="stat-unit">pts</span>
                </div>
              </div>
              <div className="stat-card-trend">
                <BarChart3 size={14} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-icon solved">
                <Star size={22} />
              </div>
              <div className="stat-card-content">
                <div className="stat-label">Solved</div>
                <div className="stat-value">{participant.solved || 0}</div>
              </div>
              <div className="stat-card-trend">
                <Award size={14} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-icon penalty">
                <Clock size={22} />
              </div>
              <div className="stat-card-content">
                <div className="stat-label">Penalty</div>
                <div className="stat-value">{participant.penalty || 0}</div>
              </div>
              <div className="stat-card-trend">
                <Zap size={14} />
              </div>
            </div>
          </div>

          {/* Phase Card */}
          <div className="phase-card">
            <div className="phase-glow" aria-hidden="true" />
            <div className="phase-header">
              <div className="phase-icon">
                <Swords size={20} />
              </div>
              <div className="phase-label">Current Phase</div>
            </div>

            <div className="phase-value">
              {tournament?.currentStage?.replace(/_/g, " ") || tournament?.status || "Registration"}
            </div>

            <div className="phase-status">
              {isEliminated ? (
                <div className="phase-status-badge eliminated">
                  <XCircle size={18} /> Eliminated
                </div>
              ) : hasAdvanced ? (
                <div className="phase-status-badge advanced">
                  <CheckCircle2 size={18} /> Advanced
                </div>
              ) : isApproved ? (
                <div className="phase-status-badge active">
                  <Clock size={18} /> Active
                </div>
              ) : (
                <div className="phase-status-badge pending">
                  <Clock size={18} /> Pending
                </div>
              )}
            </div>

            <div className="phase-progress">
              <div className="phase-progress-track">
                <div
                  className="phase-progress-fill"
                  style={{
                    width: hasAdvanced ? "75%" : isApproved ? "50%" : isPending ? "25%" : "10%",
                    background: hasAdvanced
                      ? "linear-gradient(90deg, #FFD700, #FFA000)"
                      : isApproved
                        ? "linear-gradient(90deg, #22C55E, #2E7D32)"
                        : "linear-gradient(90deg, #F59E0B, #F57C00)",
                  }}
                />
              </div>
              <div className="phase-progress-labels">
                <span>Registration</span>
                <span>Group</span>
                <span>Knockout</span>
                <span>Final</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="dashboard-actions">
            <Link
              to={`/dashboard/tournaments/${tournament?._id}`}
              className="btn-primary btn-large"
            >
              <span>View Tournament</span>
              <ArrowRight size={18} />
            </Link>
            <Link to="/dashboard/standings" className="btn-secondary btn-large">
              <BarChart3 size={18} />
              <span>View Standings</span>
            </Link>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-icon" aria-hidden="true">
            <Trophy size={48} />
          </div>
          <h3>{tournament ? "Not Registered" : "No Tournaments Yet"}</h3>
          <p>
            {tournament
              ? `You haven't joined "${tournament.name}" yet. Register to compete!`
              : "No active tournaments are available right now. Check back soon!"}
          </p>
          <Link to="/tournaments" className="btn-primary btn-large">
            <span>Browse Tournaments</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      )}
    </div>
  );
};

export default ParticipantDashboard;
