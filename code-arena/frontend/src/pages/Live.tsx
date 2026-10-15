// frontend/src/pages/Live.tsx
import { useEffect, useState } from "react";
import {
  ExternalLink,
  Trophy,
  Clock,
  Calendar,
  TrendingUp,
  RefreshCw,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { contestApi } from "../services/contestApi";
import { tournamentApi } from "../services/tournamentApi";
import type { Contest, LeaderboardEntry, Tournament } from "../types";

/**
 * Safely formats a contest's duration. Falls back through:
 * 1. `durationSeconds` (preferred)
 * 2. `durationMinutes`
 * 3. "—" if neither is available
 */
const getDurationLabel = (contest: Contest): string => {
  if (typeof contest.durationSeconds === "number") {
    return `${Math.floor(contest.durationSeconds / 60)} mins`;
  }
  if (typeof contest.durationMinutes === "number") {
    return `${contest.durationMinutes} mins`;
  }
  return "—";
};

export const Live = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>("");
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [contests, setContests] = useState<Contest[]>([]);
  const [selectedContestId, setSelectedContestId] = useState<string>("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [error, setError] = useState("");
  const [showTournamentDropdown, setShowTournamentDropdown] = useState(false);

  // Load all tournaments
  useEffect(() => {
    let isMounted = true;
    tournamentApi
      .list()
      .then(({ tournaments }) => {
        if (isMounted) {
          setTournaments(tournaments);
          // Select first tournament by default, or a previously selected one
          const savedId = localStorage.getItem("live-selected-tournament");
          const found = savedId ? tournaments.find((t) => t._id === savedId) : null;
          const selectedId = found?._id || (tournaments.length > 0 ? tournaments[0]._id : "");
          setSelectedTournamentId(selectedId);
          if (selectedId) {
            const t = tournaments.find((tour) => tour._id === selectedId);
            setSelectedTournament(t || null);
          }
        }
      })
      .catch((err: Error) => {
        if (isMounted) setError(err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Load contests when tournament changes
  useEffect(() => {
    if (!selectedTournamentId) {
      setContests([]);
      setSelectedContestId("");
      setLeaderboard([]);
      return;
    }

    let isMounted = true;
    setContests([]);
    setSelectedContestId("");
    setLeaderboard([]);

    // Save selected tournament to localStorage
    localStorage.setItem("live-selected-tournament", selectedTournamentId);

    contestApi
      .list(selectedTournamentId)
      .then(({ contests: items }) => {
        if (isMounted) {
          setContests(items);
          if (items.length > 0) {
            setSelectedContestId(items[0]._id);
          }
        }
      })
      .catch((err: Error) => {
        if (isMounted) setError(err.message);
      });
    return () => {
      isMounted = false;
    };
  }, [selectedTournamentId]);

  // Load leaderboard when contest changes
  useEffect(() => {
    if (!selectedTournamentId || !selectedContestId) {
      setLeaderboard([]);
      return;
    }

    let isMounted = true;
    setLeaderboardLoading(true);
    contestApi
      .leaderboard(selectedTournamentId, selectedContestId)
      .then(({ leaderboard: rows }) => {
        if (isMounted) setLeaderboard(rows);
      })
      .catch((err: Error) => {
        if (isMounted) setError(err.message);
      })
      .finally(() => {
        if (isMounted) setLeaderboardLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [selectedTournamentId, selectedContestId]);

  const handleTournamentSelect = (tournamentId: string) => {
    setShowTournamentDropdown(false);
    setSelectedTournamentId(tournamentId);
    const t = tournaments.find((tour) => tour._id === tournamentId);
    setSelectedTournament(t || null);
  };

  if (loading) return <LoadingState label="Loading live contest session..." />;
  if (error) return <ErrorState error={error} />;
  if (tournaments.length === 0) {
    return (
      <>
        <Navbar />
        <main
          style={{
            background: "linear-gradient(135deg, #0a0e1a 0%, #1a1f35 50%, #0a0e1a 100%)",
            minHeight: "100vh",
            color: "white",
            padding: "60px 40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ maxWidth: "600px", width: "100%" }}>
            <Card
              style={{
                padding: "48px",
                background: "rgba(20, 25, 45, 0.85)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(8px)",
                borderRadius: "24px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "rgba(255,215,0,0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px",
                }}
              >
                <Trophy size={40} color="rgba(255,215,0,0.3)" />
              </div>
              <h2 style={{ margin: "0 0 8px 0", fontSize: "24px", fontWeight: "700" }}>
                No Tournaments Available
              </h2>
              <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "8px" }}>
                There are no active tournaments to display.
              </p>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>
                Check back later for upcoming competitions.
              </p>
            </Card>
          </div>
        </main>
      </>
    );
  }

  const currentContest = contests.find((c) => c._id === selectedContestId);
  const isLive = currentContest?.status === "LIVE";
  const isFinished = currentContest?.status === "FINISHED";

  const getStatusColor = () => {
    if (isLive) return "#FF6B6B";
    if (isFinished) return "#22C55E";
    return "#FFD700";
  };

  const getStatusLabel = () => {
    if (isLive) return "🔴 LIVE";
    if (isFinished) return "✅ FINISHED";
    return "⏳ UPCOMING";
  };

  // Get top 3 performers
  const topPerformers = leaderboard.filter((entry) => entry.rank && entry.rank <= 3);

  return (
    <>
      <Navbar />
      <main
        style={{
          background: "linear-gradient(135deg, #0a0e1a 0%, #1a1f35 50%, #0a0e1a 100%)",
          minHeight: "100vh",
          color: "white",
          padding: "0 40px 60px",
        }}
      >
        {/* Header */}
        <header
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "40px 0 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "4px",
              }}
            >
              <Trophy size={20} color="#FFD700" />
              <small
                style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.4)",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                }}
              >
                Live Contest Arena
              </small>
            </div>
            <h1
              style={{
                fontSize: "clamp(28px, 3vw, 42px)",
                fontWeight: "700",
                margin: 0,
                background: "linear-gradient(135deg, #FFFFFF, #64B5F6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Live Competition
            </h1>
            <p
              style={{
                fontSize: "14px",
                color: "rgba(255,255,255,0.5)",
                marginTop: "4px",
              }}
            >
              {contests.length} contests · {leaderboard.length} participants
            </p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            {/* Tournament Selector */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowTournamentDropdown(!showTournamentDropdown)}
                style={{
                  padding: "8px 16px 8px 20px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "13px",
                  fontWeight: "500",
                  transition: "all 0.2s ease",
                  minWidth: "180px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                }}
              >
                <Sparkles size={14} color="#FFD700" />
                <span
                  style={{
                    flex: 1,
                    textAlign: "left",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {selectedTournament?.name || "Select Tournament"}
                </span>
                <ChevronDown
                  size={16}
                  style={{
                    transition: "transform 0.2s ease",
                    transform: showTournamentDropdown ? "rotate(180deg)" : "none",
                  }}
                />
              </button>

              {showTournamentDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    minWidth: "240px",
                    background: "rgba(20, 25, 45, 0.95)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "12px",
                    overflow: "hidden",
                    zIndex: 100,
                    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                    maxHeight: "300px",
                    overflowY: "auto",
                  }}
                >
                  {tournaments.map((t) => (
                    <button
                      key={t._id}
                      onClick={() => handleTournamentSelect(t._id)}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "none",
                        background:
                          t._id === selectedTournamentId ? "rgba(41,121,255,0.15)" : "transparent",
                        color: t._id === selectedTournamentId ? "white" : "rgba(255,255,255,0.7)",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s ease",
                        borderLeft:
                          t._id === selectedTournamentId
                            ? "3px solid #2979FF"
                            : "3px solid transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (t._id !== selectedTournamentId) {
                          e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (t._id !== selectedTournamentId) {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      <div style={{ fontSize: "14px", fontWeight: "600" }}>{t.name}</div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "rgba(255,255,255,0.3)",
                          marginTop: "2px",
                        }}
                      >
                        {t.status || "DRAFT"} · {t.maxParticipants || 0} participants
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "100px",
                background: `${getStatusColor()}22`,
                border: `1px solid ${getStatusColor()}44`,
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: getStatusColor(),
                  animation: isLive ? "pulse 1.5s ease-in-out infinite" : "none",
                }}
              />
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: getStatusColor(),
                }}
              >
                {getStatusLabel()}
              </span>
            </div>
            <Badge tone={selectedTournament?.status === "COMPLETED" ? "gold" : "blue"}>
              {selectedTournament?.status || "REGISTRATION"}
            </Badge>
          </div>
        </header>

        {contests.length > 0 ? (
          <>
            {/* Contest Tabs */}
            <div
              style={{
                maxWidth: "1400px",
                margin: "24px auto",
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                overflowX: "auto",
                padding: "4px 0",
              }}
            >
              {contests.map((c) => {
                const isActive = c._id === selectedContestId;
                const isLiveContest = c.status === "LIVE";
                return (
                  <button
                    key={c._id}
                    onClick={() => {
                      setSelectedContestId(c._id);
                      setLeaderboardLoading(true);
                    }}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "10px",
                      background: isActive ? "rgba(41,121,255,0.15)" : "rgba(255,255,255,0.03)",
                      border: isActive
                        ? "1px solid rgba(41,121,255,0.3)"
                        : "1px solid rgba(255,255,255,0.06)",
                      color: isActive ? "white" : "rgba(255,255,255,0.6)",
                      fontWeight: isActive ? "600" : "400",
                      fontSize: "13px",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {isLiveContest && (
                      <span
                        style={{
                          display: "inline-block",
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: "#FF6B6B",
                          animation: "pulse 1.5s ease-in-out infinite",
                        }}
                      />
                    )}
                    {c.codeforcesContestName || c.name || `Contest ${c.codeforcesContestId}`}
                    <Badge
                      tone={
                        c.status === "LIVE" ? "red" : c.status === "FINISHED" ? "green" : "muted"
                      }
                      style={{
                        fontSize: "9px",
                        padding: "2px 8px",
                      }}
                    >
                      {c.status || "PENDING"}
                    </Badge>
                  </button>
                );
              })}
            </div>

            {/* Contest Info Card */}
            {currentContest && (
              <Card
                style={{
                  maxWidth: "1400px",
                  margin: "0 auto 24px",
                  padding: "24px 28px",
                  background: "rgba(255,255,255,0.03)",
                  border: isLive
                    ? "1px solid rgba(255,107,107,0.2)"
                    : "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "16px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "8px",
                      }}
                    >
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          background: isLive ? "rgba(255,107,107,0.15)" : "rgba(255,255,255,0.05)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {isLive ? (
                          <Clock size={18} color="#FF6B6B" />
                        ) : (
                          <Calendar size={18} color="rgba(255,255,255,0.3)" />
                        )}
                      </div>
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          <small
                            style={{
                              fontSize: "11px",
                              color: "rgba(255,255,255,0.4)",
                              textTransform: "uppercase",
                              letterSpacing: "1px",
                            }}
                          >
                            {currentContest.stage || "GROUP_STAGE"}
                            {currentContest.group && ` · Group ${currentContest.group}`}
                          </small>
                          {currentContest.matchNumber && (
                            <Badge tone="muted" style={{ fontSize: "10px" }}>
                              Match {currentContest.matchNumber}
                            </Badge>
                          )}
                        </div>
                        <h2
                          style={{
                            fontSize: "24px",
                            fontWeight: "700",
                            margin: "4px 0",
                            color: "white",
                          }}
                        >
                          {currentContest.codeforcesContestName ||
                            currentContest.name ||
                            `CF #${currentContest.codeforcesContestId}`}
                        </h2>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "16px",
                        fontSize: "13px",
                        color: "rgba(255,255,255,0.5)",
                      }}
                    >
                      <span>⏱️ Duration: {getDurationLabel(currentContest)}</span>
                      <span>
                        📅{" "}
                        {currentContest.startTime
                          ? new Date(currentContest.startTime).toLocaleString()
                          : "TBD"}
                      </span>
                      {currentContest.codeforcesContestId && (
                        <span>🏷️ CF #{currentContest.codeforcesContestId}</span>
                      )}
                    </div>
                  </div>
                  {currentContest.codeforcesUrl && (
                    <a
                      href={currentContest.codeforcesUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "10px 20px",
                        borderRadius: "10px",
                        background: "linear-gradient(135deg, #2979FF, #1565C0)",
                        color: "white",
                        textDecoration: "none",
                        fontWeight: "600",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        transition: "all 0.3s ease",
                      }}
                    >
                      Open Codeforces <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              </Card>
            )}

            {/* Top Performers */}
            {!leaderboardLoading && topPerformers.length > 0 && (
              <div
                style={{
                  maxWidth: "1400px",
                  margin: "0 auto 24px",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "12px",
                }}
              >
                {topPerformers.map((entry) => {
                  const medals = ["🥇", "🥈", "🥉"];
                  const colors = ["#FFD700", "#C0C0C0", "#CD7F32"];
                  const idx = (entry.rank || 1) - 1;
                  return (
                    <div
                      key={entry.participantId}
                      style={{
                        padding: "16px 20px",
                        background: "rgba(255,215,0,0.03)",
                        borderRadius: "12px",
                        border: `1px solid ${colors[idx] || "rgba(255,255,255,0.06)"}44`,
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "28px",
                        }}
                      >
                        {medals[idx] || `#${entry.rank}`}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: "15px",
                            fontWeight: "600",
                            color: "white",
                          }}
                        >
                          {entry.username || entry.name}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "rgba(255,255,255,0.4)",
                          }}
                        >
                          {entry.score} pts · {entry.solved} solved
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Leaderboard */}
            <Card
              style={{
                maxWidth: "1400px",
                margin: "0 auto",
                padding: "0",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "16px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "16px 24px",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <TrendingUp size={18} color="rgba(255,255,255,0.4)" />
                  <small
                    style={{
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.4)",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    Leaderboard ({leaderboard.length} participants)
                  </small>
                </div>
                {leaderboardLoading && (
                  <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} />
                )}
              </div>

              {leaderboardLoading ? (
                <div style={{ padding: "40px" }}>
                  <LoadingState label="Refreshing standings..." />
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "14px",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.06)",
                          background: "rgba(255,255,255,0.02)",
                        }}
                      >
                        <th style={thStyle}>Rank</th>
                        <th style={thStyle}>Participant</th>
                        <th style={thStyle}>Handle</th>
                        <th style={thStyle}>Group</th>
                        <th style={thStyle}>Solved</th>
                        <th style={thStyle}>Score</th>
                        <th style={thStyle}>Penalty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.length ? (
                        leaderboard.map((entry, index) => {
                          const isTop3 = entry.rank && entry.rank <= 3;
                          const medalEmoji =
                            entry.rank === 1
                              ? "🥇"
                              : entry.rank === 2
                                ? "🥈"
                                : entry.rank === 3
                                  ? "🥉"
                                  : null;
                          return (
                            <tr
                              key={entry.participantId}
                              style={{
                                borderBottom: "1px solid rgba(255,255,255,0.03)",
                                transition: "background 0.2s ease",
                                background: isTop3 ? "rgba(255,215,0,0.03)" : "transparent",
                                animation: `fadeIn 0.3s ease ${index * 0.03}s both`,
                              }}
                            >
                              <td
                                style={{
                                  ...tdStyle,
                                  fontWeight: "700",
                                  color: isTop3 ? "#FFD700" : "rgba(255,255,255,0.6)",
                                  fontSize: isTop3 ? "16px" : "14px",
                                }}
                              >
                                {medalEmoji || `#${entry.rank}`}
                              </td>
                              <td
                                style={{
                                  ...tdStyle,
                                  fontWeight: isTop3 ? "600" : "400",
                                  color: isTop3 ? "#FFD700" : "white",
                                }}
                              >
                                {entry.username || entry.name}
                              </td>
                              <td
                                style={{
                                  ...tdStyle,
                                  color: "rgba(255,255,255,0.5)",
                                  fontSize: "13px",
                                }}
                              >
                                {entry.codeforcesUsername || "—"}
                              </td>
                              <td
                                style={{
                                  ...tdStyle,
                                  color: "rgba(255,255,255,0.5)",
                                }}
                              >
                                {entry.group || "—"}
                              </td>
                              <td
                                style={{
                                  ...tdStyle,
                                  fontWeight: "600",
                                  color: "#22C55E",
                                }}
                              >
                                {entry.solved}
                              </td>
                              <td
                                style={{
                                  ...tdStyle,
                                  fontWeight: "700",
                                  color: isTop3 ? "#FFD700" : "#64B5F6",
                                  fontSize: isTop3 ? "18px" : "16px",
                                }}
                              >
                                {entry.score}
                              </td>
                              <td
                                style={{
                                  ...tdStyle,
                                  color: "rgba(255,255,255,0.4)",
                                }}
                              >
                                {entry.penalty || 0}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7}>
                            <div style={{ padding: "40px" }}>
                              <EmptyState label="No leaderboard entries recorded for this contest." />
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        ) : (
          <div
            style={{
              maxWidth: "1400px",
              margin: "40px auto",
              padding: "60px 40px",
              background: "rgba(255,255,255,0.03)",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.06)",
              textAlign: "center",
            }}
          >
            <Trophy size={48} color="rgba(255,255,255,0.1)" style={{ marginBottom: "16px" }} />
            <EmptyState label="No live or upcoming contests attached to this tournament yet." />
            <p
              style={{
                fontSize: "14px",
                color: "rgba(255,255,255,0.3)",
                marginTop: "8px",
              }}
            >
              Check back later for upcoming competitions
            </p>
          </div>
        )}

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.3; transform: scale(0.8); }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </main>
    </>
  );
};

const thStyle: React.CSSProperties = {
  padding: "12px 16px",
  textAlign: "left",
  color: "rgba(255,255,255,0.3)",
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  fontWeight: "500",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 16px",
  color: "rgba(255,255,255,0.8)",
  verticalAlign: "middle",
};

export default Live;
