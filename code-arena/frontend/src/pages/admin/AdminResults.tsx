import { useEffect, useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { contestApi } from "../../services/contestApi";
import { tournamentApi } from "../../services/tournamentApi";
import type { Contest, Result, Tournament } from "../../types";
import {
  RefreshCw,
  Users,
  Code2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  TrendingUp,
  Trophy,
} from "lucide-react";

export const AdminResults = () => {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [contests, setContests] = useState<Contest[]>([]);
  const [selectedContestId, setSelectedContestId] = useState<string>("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    tournamentApi
      .list()
      .then(({ tournaments }) => {
        const t = tournaments[0] || null;
        setTournament(t);
        if (t) {
          return contestApi.list(t._id);
        }
        return { contests: [] };
      })
      .then(({ contests: rows }) => {
        setContests(rows);
        if (rows.length > 0) {
          setSelectedContestId(rows[0]._id);
        }
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const loadResults = () => {
    if (!tournament || !selectedContestId) return;
    contestApi
      .results(tournament._id, selectedContestId)
      .then(({ results: rows }) => setResults(rows))
      .catch((err: Error) => setError(err.message));
  };

  useEffect(loadResults, [tournament, selectedContestId]);

  const handleSync = async () => {
    if (!tournament || !selectedContestId) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const res = await contestApi.sync(tournament._id, selectedContestId);
      const stats = res.stats || { matched: 0, unmatched: 0 };
      setNotice(
        `Synchronized ${stats.matched || 0} results. Unmatched handles: ${stats.unmatched || 0}.`,
      );
      loadResults();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingState label="Loading contest results management..." />;
  if (error) return <ErrorState error={error} />;
  if (!tournament) return <EmptyState label="No active tournament found." />;

  const currentContest = contests.find((c) => c._id === selectedContestId);
  const totalScore = results.reduce((sum, r) => sum + (r.score || 0), 0);
  const avgScore = results.length > 0 ? Math.round(totalScore / results.length) : 0;

  return (
    <div style={{ padding: "24px 0" }}>
      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "32px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
            <div
              style={{
                padding: "4px 12px",
                borderRadius: "20px",
                background: "rgba(255,215,0,0.1)",
                border: "1px solid rgba(255,215,0,0.15)",
                fontSize: "10px",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: "var(--gold)",
              }}
            >
              <Sparkles size={12} style={{ marginRight: "4px", display: "inline" }} />
              Results
            </div>
            <span
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "2px",
              }}
            >
              Score Synchronization
            </span>
          </div>
          <h1
            className="gradient-text"
            style={{
              fontSize: "clamp(28px, 3vw, 38px)",
              fontWeight: "800",
              margin: "4px 0 0 0",
              letterSpacing: "-0.5px",
            }}
          >
            Contest Results
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "var(--text-muted)",
              marginTop: "4px",
            }}
          >
            {results.length} participants · Avg score {avgScore}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              padding: "6px 16px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "600",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "var(--text-primary)",
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
                background: "var(--green)",
              }}
            />
            {tournament.status || "ACTIVE"}
          </div>

          {currentContest && (
            <button
              disabled={busy}
              onClick={handleSync}
              className="glow-blue"
              style={{
                padding: "10px 20px",
                borderRadius: "12px",
                background: busy ? "rgba(255,255,255,0.05)" : "var(--gradient-brand)",
                border: "none",
                color: busy ? "var(--text-muted)" : "white",
                fontWeight: "700",
                fontSize: "13px",
                cursor: busy ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.3s ease",
                opacity: busy ? 0.5 : 1,
              }}
            >
              {busy ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  Sync Codeforces
                </>
              )}
            </button>
          )}
        </div>
      </header>

      {/* Alerts */}
      {error && (
        <div
          className="glass-card"
          style={{
            padding: "14px 20px",
            color: "var(--red)",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "14px",
            borderColor: "rgba(239,68,68,0.2)",
          }}
        >
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {notice && (
        <div
          className="glass-card"
          style={{
            padding: "14px 20px",
            color: "var(--green)",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "14px",
            borderColor: "rgba(34,197,94,0.2)",
          }}
        >
          <CheckCircle size={20} />
          {notice}
        </div>
      )}

      {contests.length > 0 ? (
        <>
          {/* Stats Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
              marginBottom: "24px",
            }}
          >
            {[
              { label: "Total Results", value: results.length, icon: Users, color: "var(--blue)" },
              { label: "Average Score", value: avgScore, icon: TrendingUp, color: "var(--purple)" },
              { label: "Contests", value: contests.length, icon: Trophy, color: "var(--gold)" },
              {
                label: "Sync Status",
                value: results.length > 0 ? "Synced" : "Pending",
                icon: CheckCircle,
                color: results.length > 0 ? "var(--green)" : "var(--orange)",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="glass-card"
                style={{
                  padding: "14px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: `${stat.color}22`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <stat.icon size={18} color={stat.color} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {stat.label}
                  </div>
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: "700",
                      color: "white",
                    }}
                  >
                    {stat.value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Contest Tabs */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "20px",
              flexWrap: "wrap",
            }}
          >
            {contests.map((c) => (
              <button
                key={c._id}
                onClick={() => setSelectedContestId(c._id)}
                style={{
                  padding: "10px 20px",
                  borderRadius: "12px",
                  background:
                    c._id === selectedContestId
                      ? "rgba(41,121,255,0.15)"
                      : "rgba(255,255,255,0.03)",
                  border:
                    c._id === selectedContestId
                      ? "1px solid rgba(41,121,255,0.3)"
                      : "1px solid rgba(255,255,255,0.06)",
                  color: c._id === selectedContestId ? "var(--blue)" : "var(--text-secondary)",
                  fontSize: "13px",
                  fontWeight: c._id === selectedContestId ? "600" : "500",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  if (c._id !== selectedContestId) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (c._id !== selectedContestId) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  }
                }}
              >
                {c.name} (Round {c.round})
              </button>
            ))}
          </div>

          {/* Results Table */}
          <div
            className="glass-card"
            style={{
              padding: "0",
              overflow: "hidden",
              borderRadius: "16px",
            }}
          >
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
                    {[
                      "Rank",
                      "Participant",
                      "CF Username",
                      "Solved",
                      "Score",
                      "Penalty",
                      "Status",
                    ].map((col) => (
                      <th
                        key={col}
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          color: "var(--text-muted)",
                          fontSize: "11px",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          fontWeight: "500",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.length ? (
                    results.map((res) => {
                      const isTop3 = res.rank && res.rank <= 3;
                      return (
                        <tr
                          key={res._id}
                          style={{
                            borderBottom: "1px solid rgba(255,255,255,0.03)",
                            background: isTop3 ? "rgba(255,215,0,0.03)" : "transparent",
                            transition: "background 0.2s ease",
                          }}
                        >
                          <td
                            style={{
                              padding: "12px 16px",
                              color: isTop3 ? "var(--gold)" : "var(--text-secondary)",
                              fontWeight: isTop3 ? "700" : "400",
                            }}
                          >
                            {res.rank ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                {res.rank === 1
                                  ? "🥇"
                                  : res.rank === 2
                                    ? "🥈"
                                    : res.rank === 3
                                      ? "🥉"
                                      : `#${res.rank}`}
                              </div>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              color: "var(--text-primary)",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div
                                style={{
                                  width: "32px",
                                  height: "32px",
                                  borderRadius: "50%",
                                  background: isTop3
                                    ? "rgba(255,215,0,0.1)"
                                    : "rgba(255,255,255,0.05)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "12px",
                                  fontWeight: "700",
                                  color: isTop3 ? "var(--gold)" : "var(--text-secondary)",
                                }}
                              >
                                {res.participant?.user?.name?.charAt(0).toUpperCase() || "U"}
                              </div>
                              <div>
                                <div
                                  style={{
                                    fontWeight: isTop3 ? "600" : "400",
                                    color: isTop3 ? "var(--gold)" : "var(--text-primary)",
                                  }}
                                >
                                  {res.participant?.user?.name ||
                                    res.participant?.user?.username ||
                                    "—"}
                                </div>
                                <div
                                  style={{
                                    fontSize: "12px",
                                    color: "var(--text-muted)",
                                  }}
                                >
                                  @{res.participant?.user?.username || "unknown"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              color: "var(--text-secondary)",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <Code2 size={14} color="var(--text-muted)" />
                              {res.participant?.user?.codeforcesUsername || "—"}
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              color: "var(--text-secondary)",
                              textAlign: "center",
                            }}
                          >
                            {res.solved}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              color: isTop3 ? "var(--gold)" : "var(--blue)",
                              fontWeight: isTop3 ? "700" : "600",
                            }}
                          >
                            {res.score}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {res.penalty}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                            }}
                          >
                            <Badge tone="green">
                              <CheckCircle size={12} style={{ marginRight: "4px" }} />
                              SYNCED
                            </Badge>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7}>
                        <div style={{ padding: "40px" }}>
                          <EmptyState label="No results synced for this contest yet. Click 'Sync Codeforces Standings' above." />
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <EmptyState label="No attached contests to display results for." />
      )}
    </div>
  );
};

export default AdminResults;
