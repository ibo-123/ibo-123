// frontend/src/pages/participant/Standings.tsx
import { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  Trophy,
  Medal,
  Users,
  TrendingUp,
  Target,
  Award,
  ListOrdered,
  Crown,
  ShieldX,
  Star,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { tournamentApi } from "../../services/tournamentApi";
import { LoadingState, ErrorState, StatusBadge } from "../../components/common";
import type { StandingsEntry } from "../../types";
import "./Standings.css";

// ---- Design helpers ---------------------------------------------------

const normalizeStatus = (s?: string): string => {
  if (!s) return "ACTIVE";
  return String(s).toUpperCase();
};

const isAdvanced = (s?: string) => {
  const u = normalizeStatus(s);
  return u === "ADVANCED" || u === "CHAMPION";
};

const isEliminated = (s?: string) => normalizeStatus(s) === "ELIMINATED";

const isChampion = (s?: string) => normalizeStatus(s) === "CHAMPION";

const getMedalColor = (rank: number): string | null => {
  if (rank === 1) return "#FFD700";
  if (rank === 2) return "#C0C0C0";
  if (rank === 3) return "#CD7F32";
  return null;
};

const isActiveTournament = (status?: string): boolean => {
  const s = String(status || "").toUpperCase();
  return s !== "COMPLETED" && s !== "CANCELLED";
};

export const Standings = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [standings, setStandings] = useState<StandingsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resolvedTournamentId, setResolvedTournamentId] = useState<string | null>(null);
  const [resolvedTournamentName, setResolvedTournamentName] = useState<string | null>(null);
  const [myTournaments, setMyTournaments] = useState<
    Array<{ id: string; name: string; status: string }>
  >([]);

  // ---- 1. Resolve which tournament to show -------------------------
  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      // a. Explicit ?tournament=<id> in the query string wins
      const fromQuery = searchParams.get("tournament");
      if (fromQuery) {
        setResolvedTournamentId(fromQuery);
        return;
      }

      // b. :id in the URL path
      if (id) {
        setResolvedTournamentId(id);
        return;
      }

      // c. Fall back to the participant's own tournaments
      try {
        const res = await tournamentApi.getMyTournaments();
        if (cancelled) return;

        const rows = res.tournaments ?? [];

        const options = rows
          .filter((r) => r.tournament?._id)
          .map((r) => ({
            id: String(r.tournament._id),
            name: r.tournament.name,
            status: String(r.tournament.status || ""),
          }));

        setMyTournaments(options);

        // Prefer an active tournament; else the most recent completed one.
        const active = options.find((t) => isActiveTournament(t.status));
        const chosen = active || options[0];

        if (chosen) {
          setResolvedTournamentId(chosen.id);
          setResolvedTournamentName(chosen.name);
        } else {
          setResolvedTournamentId(null);
        }
      } catch {
        if (!cancelled) setResolvedTournamentId(null);
      }
    };

    resolve();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, searchParams]);

  // ---- 2. Load the leaderboard for the resolved tournament ---------
  useEffect(() => {
    if (!resolvedTournamentId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        // ✅ FIX: leaderboard() returns only { leaderboard } — no tournament.
        const { leaderboard } = await tournamentApi.leaderboard(resolvedTournamentId);
        if (cancelled) return;

        setStandings(
          (leaderboard ?? []).map((entry) => ({
            ...entry,
            status: (entry.status || "ACTIVE") as StandingsEntry["status"],
          })),
        );

        // If we didn't resolve a name earlier (e.g. via ?tournament= or :id),
        // fetch it separately so the header still shows it.
        if (!resolvedTournamentName) {
          try {
            const { tournament } = await tournamentApi.get(resolvedTournamentId);
            if (!cancelled && tournament?.name) {
              setResolvedTournamentName(tournament.name);
            }
          } catch {
            /* non-fatal — header just shows "Live Leaderboard" */
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedTournamentId]);

  // ---- 3. Allow switching between the user's tournaments -----------
  const handleSelectTournament = (tournamentId: string) => {
    // Update the query string; the resolver effect will pick it up
    const next = new URLSearchParams(searchParams);
    next.set("tournament", tournamentId);
    setSearchParams(next, { replace: true });
    // Reset the cached name so the loader re-fetches it for the new id
    setResolvedTournamentName(null);
  };

  const myUsername = user?.username;
  const myEntry = useMemo(
    () => standings.find((s) => s.username === myUsername),
    [standings, myUsername],
  );
  const topThree = standings.slice(0, 3);

  const stats = useMemo(() => {
    const total = standings.length;
    const advanced = standings.filter((s) => isAdvanced(s.status)).length;
    const eliminated = standings.filter((s) => isEliminated(s.status)).length;
    const champion = standings.find((s) => isChampion(s.status))?.username;
    return { total, advanced, eliminated, champion };
  }, [standings]);

  if (loading) {
    return <LoadingState variant="spinner" size="lg" label="Loading standings..." />;
  }
  if (error) return <ErrorState error={error} />;

  // No tournaments at all
  if (!resolvedTournamentId) {
    return (
      <div className="standings-page">
        <div className="page-header">
          <div className="page-header-glow" aria-hidden="true" />
          <div className="page-header-content">
            <div className="header-icon">
              <ListOrdered size={24} />
            </div>
            <div className="header-text">
              <div className="header-eyebrow">Live Leaderboard</div>
              <h1>Standings</h1>
            </div>
          </div>
        </div>

        <div className="empty-state">
          <div className="empty-icon" aria-hidden="true">
            <Trophy size={48} />
          </div>
          <h3>No tournaments yet</h3>
          <p>Standings will appear here once you join a tournament.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="standings-page">
      {/* ---- Header ---- */}
      <div className="page-header">
        <div className="page-header-glow" aria-hidden="true" />
        <div className="page-header-content">
          <div className="header-icon">
            <ListOrdered size={24} />
          </div>
          <div className="header-text">
            <div className="header-eyebrow">
              {resolvedTournamentName
                ? `Live Leaderboard · ${resolvedTournamentName}`
                : "Live Leaderboard"}
            </div>
            <h1>Standings</h1>
            <p className="subtitle">
              {stats.total} participants
              {stats.advanced > 0 && (
                <>
                  {" · "}
                  <span className="stat-advanced">{stats.advanced} advanced</span>
                </>
              )}
              {stats.eliminated > 0 && (
                <>
                  {" · "}
                  <span className="stat-eliminated">{stats.eliminated} eliminated</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Tournament switcher (only if user has more than one) */}
        {myTournaments.length > 1 && (
          <div className="tournament-switcher">
            {myTournaments.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`switcher-chip${t.id === resolvedTournamentId ? " active" : ""}`}
                onClick={() => handleSelectTournament(t.id)}
              >
                <span className="switcher-name">{t.name}</span>
                <span className="switcher-status">
                  {isActiveTournament(t.status) ? "Active" : "Completed"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {standings.length > 0 ? (
        <>
          {/* ---- Champion banner ---- */}
          {stats.champion && (
            <div className="champion-banner" role="status">
              <Crown size={22} className="champion-crown" />
              <div className="champion-text">
                <div className="champion-label">Champion</div>
                <div className="champion-name">{stats.champion}</div>
              </div>
            </div>
          )}

          {/* ---- Podium (top 3) ---- */}
          {topThree.length === 3 && (
            <div className="podium">
              {[1, 0, 2].map((idx) => {
                const entry = topThree[idx];
                const place = idx + 1;
                const medalColor = getMedalColor(place)!;
                const isMe = entry.username === myUsername;
                const entryAdvanced = isAdvanced(entry.status);
                const entryEliminated = isEliminated(entry.status);

                return (
                  <div
                    key={entry.participantId}
                    className={`podium-item place-${place}${
                      isMe ? " is-me" : ""
                    }${entryEliminated ? " is-eliminated" : ""}`}
                    style={{ "--medal": medalColor } as React.CSSProperties}
                  >
                    <div className="podium-rank-badge">
                      <Medal size={16} />
                      <span>#{entry.rank}</span>
                    </div>

                    <div className="podium-avatar">
                      {(entry.username || "?").charAt(0).toUpperCase()}
                      <div className="podium-medal" />
                    </div>

                    <div className="podium-name">
                      {entry.username}
                      {isMe && <span className="you-tag">You</span>}
                    </div>

                    {entryAdvanced && (
                      <span className="podium-status podium-status--advanced">Advanced</span>
                    )}
                    {entryEliminated && (
                      <span className="podium-status podium-status--eliminated">Eliminated</span>
                    )}

                    <div className="podium-stats">
                      <div className="podium-stat">
                        <span className="podium-stat-value">{entry.score ?? 0}</span>
                        <span className="podium-stat-label">pts</span>
                      </div>
                      <div className="podium-stat">
                        <span className="podium-stat-value">{entry.solved ?? 0}</span>
                        <span className="podium-stat-label">solved</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ---- My position banner ---- */}
          {myEntry && <MyPositionBanner entry={myEntry} total={stats.total} />}

          {/* ---- Full table ---- */}
          <div className="standings-table-card">
            <div className="table-header">
              <div className="table-title">
                <Users size={18} />
                <span>Full Leaderboard</span>
              </div>
              <div className="table-subtitle">Sorted by points → solved → penalty</div>
            </div>

            <div className="table-wrap">
              <table className="standings-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Participant</th>
                    <th>Group</th>
                    <th>Solved</th>
                    <th>Score</th>
                    <th>Penalty</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((entry) => {
                    const isMe = entry.username === myUsername;
                    const rank = entry.rank || 0;
                    const isTop3 = rank <= 3;
                    const medalColor = getMedalColor(rank);
                    const eliminated = isEliminated(entry.status);
                    const champion = isChampion(entry.status);

                    return (
                      <tr
                        key={entry.participantId}
                        className={[
                          isMe ? "current-user" : "",
                          eliminated ? "eliminated-row" : "",
                          champion ? "champion-row" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        <td>
                          <div
                            className={`rank-cell${isTop3 ? " top-rank" : ""}`}
                            style={
                              medalColor
                                ? ({
                                    "--medal-color": medalColor,
                                  } as React.CSSProperties)
                                : {}
                            }
                          >
                            {isTop3 && <Medal size={14} />}
                            <span>#{rank}</span>
                          </div>
                        </td>

                        <td>
                          <div className="participant-cell">
                            <div className="participant-avatar">
                              {(entry.username || "?").charAt(0).toUpperCase()}
                            </div>
                            <div className="participant-info">
                              <span className="participant-name">
                                <strong>{entry.username}</strong>
                                {champion && (
                                  <Crown size={12} className="inline-crown" aria-label="Champion" />
                                )}
                              </span>
                              {isMe && <span className="you-badge">You</span>}
                            </div>
                          </div>
                        </td>

                        <td>
                          {entry.group ? (
                            <span className="group-cell">{entry.group}</span>
                          ) : (
                            <span className="empty-cell">—</span>
                          )}
                        </td>

                        <td>
                          <span className="solved-cell">{entry.solved ?? 0}</span>
                        </td>

                        <td>
                          <span className="score-cell">{entry.score ?? 0}</span>
                        </td>

                        <td>
                          <span className="penalty-cell">{entry.penalty ?? 0}</span>
                        </td>

                        <td>
                          <StatusBadge status={entry.status} size="sm" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-icon" aria-hidden="true">
            <Trophy size={48} />
          </div>
          <h3>No standings yet</h3>
          <p>Standings will appear here once the tournament begins.</p>
        </div>
      )}
    </div>
  );
};

// ---- My position banner (with variant by status) ----------------------

interface MyPositionBannerProps {
  entry: StandingsEntry;
  total: number;
}

const MyPositionBanner = ({ entry, total }: MyPositionBannerProps) => {
  const advanced = isAdvanced(entry.status);
  const eliminated = isEliminated(entry.status);
  const champion = isChampion(entry.status);

  const tone = champion ? "champion" : advanced ? "advanced" : eliminated ? "eliminated" : "active";

  const icon = champion ? (
    <Crown size={20} />
  ) : eliminated ? (
    <ShieldX size={20} />
  ) : advanced ? (
    <Star size={20} />
  ) : (
    <Target size={20} />
  );

  const label = champion
    ? "Champion"
    : advanced
      ? "You Advanced"
      : eliminated
        ? "You Were Eliminated"
        : "Your Position";

  return (
    <div className={`my-position-banner my-position-banner--${tone}`}>
      <div className="my-position-glow" aria-hidden="true" />
      <div className="my-position-content">
        <div className="my-position-icon">{icon}</div>

        <div className="my-position-text">
          <div className="my-position-label">{label}</div>
          <div className="my-position-value">
            Rank #{entry.rank} of {total}
          </div>
        </div>

        <div className="my-position-stats">
          <div className="my-stat">
            <TrendingUp size={14} />
            <span>{entry.score ?? 0} pts</span>
          </div>
          <div className="my-stat">
            <Award size={14} />
            <span>{entry.solved ?? 0} solved</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Standings;
