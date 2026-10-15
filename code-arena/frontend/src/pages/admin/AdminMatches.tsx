import { useEffect, useState, useCallback } from "react";
import {
  Swords,
  RefreshCw,
  Crown,
  AlertCircle,
  CheckCircle,
  Trophy,
  Target,
  Clock,
  PlayCircle,
  ChevronRight,
} from "lucide-react";
import {  ErrorState, LoadingState } from "../../components/ui";
import { adminApi } from "../../services/adminApi";
import { useAdmin } from "../../context/AdminContext";

interface MatchParticipant {
  _id: string;
  user?: { username?: string; name?: string };
  group?: string;
  seed?: number;
  score?: number;
  solved?: number;
}

interface Match {
  _id: string;
  stage: string;
  matchNumber: number;
  participants: MatchParticipant[];
  winner?: MatchParticipant | null;
  status: "PENDING" | "LIVE" | "COMPLETED";
  contest?: { codeforcesContestName?: string; name?: string } | null;
  scheduledAt?: string;
}

// ---- Helpers -----------------------------------------------------------

const STAGE_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  QUARTER_FINAL: {
    label: "Quarter Finals",
    color: "#F59E0B",
    icon: <Target size={16} />,
  },
  SEMI_FINAL: {
    label: "Semi Finals",
    color: "#38BDF8",
    icon: <Trophy size={16} />,
  },
  FINAL: {
    label: "Grand Final",
    color: "#FFD700",
    icon: <Crown size={16} />,
  },
};

const getStageMeta = (stage: string) =>
  STAGE_META[stage] ?? {
    label: stage.replace(/_/g, " "),
    color: "#64B5F6",
    icon: <Swords size={16} />,
  };

const getStatusTone = (
  status: string,
): { color: string; bg: string; border: string; pulse: boolean } => {
  switch (status) {
    case "LIVE":
      return {
        color: "#EF5350",
        bg: "rgba(239, 83, 80, 0.12)",
        border: "rgba(239, 83, 80, 0.35)",
        pulse: true,
      };
    case "COMPLETED":
      return {
        color: "#22C55E",
        bg: "rgba(76, 175, 80, 0.12)",
        border: "rgba(76, 175, 80, 0.25)",
        pulse: false,
      };
    default:
      return {
        color: "rgba(255, 255, 255, 0.5)",
        bg: "rgba(255, 255, 255, 0.05)",
        border: "rgba(255, 255, 255, 0.1)",
        pulse: false,
      };
  }
};

