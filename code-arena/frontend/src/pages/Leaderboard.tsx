import { useEffect, useState, useMemo } from "react";
import { Navbar } from "../components/layout/Navbar";
import { Card } from "../components/ui/Card";
import { LoadingState } from "../components/ui/LoadingState";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { tournamentApi } from "../services/tournamentApi";
import type { LeaderboardEntry } from "../types";

export const Leaderboard = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("ALL");

  useEffect(() => {
    tournamentApi
      .list()
      .then(({ tournaments }) => {
        const t = tournaments[0];
        if (t) {
          return tournamentApi.leaderboard(t._id);
        }
        return null;
      })
      .then((result) => {
        if (result) {
          setEntries(result.leaderboard);
        }
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return entries
      .filter((entry) => {
        const matchesGroup = group === "ALL" || entry.group === group;
        const matchesSearch =
          entry.username.toLowerCase().includes(query.toLowerCase()) ||
          (entry.codeforcesUsername &&
            entry.codeforcesUsername.toLowerCase().includes(query.toLowerCase()));
        return matchesGroup && matchesSearch;
      })
      .sort((a, b) => a.rank - b.rank);
  }, [entries, group, query]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  // ---- Rank badge helpers ----
  const getRankStyle = (rank: number) => {
    if (rank === 1)
      return { color: "#FFD700", fontWeight: "700", textShadow: "0 0 20px rgba(255,215,0,0.3)" };
    if (rank === 2) return { color: "#C0C0C0", fontWeight: "600" };
    if (rank === 3) return { color: "#CD7F32", fontWeight: "600" };
    return { color: "rgba(255,255,255,0.7)" };
  };

  // ---- Render ----
  return (
    <>
      <Navbar />
      <main
        style={{
          background: "linear-gradient(145deg, #0a0e1a 0%, #12172f 50%, #0a0e1a 100%)",
          minHeight: "100vh",
          color: "white",
          padding: "40px 20px",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {/* Header */}
          <header
            style={{
              marginBottom: "36px",
              borderBottom: "2px solid rgba(41, 121, 255, 0.2)",
              paddingBottom: "24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div>
              <small
                style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.4)",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                }}
              >
                CHAMPIONSHIP STANDINGS
              </small>
              <h1
                style={{
                  fontSize: "clamp(32px, 4vw, 48px)",
                  fontWeight: "800",
                  margin: "4px 0 0",
                  background: "linear-gradient(135deg, #FFFFFF, #64B5F6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "-0.02em",
                }}
              >
                Leaderboard
              </h1>
            </div>

            {/* Filters */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search competitor..."
                style={{
                  padding: "10px 16px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.04)",
                  color: "white",
                  fontSize: "14px",
                  width: "200px",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(41,121,255,0.5)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
              />
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                style={{
                  padding: "10px 16px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.04)",
                  color: "white",
                  fontSize: "14px",
                  cursor: "pointer",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(41,121,255,0.5)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
              >
                <option value="ALL" style={{ background: "#1a1f35" }}>
                  Overall
                </option>
                <option value="A" style={{ background: "#1a1f35" }}>
                  Group A
                </option>
                <option value="B" style={{ background: "#1a1f35" }}>
                  Group B
                </option>
                <option value="C" style={{ background: "#1a1f35" }}>
                  Group C
                </option>
                <option value="D" style={{ background: "#1a1f35" }}>
                  Group D
                </option>
                <option value="PLAYOFFS" style={{ background: "#1a1f35" }}>
                  Playoffs
                </option>
              </select>
            </div>
          </header>

          {/* Leaderboard Table */}
          <Card
            style={{
              padding: 0,
              overflow: "hidden",
              borderRadius: "20px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                overflowX: "auto",
                padding: "0",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "14px",
                }}
              >
                <thead
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <tr>
                    {[
                      "Rank",
                      "Participant",
                      "Group",
                      "Group Rank",
                      "Score",
                      "Solved",
                      "Win Rate",
                    ].map((header) => (
                      <th
                        key={header}
                        style={{
                          padding: "16px 20px",
                          textAlign: "left",
                          fontSize: "11px",
                          fontWeight: "600",
                          color: "rgba(255,255,255,0.4)",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length ? (
                    filtered.map((entry) => (
                      <tr
                        key={entry.participantId}
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.03)",
                          transition: "background 0.15s",
                          cursor: "default",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "rgba(255,255,255,0.04)")
                        }
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "14px 20px" }}>
                          <span style={getRankStyle(entry.rank)}>#{entry.rank}</span>
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <div>
                            <strong style={{ color: "white" }}>{entry.username}</strong>
                            <small
                              style={{
                                display: "block",
                                fontSize: "12px",
                                color: "rgba(255,255,255,0.4)",
                              }}
                            >
                              {entry.codeforcesUsername}
                            </small>
                          </div>
                        </td>
                        <td style={{ padding: "14px 20px", color: "rgba(255,255,255,0.7)" }}>
                          {entry.group || "—"}
                        </td>
                        <td style={{ padding: "14px 20px", color: "rgba(255,255,255,0.7)" }}>
                          #{entry.rank}
                        </td>
                        <td
                          style={{
                            padding: "14px 20px",
                            fontWeight: "700",
                            color: "#38BDF8",
                          }}
                        >
                          {entry.score}
                        </td>
                        <td style={{ padding: "14px 20px", color: "#22C55E" }}>{entry.solved}</td>
                        <td style={{ padding: "14px 20px", color: "rgba(255,255,255,0.4)" }}>—</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} style={{ padding: "40px 20px", textAlign: "center" }}>
                        <EmptyState label="No participants found." />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </main>
    </>
  );
};

export default Leaderboard;
