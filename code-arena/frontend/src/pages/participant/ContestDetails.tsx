// frontend/src/pages/public/ContestDetails.tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ExternalLink,
  ArrowLeft,
  Trophy,
  Clock,
  Users,
  Calendar,
  Code2,
  Medal,
  Timer,
} from "lucide-react";
import { Navbar } from "../../components/layout";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { contestApi } from "../../services/contestApi";
import { tournamentApi } from "../../services/tournamentApi";
import type { Contest, LeaderboardEntry } from "../../types";

export const ContestDetails = () => {
  const { contestId } = useParams<{ contestId: string }>();

  const [contest, setContest] = useState<Contest | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!contestId) {
      setError("Contest ID is missing");
      setLoading(false);
      return;
    }

    const fetchContest = async () => {
      try {
        setLoading(true);
        setError("");

        const tournamentResponse = await tournamentApi.list();
        const tournaments = tournamentResponse.tournaments || [];

        if (!tournaments.length) {
          throw new Error("No tournaments found");
        }

        let foundTournamentId: string | null = null;
        let foundContest: Contest | null = null;

        for (const tournament of tournaments) {
          try {
            const response = await contestApi.get(tournament._id, contestId);

            if (response?.contest) {
              foundTournamentId = tournament._id;
              foundContest = response.contest;
              break;
            }
          } catch {
            continue;
          }
        }

        if (!foundTournamentId || !foundContest) {
          throw new Error("Contest not found");
        }

        const leaderboardResponse = await contestApi.leaderboard(foundTournamentId, contestId);

        setContest(foundContest);
        setLeaderboard(leaderboardResponse?.leaderboard || []);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load contest details";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchContest();
  }, [contestId]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="page-container">
          <LoadingState variant="spinner" size="lg" label="Loading contest details..." />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="page-container">
          <ErrorState error={error} />
        </div>
      </>
    );
  }

  if (!contest) {
    return (
      <>
        <Navbar />
        <div className="page-container">
          <EmptyState label="Contest not found." />
        </div>
      </>
    );
  }

  const contestName = contest.name || contest.codeforcesContestName || "Unnamed Contest";
  const contestStage = contest.stage || "—";
  const contestGroup = contest.group || "";
  const durationMinutes =
    contest.durationMinutes ?? Math.floor((contest.durationSeconds || 0) / 60);
  const startTime = contest.startTime ? new Date(contest.startTime) : null;

  const statusTone =
    contest.status === "LIVE" ? "red" : contest.status === "FINISHED" ? "green" : "blue";

  return (
    <>
      <Navbar />

      <main className="page-container">
        {/* Back link */}
        <Link to="/live" className="back-link">
          <ArrowLeft size={16} />
          <span>Back to Live Contests</span>
        </Link>

        {/* Header */}
        <header className="contest-header">
          <div className="contest-header-glow" />

          <div className="contest-header-content">
            <div className="contest-breadcrumb">
              <span className="contest-stage-badge">
                <Code2 size={12} />
                {contestStage}
              </span>
              {contestGroup && (
                <span className="contest-group-badge">
                  <Users size={12} />
                  Group {contestGroup}
                </span>
              )}
            </div>

            <h1>{contestName}</h1>

            <div className="contest-meta">
              <div className="meta-item">
                <Clock size={16} />
                <span>{startTime ? startTime.toLocaleString() : "TBD"}</span>
              </div>
              <div className="meta-divider" />
              <div className="meta-item">
                <Timer size={16} />
                <span>{durationMinutes} minutes</span>
              </div>
              <div className="meta-divider" />
              <div className="meta-item">
                <Trophy size={16} />
                <span>{leaderboard.length} participants</span>
              </div>
            </div>
          </div>

          <div className="contest-header-badge">
            <Badge tone={statusTone} size="md">
              <span className={`status-indicator ${contest.status?.toLowerCase()}`} />
              {contest.status}
            </Badge>
          </div>
        </header>

        {/* Info Card */}
        <div className="info-card">
          <div className="info-card-glow" />
          <div className="info-card-content">
            <div className="info-item">
              <div className="info-icon">
                <Code2 size={18} />
              </div>
              <div className="info-text">
                <div className="info-label">Codeforces Contest ID</div>
                <div className="info-value">{contest.codeforcesContestId}</div>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon">
                <Calendar size={18} />
              </div>
              <div className="info-text">
                <div className="info-label">Start Time</div>
                <div className="info-value">{startTime ? startTime.toLocaleString() : "TBD"}</div>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon">
                <Timer size={18} />
              </div>
              <div className="info-text">
                <div className="info-label">Duration</div>
                <div className="info-value">{durationMinutes} minutes</div>
              </div>
            </div>

            {contest.codeforcesUrl && (
              <a
                href={contest.codeforcesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="info-action"
              >
                <ExternalLink size={16} />
                <span>View on Codeforces</span>
              </a>
            )}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="leaderboard-card">
          <div className="leaderboard-header">
            <div className="leaderboard-title">
              <div className="leaderboard-icon">
                <Trophy size={20} />
              </div>
              <div>
                <h2>Leaderboard</h2>
                <p className="leaderboard-subtitle">{leaderboard.length} ranked participants</p>
              </div>
            </div>
          </div>

          {leaderboard.length > 0 ? (
            <div className="leaderboard-table-wrap">
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Participant</th>
                    <th>Handle</th>
                    <th>Solved</th>
                    <th>Score</th>
                    <th>Penalty</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, index) => {
                    const rank = entry.rank || index + 1;
                    const isTop3 = rank <= 3;
                    const medalColor =
                      rank === 1
                        ? "#FFD700"
                        : rank === 2
                          ? "#C0C0C0"
                          : rank === 3
                            ? "#CD7F32"
                            : null;

                    return (
                      <tr key={entry.participantId || entry.codeforcesUsername || index}>
                        <td>
                          <div
                            className={`rank-cell ${isTop3 ? "top-rank" : ""}`}
                            style={
                              medalColor
                                ? ({ "--medal-color": medalColor } as React.CSSProperties)
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
                            <strong>{entry.username || "Unknown"}</strong>
                          </div>
                        </td>
                        <td>
                          <span className="handle-cell">{entry.codeforcesUsername || "—"}</span>
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-leaderboard">
              <EmptyState label="No results recorded for this contest." />
            </div>
          )}
        </div>
      </main>

      <style>{`
        .page-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 24px 80px;
          position: relative;
          z-index: 1;
        }

        /* Back link */
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          margin-bottom: 24px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.6);
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .back-link:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.12);
          color: white;
          transform: translateX(-4px);
        }

        /* Header */
        .contest-header {
          position: relative;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          padding: 36px 40px;
          border-radius: 24px;
          background: linear-gradient(135deg, rgba(41, 121, 255, 0.06), rgba(56, 189, 248, 0.06));
          border: 1px solid rgba(255, 255, 255, 0.06);
          margin-bottom: 24px;
          overflow: hidden;
        }

        .contest-header-glow {
          position: absolute;
          top: -50%;
          right: -10%;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(41, 121, 255, 0.15), transparent 70%);
          filter: blur(60px);
          pointer-events: none;
        }

        .contest-header-content {
          position: relative;
          z-index: 1;
          flex: 1;
          min-width: 0;
        }

        .contest-breadcrumb {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
        }

        .contest-stage-badge,
        .contest-group-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        .contest-stage-badge {
          background: rgba(41, 121, 255, 0.12);
          color: #64B5F6;
          border: 1px solid rgba(41, 121, 255, 0.2);
        }

        .contest-group-badge {
          background: rgba(56, 189, 248, 0.12);
          color: #7DD3FC;
          border: 1px solid rgba(56, 189, 248, 0.2);
        }

        .contest-header h1 {
          font-size: clamp(28px, 4vw, 42px);
          font-weight: 800;
          margin: 0 0 20px;
          line-height: 1.15;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, #FFFFFF, #90CAF9);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .contest-meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 20px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.55);
          font-weight: 500;
        }

        .meta-item svg {
          color: #64B5F6;
          opacity: 0.8;
        }

        .meta-divider {
          width: 1px;
          height: 16px;
          background: rgba(255, 255, 255, 0.08);
        }

        .contest-header-badge {
          position: relative;
          z-index: 1;
          flex-shrink: 0;
        }

        .status-indicator {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 8px;
          vertical-align: middle;
        }

        .status-indicator.live {
          background: #FF6B6B;
          box-shadow: 0 0 12px rgba(255, 107, 107, 0.6);
          animation: pulse 1.5s infinite;
        }

        .status-indicator.finished {
          background: #22C55E;
        }

        .status-indicator.upcoming {
          background: #64B5F6;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }

        /* Info Card */
        .info-card {
          position: relative;
          padding: 24px 28px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          margin-bottom: 24px;
          overflow: hidden;
        }

        .info-card-glow {
          position: absolute;
          top: -50%;
          left: -10%;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(56, 189, 248, 0.1), transparent 70%);
          filter: blur(60px);
          pointer-events: none;
        }

        .info-card-content {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 24px;
          align-items: center;
          position: relative;
          z-index: 1;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .info-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(41, 121, 255, 0.08);
          border: 1px solid rgba(41, 121, 255, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64B5F6;
          flex-shrink: 0;
        }

        .info-text {
          min-width: 0;
        }

        .info-label {
          font-size: 11px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.35);
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 4px;
        }

        .info-value {
          font-size: 14px;
          font-weight: 700;
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .info-action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: 12px;
          background: linear-gradient(135deg, #2979FF, #1565C0);
          color: white;
          font-weight: 600;
          font-size: 14px;
          text-decoration: none;
          transition: all 0.3s ease;
          justify-self: end;
          white-space: nowrap;
        }

        .info-action:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(41, 121, 255, 0.4);
        }

        /* Leaderboard */
        .leaderboard-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 24px;
          overflow: hidden;
        }

        .leaderboard-header {
          padding: 24px 28px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(255, 255, 255, 0.01);
        }

        .leaderboard-title {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .leaderboard-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(255, 215, 0, 0.1);
          border: 1px solid rgba(255, 215, 0, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFD700;
          flex-shrink: 0;
        }

        .leaderboard-title h2 {
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 2px;
          color: white;
        }

        .leaderboard-subtitle {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.4);
          margin: 0;
        }

        .leaderboard-table-wrap {
          overflow-x: auto;
        }

        .leaderboard-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .leaderboard-table thead {
          background: rgba(255, 255, 255, 0.02);
        }

        .leaderboard-table th {
          padding: 16px 20px;
          text-align: left;
          font-size: 11px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 1px;
          white-space: nowrap;
        }

        .leaderboard-table td {
          padding: 16px 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.75);
        }

        .leaderboard-table tbody tr {
          transition: background 0.2s ease;
        }

        .leaderboard-table tbody tr:hover {
          background: rgba(41, 121, 255, 0.04);
        }

        .rank-cell {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.7);
        }

        .rank-cell.top-rank {
          color: var(--medal-color, #FFD700);
        }

        .rank-cell.top-rank svg {
          color: var(--medal-color, #FFD700);
          filter: drop-shadow(0 0 6px var(--medal-color, #FFD700));
        }

        .participant-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .participant-avatar {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #2979FF, #EAB308);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: 14px;
          flex-shrink: 0;
        }

        .participant-cell strong {
          color: white;
          font-weight: 700;
        }

        .handle-cell {
          font-family: "Fira Code", "JetBrains Mono", monospace;
          font-size: 13px;
          color: #64B5F6;
          padding: 3px 8px;
          background: rgba(41, 121, 255, 0.08);
          border-radius: 6px;
          border: 1px solid rgba(41, 121, 255, 0.12);
        }

        .solved-cell {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 32px;
          padding: 3px 10px;
          border-radius: 8px;
          background: rgba(76, 175, 80, 0.1);
          color: #22C55E;
          font-weight: 700;
          font-size: 13px;
        }

        .score-cell {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 48px;
          padding: 3px 12px;
          border-radius: 8px;
          background: rgba(56, 189, 248, 0.1);
          color: #7DD3FC;
          font-weight: 800;
          font-size: 13px;
        }

        .penalty-cell {
          color: rgba(255, 255, 255, 0.45);
          font-weight: 600;
        }

        .empty-leaderboard {
          padding: 40px 20px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .page-container {
            padding: 20px 16px 60px;
          }

          .contest-header {
            flex-direction: column;
            padding: 28px 24px;
          }

          .contest-header-badge {
            align-self: flex-start;
          }

          .contest-meta {
            gap: 12px;
          }

          .meta-divider {
            display: none;
          }

          .info-card-content {
            grid-template-columns: 1fr;
          }

          .info-action {
            justify-self: stretch;
          }

          .leaderboard-table th,
          .leaderboard-table td {
            padding: 12px 14px;
          }
        }

        @media (max-width: 480px) {
          .contest-header h1 {
            font-size: 24px;
          }

          .handle-cell {
            font-size: 11px;
          }
        }
      `}</style>
    </>
  );
};

export default ContestDetails;
