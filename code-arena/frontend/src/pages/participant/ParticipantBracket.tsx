// frontend/src/pages/participant/ParticipantBracket.tsx
import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Swords,
  Trophy,
  Crown,
  Clock,
  CheckCircle2,
  XCircle,
  Target,
  Users,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { tournamentApi } from "../../services/tournamentApi";
import { LoadingState, ErrorState } from "../../components/common";
import type { Bracket, Match, Participant } from "../../types";
import "./ParticipantBracket.css";

// ============================================================
// Helpers
// ============================================================

type StageKey = "quarterFinal" | "semiFinal" | "final";

const STAGE_LABELS: Record<StageKey, string> = {
  quarterFinal: "Quarter Finals",
  semiFinal: "Semi Finals",
  final: "Final",
};

const getStatusIcon = (status?: string) => {
  const s = String(status || "").toUpperCase();
  if (s === "COMPLETED") return <CheckCircle2 size={12} />;
  if (s === "TIE") return <Swords size={12} />;
  return <Clock size={12} />;
};

const getStatusColor = (status?: string) => {
  const s = String(status || "").toUpperCase();
  if (s === "COMPLETED") return "#22C55E";
  if (s === "TIE") return "#F59E0B";
  return "#64B5F6";
};

// ============================================================
// Component
// ============================================================

