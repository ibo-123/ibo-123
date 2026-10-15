// frontend/src/pages/participant/ParticipantMatch.tsx
import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Swords,
  Trophy,
  Crown,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  TrendingUp,
  Calendar,
  Award,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { tournamentApi } from "../../services/tournamentApi";
import { LoadingState, ErrorState } from "../../components/common";
import type { Bracket, Match, Participant } from "../../types";
import "./ParticipantMatch.css";

// ============================================================
// Helpers
// ============================================================

type StageKey = "quarterFinal" | "semiFinal" | "final";

const STAGE_LABELS: Record<StageKey, string> = {
  quarterFinal: "Quarter Final",
  semiFinal: "Semi Final",
  final: "Final",
};

const STAGE_SHORT: Record<StageKey, string> = {
  quarterFinal: "QF",
  semiFinal: "SF",
  final: "F",
};

interface MyMatchEntry {
  stage: StageKey;
  match: Match;
  opponent: Participant | null;
  isWinner: boolean;
  isLoser: boolean;
  isPending: boolean;
}

// ============================================================
// Component
// ============================================================

export const ParticipantMatch = () => {
  const { id: tournamentId } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [bracket, setBracket] = useState<Bracket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        setError(err instanceof Error ? err.message : "Failed to load matches");
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

  // ---- Find my participant ID ----
  const myParticipantId = useMemo(() => {
    if (!bracket || !myUsername) return null;

    const check = (p?: Participant | null) => (p?.user?.username === myUsername ? p._id : null);

    for (const list of Object.values(bracket.groupStage || {})) {
      for (const p of list) {
        const found = check(p);
        if (found) return found;
      }
    }

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
    }
    return null;
  }, [bracket, myUsername]);

  // ---- Find my participant row (for stats) ----
  const myParticipant = useMemo(() => {
    if (!bracket || !myUsername) return null;

    for (const list of Object.values(bracket.groupStage || {})) {
      for (const p of list) {
        if (p.user?.username === myUsername) return p;
      }
    }
    return null;
  }, [bracket, myUsername]);

  // ---- Extract my matches ----
  const myMatches: MyMatchEntry[] = useMemo(() => {
    if (!bracket || !myParticipantId) return [];

    const allMatches: Array<{ stage: StageKey; match: Match }> = [
      ...(bracket.quarterFinal || []).map((m) => ({ stage: "quarterFinal" as StageKey, match: m })),
      ...(bracket.semiFinal || []).map((m) => ({ stage: "semiFinal" as StageKey, match: m })),
      ...(bracket.final ? [{ stage: "final" as StageKey, match: bracket.final }] : []),
    ];

    const entries: MyMatchEntry[] = [];

    for (const { stage, match } of allMatches) {
      const me = match.participants?.find((p) => String(p._id) === String(myParticipantId));
      if (!me) continue;

      const opponent =
        match.participants?.find((p) => String(p._id) !== String(myParticipantId)) || null;
      const winnerId = match.winner?._id;
      const isWinner = !!winnerId && String(winnerId) === String(myParticipantId);
      const isLoser = !!winnerId && String(winnerId) !== String(myParticipantId);
      const isPending = !winnerId;

      entries.push({ stage, match, opponent, isWinner, isLoser, isPending });
    }

    return entries;
  }, [bracket, myParticipantId]);

  if (loading) {
    return <LoadingState variant="spinner" size="lg" label="Loading your matches..." />;
  }
  if (error) return <ErrorState error={error} />;

  // ---- Not in the knockout stage ----
  if (!myParticipantId || myMatches.length === 0) {
    return (
      <div className="participant-match">
        <div className="match-empty">
          <div className="match-empty-icon">
            <Swords size={44} />
          </div>
          <h3>You haven't played a knockout match yet</h3>
          <p>Your match history will appear here once you qualify from the group stage.</p>
          <Link to={`/dashboard/tournaments/${tournamentId}`} className="btn-secondary">
            <Trophy size={16} />
            <span>Back to Tournament</span>
          </Link>
        </div>
      </div>
    );
  }

  // ---- Split into current + past ----
  const currentMatch = myMatches.find((m) => m.isPending) || null;
  const pastMatches = myMatches.filter((m) => !m.isPending);
  const champion = bracket?.champion;
  const isChampion = champion?.user?.username === myUsername;

  return (
    <div className="participant-match">
      {/* ---- Champion banner ---- */}
      {isChampion && (
        <div className="champion-banner">
          <div className="champion-glow" aria-hidden="true" />
          <div className="champion-content">
            <div className="champion-crown-wrap">
              <Crown size={32} />
            </div>
            <div>
              <div className="champion-eyebrow">Tournament Champion</div>
              <h2 className="champion-title">You won the tournament</h2>
              <p className="champion-subtitle">
                Congratulations! You are the champion of this tournament.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ---- Current match ---- */}
      {currentMatch && (
        <div className="current-match-card">
          <div className="current-match-glow" aria-hidden="true" />
          <div className="current-match-content">
            <div className="current-match-eyebrow">
              <Clock size={12} />
              <span>Your Next Match</span>
            </div>
            <div className="current-match-stage">{STAGE_LABELS[currentMatch.stage]}</div>

            <div className="current-match-players">
              <div className="current-match-player current-match-player--me">
                <div className="cmp-avatar">{(myUsername || "?").charAt(0).toUpperCase()}</div>
                <div className="cmp-info">
                  <div className="cmp-name">{myUsername}</div>
                  <div className="cmp-meta">
                    {myParticipant?.group && <>Group {myParticipant.group}</>}
                    {myParticipant?.seed !== undefined && <> · #{myParticipant.seed}</>}
                  </div>
                </div>
              </div>

              <div className="current-match-vs">
                <Swords size={18} />
                <span>vs</span>
              </div>

              <div className="current-match-player">
                <div className="cmp-avatar">
                  {(currentMatch.opponent?.user?.username || "?").charAt(0).toUpperCase()}
                </div>
                <div className="cmp-info">
                  <div className="cmp-name">{currentMatch.opponent?.user?.username || "TBD"}</div>
                  <div className="cmp-meta">
                    {currentMatch.opponent?.group && <>Group {currentMatch.opponent.group}</>}
                    {currentMatch.opponent?.seed !== undefined && (
                      <> · #{currentMatch.opponent.seed}</>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {currentMatch.match.contest && (
              <div className="current-match-contest">
                <div className="cmc-label">Contest</div>
                <div className="cmc-body">
                  <span className="cmc-name">{currentMatch.match.contest.name}</span>
                  <Link to={`/dashboard/tournaments/${tournamentId}/contests`} className="cmc-link">
                    <ExternalLink size={12} />
                    <span>Open contest</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- Past matches timeline ---- */}
      {pastMatches.length > 0 && (
        <div className="match-history">
          <div className="history-header">
            <Award size={16} />
            <h3>Your Match History</h3>
            <span className="history-count">
              {pastMatches.length} {pastMatches.length === 1 ? "match" : "matches"}
            </span>
          </div>

          <div className="history-timeline">
            {pastMatches.map((entry, idx) => (
              <HistoryCard key={`${entry.stage}-${entry.match.matchNumber}-${idx}`} entry={entry} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// HistoryCard
// ============================================================

interface HistoryCardProps {
  entry: MyMatchEntry;
}

const HistoryCard = ({ entry }: HistoryCardProps) => {
  const { stage, match, opponent, isWinner, isLoser } = entry;

  const tone = isWinner ? "win" : isLoser ? "loss" : "pending";

  return (
    <div className={`history-card history-card--${tone}`}>
      <div className="history-card-header">
        <div className="history-stage">
          <span className="history-stage-badge">{STAGE_SHORT[stage]}</span>
          <span className="history-stage-label">{STAGE_LABELS[stage]}</span>
        </div>
        <div className={`history-result history-result--${tone}`}>
          {isWinner ? (
            <>
              <CheckCircle2 size={12} />
              <span>Won</span>
            </>
          ) : isLoser ? (
            <>
              <XCircle size={12} />
              <span>Lost</span>
            </>
          ) : (
            <>
              <Clock size={12} />
              <span>Pending</span>
            </>
          )}
        </div>
      </div>

      <div className="history-card-body">
        <div className="history-opponent">
          <div className="history-opponent-avatar">
            {(opponent?.user?.username || "?").charAt(0).toUpperCase()}
          </div>
          <div className="history-opponent-info">
            <div className="history-opponent-label">
              {isWinner ? "Defeated" : isLoser ? "Lost to" : "Playing"}
            </div>
            <div className="history-opponent-name">{opponent?.user?.username || "TBD"}</div>
          </div>
        </div>

        {match.contest && (
          <div className="history-contest">
            <TrendingUp size={12} />
            <span className="history-contest-name">{match.contest.name}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantMatch;