export const AdminMatches = () => {
  const { selectedTournament } = useAdmin();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyMatchId, setBusyMatchId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const tournamentId = selectedTournament?._id;

  const loadMatches = useCallback(async () => {
    if (!tournamentId) {
      setMatches([]);
      setLoading(false);
      return;
    }
    try {
      setError("");
      const res = await adminApi.getMatches(tournamentId);
      setMatches((res.matches || []) as Match[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load matches");
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    setLoading(true);
    loadMatches();
  }, [loadMatches]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  };

  const handleSetWinner = async (match: Match, winnerId: string) => {
    // Two-click confirmation: first click arms, second click fires
    if (confirmingId !== match._id) {
      setConfirmingId(match._id);
      setTimeout(() => {
        setConfirmingId((prev) => (prev === match._id ? null : prev));
      }, 3000);
      return;
    }

    setConfirmingId(null);
    setBusyMatchId(match._id);
    setError("");
    setNotice("");
    try {
      await adminApi.setMatchWinner(match._id, winnerId);
      setNotice("Winner set and advanced to the next stage");
      await loadMatches();
      setTimeout(() => setNotice(""), 3500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set winner");
    } finally {
      setBusyMatchId(null);
    }
  };

  if (!selectedTournament) {
    return <ErrorState error="No tournament selected." />;
  }

  const stageGroups = ["QUARTER_FINAL", "SEMI_FINAL", "FINAL"] as const;

  // ---- Stats ---------------------------------------------------------
  const totalMatches = matches.length;
  const completedMatches = matches.filter((m) => m.status === "COMPLETED").length;
  const liveMatches = matches.filter((m) => m.status === "LIVE").length;
  const pendingMatches = matches.filter((m) => m.status === "PENDING").length;
  const progressPct = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;

  return (
    <div style={{ padding: "24px 0" }}>
      {/* ---- Header ---- */}
      <div
        style={{
          position: "relative",
          padding: "28px 32px",
          borderRadius: "16px",
          background: "linear-gradient(135deg, rgba(41, 121, 255, 0.06), rgba(56, 189, 248, 0.06))",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          overflow: "hidden",
          marginBottom: "20px",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "-50%",
            right: "-10%",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(41, 121, 255, 0.15), transparent 70%)",
            filter: "blur(60px)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #2979FF, #1565C0)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                boxShadow: "0 12px 32px rgba(41, 121, 255, 0.35)",
                flexShrink: 0,
              }}
            >
              <Swords size={24} />
            </div>
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "1.2px",
                  color: "rgba(100, 181, 246, 0.85)",
                  marginBottom: "2px",
                }}
              >
                Knockout Stage
              </div>
              <h1
                style={{
                  fontSize: "24px",
                  fontWeight: 800,
                  margin: 0,
                  letterSpacing: "-0.01em",
                  background: "linear-gradient(135deg, #FFFFFF, #90CAF9)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Match Management
              </h1>
              <div
                style={{
                  fontSize: "13px",
                  color: "rgba(255, 255, 255, 0.5)",
                  marginTop: "2px",
                }}
              >
                {selectedTournament.name} · {totalMatches} match
                {totalMatches !== 1 ? "es" : ""}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "12px",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 600,
              cursor: refreshing ? "wait" : "pointer",
              opacity: refreshing ? 0.6 : 1,
            }}
          >
            <RefreshCw
              size={14}
              style={{
                animation: refreshing ? "spin 0.9s linear infinite" : "none",
              }}
            />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* ---- Stats row ---- */}
      {!loading && matches.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <StatCard
            icon={<Swords size={18} />}
            label="Total Matches"
            value={totalMatches}
            color="#64B5F6"
          />
          <StatCard
            icon={<CheckCircle size={18} />}
            label="Completed"
            value={completedMatches}
            color="#22C55E"
          />
          <StatCard
            icon={<PlayCircle size={18} />}
            label="Live"
            value={liveMatches}
            color="#EF5350"
          />
          <StatCard
            icon={<Clock size={18} />}
            label="Pending"
            value={pendingMatches}
            color="#F59E0B"
          />
        </div>
      )}

      {/* ---- Progress bar ---- */}
      {!loading && matches.length > 0 && (
        <div
          style={{
            padding: "16px 20px",
            borderRadius: "12px",
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            <span style={{ color: "rgba(255, 255, 255, 0.5)" }}>Tournament Progress</span>
            <span style={{ color: "#64B5F6", fontWeight: 700 }}>
              {progressPct}% ({completedMatches}/{totalMatches})
            </span>
          </div>
          <div
            style={{
              height: "6px",
              borderRadius: "999px",
              background: "rgba(255, 255, 255, 0.05)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressPct}%`,
                borderRadius: "999px",
                background: "linear-gradient(90deg, #2979FF, #38BDF8, #FFD700)",
                transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 0 12px rgba(100, 181, 246, 0.4)",
              }}
            />
          </div>
        </div>
      )}

      {/* ---- Alerts ---- */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "14px 18px",
            borderRadius: "12px",
            background: "rgba(239, 83, 80, 0.1)",
            border: "1px solid rgba(239, 83, 80, 0.25)",
            color: "#EF5350",
            marginBottom: "16px",
            fontSize: "13px",
          }}
        >
          <AlertCircle size={18} />
          {error}
        </div>
      )}
      {notice && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "14px 18px",
            borderRadius: "12px",
            background: "rgba(76, 175, 80, 0.1)",
            border: "1px solid rgba(76, 175, 80, 0.25)",
            color: "#22C55E",
            marginBottom: "16px",
            fontSize: "13px",
          }}
        >
          <CheckCircle size={18} />
          {notice}
        </div>
      )}

      {/* ---- Content ---- */}
      {loading ? (
        <LoadingState label="Loading matches..." />
      ) : matches.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 24px",
            gap: "16px",
            textAlign: "center",
            background: "rgba(255, 255, 255, 0.02)",
            borderRadius: "16px",
            border: "1px dashed rgba(255, 255, 255, 0.08)",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "24px",
              background: "rgba(41, 121, 255, 0.06)",
              border: "1px solid rgba(41, 121, 255, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#64B5F6",
              marginBottom: "8px",
            }}
          >
            <Swords size={40} />
          </div>
          <h3
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "rgba(255, 255, 255, 0.7)",
              margin: 0,
            }}
          >
            No matches yet
          </h3>
          <p
            style={{
              fontSize: "14px",
              color: "rgba(255, 255, 255, 0.4)",
              margin: 0,
              maxWidth: "400px",
              lineHeight: 1.6,
            }}
          >
            Knockout matches will appear here once the tournament advances past the group stage.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          {stageGroups.map((stage) => {
            const stageMatches = matches.filter((m) => m.stage === stage);
            if (stageMatches.length === 0) return null;
            const meta = getStageMeta(stage);

            return (
              <section key={stage}>
                {/* Stage header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "16px",
                    paddingBottom: "10px",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "10px",
                      background: `${meta.color}15`,
                      border: `1px solid ${meta.color}30`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: meta.color,
                    }}
                  >
                    {meta.icon}
                  </div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "#fff",
                      letterSpacing: "0.01em",
                    }}
                  >
                    {meta.label}
                  </h2>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "3px 10px",
                      borderRadius: "999px",
                      background: `${meta.color}15`,
                      border: `1px solid ${meta.color}30`,
                      color: meta.color,
                    }}
                  >
                    {stageMatches.length} {stageMatches.length === 1 ? "match" : "matches"}
                  </span>
                </div>

                {/* Match grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                    gap: "16px",
                  }}
                >
                  {stageMatches.map((match) => (
                    <MatchCard
                      key={match._id}
                      match={match}
                      busy={busyMatchId === match._id}
                      confirming={confirmingId === match._id}
                      onSetWinner={handleSetWinner}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes matchPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
};

// ============================================================
// MATCH CARD
// ============================================================

interface MatchCardProps {
  match: Match;
  busy: boolean;
  confirming: boolean;
  onSetWinner: (match: Match, winnerId: string) => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, busy, confirming, onSetWinner }) => {
  const tone = getStatusTone(match.status);
  const canSetWinner = match.status !== "COMPLETED";

  return (
    <article
      style={{
        position: "relative",
        borderRadius: "14px",
        background: "rgba(255, 255, 255, 0.02)",
        border: `1px solid ${tone.pulse ? tone.border : "rgba(255, 255, 255, 0.06)"}`,
        overflow: "hidden",
        transition: "border-color 0.2s ease, transform 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Live pulse bar */}
      {tone.pulse && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "2px",
            background: `linear-gradient(90deg, transparent, ${tone.color}, transparent)`,
            animation: "matchPulse 1.8s ease-in-out infinite",
          }}
        />
      )}

      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "11px",
            fontWeight: 700,
            color: "rgba(255, 255, 255, 0.5)",
            textTransform: "uppercase",
            letterSpacing: "0.6px",
          }}
        >
          <Swords size={12} />
          Match {match.matchNumber}
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "3px 10px",
            borderRadius: "999px",
            background: tone.bg,
            border: `1px solid ${tone.border}`,
            color: tone.color,
            fontSize: "10px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: tone.color,
              boxShadow: tone.pulse ? `0 0 6px ${tone.color}` : "none",
              animation: tone.pulse ? "matchPulse 1.5s infinite" : "none",
            }}
          />
          {match.status}
        </div>
      </header>

      {/* Participants */}
      <div style={{ padding: "10px 12px" }}>
        {match.participants.map((p, idx) => {
          const isWinner = match.winner?._id === p._id;
          const isLast = idx === match.participants.length - 1;
          const name = p.user?.username || p.user?.name || "Unknown";
          const initial = name.charAt(0).toUpperCase();

          return (
            <div key={p._id}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 10px",
                  borderRadius: "10px",
                  background: isWinner ? "rgba(255, 215, 0, 0.08)" : "rgba(255, 255, 255, 0.02)",
                  border: isWinner ? "1px solid rgba(255, 215, 0, 0.25)" : "1px solid transparent",
                  transition: "background-color 0.15s ease",
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: isWinner
                      ? "linear-gradient(135deg, #FFD700, #FFA000)"
                      : "linear-gradient(135deg, #2979FF, #EAB308)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: 800,
                    color: "#fff",
                    flexShrink: 0,
                  }}
                >
                  {initial}
                </div>

                {/* Name + seed */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "13px",
                      fontWeight: isWinner ? 700 : 500,
                      color: isWinner ? "#FFD700" : "#fff",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {name}
                    {isWinner && <Crown size={12} color="#FFD700" />}
                  </div>
                  {p.seed && (
                    <div
                      style={{
                        fontSize: "10px",
                        color: "rgba(255, 255, 255, 0.35)",
                        marginTop: "1px",
                      }}
                    >
                      Seed #{p.seed}
                      {p.group && ` · Group ${p.group}`}
                    </div>
                  )}
                </div>

                {/* Score */}
                {typeof p.score === "number" && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      background: "rgba(56, 189, 248, 0.1)",
                      color: "#7DD3FC",
                      fontSize: "11px",
                      fontWeight: 700,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {p.score}
                  </div>
                )}

                {/* Set winner button */}
                {canSetWinner && !isWinner && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onSetWinner(match, p._id)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      background: confirming
                        ? "rgba(255, 152, 0, 0.2)"
                        : "rgba(41, 121, 255, 0.12)",
                      border: confirming
                        ? "1px solid rgba(255, 152, 0, 0.4)"
                        : "1px solid rgba(41, 121, 255, 0.25)",
                      color: confirming ? "#F59E0B" : "#64B5F6",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: busy ? "not-allowed" : "pointer",
                      opacity: busy ? 0.5 : 1,
                      whiteSpace: "nowrap",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {busy ? "Saving…" : confirming ? "Confirm?" : "Set Winner"}
                    {!busy && !confirming && <ChevronRight size={10} />}
                  </button>
                )}
              </div>

              {/* VS divider */}
              {!isLast && (
                <div
                  aria-hidden="true"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "2px 10px",
                    fontSize: "9px",
                    fontWeight: 700,
                    letterSpacing: "1px",
                    color: "rgba(255, 255, 255, 0.15)",
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                      height: "1px",
                      background:
                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
                    }}
                  />
                  VS
                  <span
                    style={{
                      flex: 1,
                      height: "1px",
                      background:
                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Contest footer */}
      {match.contest && (
        <footer
          style={{
            padding: "8px 16px",
            borderTop: "1px solid rgba(255, 255, 255, 0.04)",
            background: "rgba(255, 255, 255, 0.01)",
            fontSize: "11px",
            color: "rgba(255, 255, 255, 0.4)",
            textAlign: "center",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {match.contest.name || match.contest.codeforcesContestName}
        </footer>
      )}
    </article>
  );
};

// ============================================================
// STAT CARD
// ============================================================

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "14px 16px",
      borderRadius: "12px",
      background: "rgba(255, 255, 255, 0.02)",
      border: "1px solid rgba(255, 255, 255, 0.06)",
      transition: "transform 0.2s ease, border-color 0.2s ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.borderColor = `${color}40`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.06)";
    }}
  >
    <div
      style={{
        width: "38px",
        height: "38px",
        borderRadius: "10px",
        background: `${color}15`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color,
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div>
      <div
        style={{
          fontSize: "10px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.8px",
          color: "rgba(255, 255, 255, 0.5)",
          marginBottom: "2px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "20px",
          fontWeight: 800,
          color: "#fff",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
    </div>
  </div>
);

export default AdminMatches;