export const ParticipantBracket = () => {
  const { id: tournamentId } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [bracket, setBracket] = useState<Bracket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [focusOnMe, setFocusOnMe] = useState(false);

  useEffect(() => {
    if (!tournamentId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const { bracket } = await tournamentApi.bracket(tournamentId);
        if (cancelled) return;
        setBracket(bracket);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load bracket");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [tournamentId]);

  const myUsername = user?.username;

  // Participant ID lookup — do we know which participant row is "me"?
  const myParticipantId = useMemo(() => {
    if (!bracket || !myUsername) return null;

    const check = (p: Participant | null | undefined) =>
      p?.user?.username === myUsername ? p._id : null;

    // Look in group stage
    for (const list of Object.values(bracket.groupStage || {})) {
      for (const p of list) {
        const found = check(p);
        if (found) return found;
      }
    }

    // Look in knockout matches
    const allMatches: Match[] = [
      ...(bracket.quarterFinal || []),
      ...(bracket.semiFinal || []),
      ...(bracket.final ? [bracket.final] : []),
    ];
    for (const m of allMatches) {
      for (const p of m.participants || []) {
        const found = check(p);
        if (found) return found;
      }
      if (bracket.champion?.user?.username === myUsername) {
        return bracket.champion._id;
      }
    }

    return null;
  }, [bracket, myUsername]);

  if (loading) {
    return <LoadingState variant="spinner" size="lg" label="Loading bracket..." />;
  }
  if (error) return <ErrorState error={error} />;
  if (!bracket) {
    return <ErrorState error="Bracket data unavailable" />;
  }

  // Type the array literal first so TypeScript checks each key
  // against StageKey — then filter.
  const roundsTyped: Array<{
    key: StageKey;
    label: string;
    matches: Match[];
  }> = [
    {
      key: "quarterFinal",
      label: STAGE_LABELS.quarterFinal,
      matches: bracket.quarterFinal || [],
    },
    {
      key: "semiFinal",
      label: STAGE_LABELS.semiFinal,
      matches: bracket.semiFinal || [],
    },
    {
      key: "final",
      label: STAGE_LABELS.final,
      matches: bracket.final ? [bracket.final] : [],
    },
  ];

  const allRounds = roundsTyped.filter((r) => r.matches.length > 0);

  const hasKnockout = allRounds.length > 0;

  return (
    <div className="participant-bracket">
      {/* ---- Toolbar ---- */}
      <div className="bracket-toolbar">
        <div className="bracket-toolbar-label">
          <Swords size={14} />
          <span>Knockout Bracket</span>
        </div>
        <button
          type="button"
          className={`focus-toggle${focusOnMe ? " active" : ""}`}
          onClick={() => setFocusOnMe((v) => !v)}
          disabled={!myParticipantId}
          title={myParticipantId ? "Highlight your matches" : "You are not in the bracket"}
        >
          {focusOnMe ? <Eye size={14} /> : <EyeOff size={14} />}
          <span>Focus on me</span>
        </button>
      </div>

      {!hasKnockout ? (
        <div className="bracket-empty">
          <div className="bracket-empty-icon">
            <Swords size={40} />
          </div>
          <h3>Knockout stage hasn't started yet</h3>
          <p>
            The bracket will appear here once the group stage is complete and qualifiers are seeded.
          </p>
        </div>
      ) : (
        <div className="bracket-rounds">
          {allRounds.map((round) => (
            <div key={round.key} className="bracket-round">
              <div className="bracket-round-header">
                <span className="round-label">{round.label}</span>
                <span className="round-count">
                  {round.matches.length} {round.matches.length === 1 ? "match" : "matches"}
                </span>
              </div>

              <div className="bracket-round-body">
                {round.matches.map((match) => (
                  <MatchCard
                    key={match.matchNumber}
                    match={match}
                    stage={round.key}
                    myParticipantId={focusOnMe ? myParticipantId : null}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Champion card */}
          {bracket.champion && (
            <div className="bracket-round bracket-round--champion">
              <div className="bracket-round-header">
                <span className="round-label">Champion</span>
              </div>
              <div className="bracket-round-body">
                <div className="champion-card">
                  <div className="champion-crown-wrap">
                    <Crown size={28} />
                  </div>
                  <div className="champion-avatar">
                    {(bracket.champion.user?.username || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="champion-info">
                    <div className="champion-name">{bracket.champion.user?.username}</div>
                    <div className="champion-meta">
                      Group {bracket.champion.group} · #{bracket.champion.seed}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================
// MatchCard
// ============================================================

interface MatchCardProps {
  match: Match;
  stage: StageKey;
  myParticipantId: string | null;
}

const MatchCard = ({ match, stage, myParticipantId }: MatchCardProps) => {
  const [a, b] = match.participants || [];
  const winnerId = match.winner?._id;
  const statusColor = getStatusColor(match.status);

  const isMine =
    myParticipantId && match.participants?.some((p) => String(p._id) === String(myParticipantId));

  return (
    <div className={`match-card${isMine ? " is-mine" : ""}`}>
      <div className="match-card-header">
        <span className="match-number">Match #{match.matchNumber}</span>
        <span
          className="match-status"
          style={{
            color: statusColor,
            borderColor: `${statusColor}40`,
            background: `${statusColor}15`,
          }}
        >
          {getStatusIcon(match.status)}
          {match.status || "PENDING"}
        </span>
      </div>

      <PlayerRow
        participant={a}
        isWinner={!!winnerId && String(a?._id) === String(winnerId)}
        isMe={!!myParticipantId && String(a?._id) === String(myParticipantId)}
      />

      <div className="match-vs">vs</div>

      <PlayerRow
        participant={b}
        isWinner={!!winnerId && String(b?._id) === String(winnerId)}
        isMe={!!myParticipantId && String(b?._id) === String(myParticipantId)}
      />

      {match.contest && (
        <Link
          to={`/dashboard/tournaments/${match.contest._id}/contests`}
          className="match-contest-link"
          title={match.contest.name}
        >
          <ExternalLink size={11} />
          <span>{match.contest.name || "View contest"}</span>
        </Link>
      )}
    </div>
  );
};

// ============================================================
// PlayerRow
// ============================================================

interface PlayerRowProps {
  participant?: Participant;
  isWinner: boolean;
  isMe: boolean;
}

const PlayerRow = ({ participant, isWinner, isMe }: PlayerRowProps) => {
  if (!participant) {
    return (
      <div className="player-row player-row--empty">
        <div className="player-avatar player-avatar--empty">?</div>
        <div className="player-info">
          <div className="player-name">TBD</div>
        </div>
      </div>
    );
  }

  const username = participant.user?.username || "Unknown";
  const initial = username.charAt(0).toUpperCase();

  return (
    <div
      className={["player-row", isWinner ? "is-winner" : "", isMe ? "is-me" : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="player-avatar">{initial}</div>
      <div className="player-info">
        <div className="player-name">
          {username}
          {isMe && <span className="you-tag">You</span>}
          {isWinner && <Crown size={11} className="winner-crown" />}
        </div>
        <div className="player-meta">
          {participant.group && <span>Group {participant.group}</span>}
          {participant.seed !== undefined && <span>#{participant.seed}</span>}
        </div>
      </div>
      <div className="player-score">
        <span className="score-value">{participant.score ?? 0}</span>
        <span className="score-label">pts</span>
      </div>
    </div>
  );
};

export default ParticipantBracket;
