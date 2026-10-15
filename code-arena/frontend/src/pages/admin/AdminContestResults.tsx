import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  RefreshCw,
  AlertCircle,
  Trophy,
  Users,
  Save,
  Clock,
  Video,
  VideoOff,
  Lock,
  Swords,
} from "lucide-react";
import { LoadingState, ErrorState } from "../../components/ui";
import { apiClient } from "../../services/api";

interface RosterEntry {
  participantId: string;
  user?: {
    name?: string;
    username?: string;
    codeforcesUsername?: string;
  };
  group?: string;
  seed?: number;
  videoStatus: "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
  isEligible: boolean;
  solved: number;
  penalty: number;
  rank: number | null;
  effectiveSolved: number;
  effectivePenalty: number;
}

interface ContestInfo {
  _id: string;
  name: string;
  stage: string;
  group?: string;
  matchNumber?: number;
  status: string;
  startTime?: string;
  endTime?: string;
}

interface MatchInfo {
  matchId: string;
  matchNumber: number;
  stage: string;
  status: string;
  isLocked: boolean;
  winner: { participantId: string; name?: string; username?: string } | null;
}

// ---- Design tokens ---------------------------------------------------
const c = {
  bg: { card: "rgba(255,255,255,0.02)" },
  border: { subtle: "rgba(255,255,255,0.06)", mid: "rgba(255,255,255,0.1)" },
  text: {
    primary: "#ffffff",
    secondary: "rgba(255,255,255,0.7)",
    muted: "rgba(255,255,255,0.5)",
    faint: "rgba(255,255,255,0.3)",
  },
  accent: {
    blue: "#64B5F6",
    green: "#22C55E",
    red: "#EF5350",
    gold: "#FFD700",
    purple: "#7DD3FC",
    orange: "#F59E0B",
  },
  radius: { sm: "8px", md: "12px", lg: "16px" },
} as const;

const getVideoTone = (status: string) => {
  switch (status) {
    case "APPROVED":
      return {
        color: c.accent.green,
        label: "Approved",
        icon: <Video size={12} />,
      };
    case "PENDING":
      return {
        color: c.accent.gold,
        label: "Pending",
        icon: <Clock size={12} />,
      };
    case "REJECTED":
      return {
        color: c.accent.red,
        label: "Rejected",
        icon: <VideoOff size={12} />,
      };
    default:
      return {
        color: c.text.faint,
        label: "Not submitted",
        icon: <VideoOff size={12} />,
      };
  }
};

export const AdminContestResults = () => {
  const { contestId } = useParams<{ contestId: string }>();

  const [contest, setContest] = useState<ContestInfo | null>(null);
  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null);
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Local edits keyed by participantId (admin can type before saving)
  const [edits, setEdits] = useState<Record<string, { solved: number; penalty: number }>>({});

  // Per-participant save state
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // Rematch form state
  const [showRematchForm, setShowRematchForm] = useState(false);
  const [rematchUrl, setRematchUrl] = useState("");
  const [rematchStart, setRematchStart] = useState("");
  const [rematchDuration, setRematchDuration] = useState(60);
  const [rematchSubmitting, setRematchSubmitting] = useState(false);

  // ---- Load ----------------------------------------------------------
  const load = useCallback(async () => {
    if (!contestId) return;
    try {
      setError("");
      const res = await apiClient.get(`/admin/contests/${contestId}/results`);
      setContest(res.data.contest);
      setMatchInfo(res.data.matchInfo || null);
      setRoster(res.data.roster || []);

      // Seed edits from current values
      const nextEdits: Record<string, { solved: number; penalty: number }> = {};
      for (const r of res.data.roster || []) {
        nextEdits[r.participantId] = { solved: r.solved, penalty: r.penalty };
      }
      setEdits(nextEdits);
      setSavedIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load roster");
    } finally {
      setLoading(false);
    }
  }, [contestId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // ---- Edit handlers --------------------------------------------------
  const setEdit = (participantId: string, patch: Partial<{ solved: number; penalty: number }>) => {
    setEdits((prev) => ({
      ...prev,
      [participantId]: { ...prev[participantId], ...patch },
    }));
    setSavedIds((prev) => {
      if (!prev.has(participantId)) return prev;
      const next = new Set(prev);
      next.delete(participantId);
      return next;
    });
  };

  // ---- Save one participant ------------------------------------------
  const handleSave = async (participantId: string) => {
    if (!contestId) return;
    const edit = edits[participantId];
    if (!edit) return;

    setSavingId(participantId);
    setError("");
    try {
      await apiClient.post(`/admin/contests/${contestId}/results`, {
        participantId,
        solved: edit.solved,
        penalty: edit.penalty,
      });

      const res = await apiClient.get(`/admin/contests/${contestId}/results`);
      setRoster(res.data.roster || []);
      setMatchInfo(res.data.matchInfo || null);

      setEdits((prev) => {
        const next = { ...prev };
        for (const r of res.data.roster || []) {
          if (r.participantId === participantId) {
            next[r.participantId] = { solved: r.solved, penalty: r.penalty };
          }
        }
        return next;
      });

      setSavedIds((prev) => new Set(prev).add(participantId));
      setNotice("Result saved");
      setTimeout(() => setNotice(""), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save result");
    } finally {
      setSavingId(null);
    }
  };

  // ---- Start rematch --------------------------------------------------
  const handleStartRematch = async () => {
    if (!matchInfo?.matchId || !rematchUrl || !rematchStart) return;
    setRematchSubmitting(true);
    setError("");
    try {
      await apiClient.post(`/admin/matches/${matchInfo.matchId}/rematch`, {
        invitationUrl: rematchUrl,
        startTime: new Date(rematchStart).toISOString(),
        durationMinutes: rematchDuration,
      });
      setShowRematchForm(false);
      setRematchUrl("");
      setRematchStart("");
      setNotice("Rematch created — enter the new results");
      await load();
      setTimeout(() => setNotice(""), 3500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create rematch");
    } finally {
      setRematchSubmitting(false);
    }
  };

  // ---- Preview rank ---------------------------------------------------
  const previewRanks = useMemo(() => {
    const rows = roster.map((r) => {
      const edit = edits[r.participantId] || {
        solved: r.solved,
        penalty: r.penalty,
      };
      const isEligible = r.isEligible;
      return {
        participantId: r.participantId,
        solved: isEligible ? edit.solved : 0,
        penalty: isEligible ? edit.penalty : 0,
        seed: r.seed ?? 9999,
      };
    });
    rows.sort((a, b) => {
      if (b.solved !== a.solved) return b.solved - a.solved;
      if (a.penalty !== b.penalty) return a.penalty - b.penalty;
      return a.seed - b.seed;
    });
    const ranks: Record<string, number> = {};
    rows.forEach((r, i) => {
      ranks[r.participantId] = i + 1;
    });
    return ranks;
  }, [roster, edits]);

  // ---- Derived stats --------------------------------------------------
  const eligibleCount = roster.filter((r) => r.isEligible).length;
  const notEligibleCount = roster.length - eligibleCount;
  const enteredCount = roster.filter((r) => savedIds.has(r.participantId)).length;

  const isLocked = matchInfo?.isLocked ?? false;

  if (loading) return <LoadingState label="Loading contest results..." />;
  if (error && !contest) return <ErrorState error={error} />;
  if (!contest) return <ErrorState error="Contest not found" />;

  const scopeLabel =
    contest.stage === "GROUP_STAGE" && contest.group
      ? `Group ${contest.group}`
      : "All approved participants";

  return (
    <div style={{ padding: "24px 0" }}>
      {/* Back link */}
      <Link
        to="/admin/contests"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "16px",
          color: c.text.muted,
          fontSize: "13px",
          textDecoration: "none",
        }}
      >
        <ArrowLeft size={14} />
        Back to Contests
      </Link>

      {/* Header */}
      <div
        style={{
          position: "relative",
          padding: "28px 32px",
          borderRadius: c.radius.lg,
          background: "linear-gradient(135deg, rgba(41, 121, 255, 0.06), rgba(56, 189, 248, 0.06))",
          border: `1px solid ${c.border.subtle}`,
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
                borderRadius: c.radius.md,
                background: "linear-gradient(135deg, #FFD700, #FFA000)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                boxShadow: "0 12px 32px rgba(255, 215, 0, 0.3)",
                flexShrink: 0,
              }}
            >
              <Trophy size={24} />
            </div>
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "1.2px",
                  color: "rgba(255, 215, 0, 0.85)",
                  marginBottom: "2px",
                }}
              >
                Result Entry
              </div>
              <h1
                style={{
                  fontSize: "22px",
                  fontWeight: 800,
                  margin: 0,
                  background: "linear-gradient(135deg, #FFFFFF, #FFD700)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {contest.name}
              </h1>
              <div
                style={{
                  fontSize: "13px",
                  color: c.text.muted,
                  marginTop: "2px",
                }}
              >
                {scopeLabel} · {contest.status} · {roster.length} participant
                {roster.length !== 1 ? "s" : ""}
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
              borderRadius: c.radius.md,
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${c.border.mid}`,
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

      {/* Match status banners */}
      {matchInfo && matchInfo.status === "TIE" && !isLocked && (
        <div
          data-testid="match-tied-banner"
          style={{
            padding: "20px 24px",
            borderRadius: c.radius.lg,
            background: "rgba(255, 152, 0, 0.08)",
            border: "1px solid rgba(255, 152, 0, 0.3)",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            flexWrap: "wrap",
          }}
        >
          <AlertCircle size={24} color={c.accent.orange} />
          <div style={{ flex: 1, minWidth: "220px" }}>
            <div
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: c.accent.orange,
                marginBottom: "2px",
              }}
            >
              Match Tied
            </div>
            <div style={{ fontSize: "13px", color: c.text.secondary }}>
              Both participants have identical results. Create a rematch with a new contest to
              determine the winner.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowRematchForm(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 18px",
              borderRadius: c.radius.md,
              background: "linear-gradient(135deg, #F59E0B, #F57C00)",
              border: "none",
              color: "#fff",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            <Swords size={14} />
            Start Rematch
          </button>
        </div>
      )}

      {matchInfo?.winner && (
        <div
          data-testid="match-winner-banner"
          style={{
            padding: "16px 20px",
            borderRadius: c.radius.md,
            background: "rgba(76, 175, 80, 0.08)",
            border: "1px solid rgba(76, 175, 80, 0.3)",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <Trophy size={20} color={c.accent.green} />
          <div style={{ flex: 1, minWidth: "180px" }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: c.accent.green,
                textTransform: "uppercase",
                letterSpacing: "0.8px",
              }}
            >
              Match Winner
            </div>
            <div
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: c.text.primary,
              }}
            >
              {matchInfo.winner.name || matchInfo.winner.username}
            </div>
          </div>
          {isLocked && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: c.text.muted,
                fontSize: "12px",
              }}
            >
              <Lock size={12} />
              Locked (stage advanced)
            </div>
          )}
        </div>
      )}

      {isLocked && !matchInfo?.winner && (
        <div
          style={{
            padding: "14px 18px",
            borderRadius: c.radius.md,
            background: "rgba(255, 255, 255, 0.02)",
            border: `1px solid ${c.border.mid}`,
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: c.text.muted,
            fontSize: "13px",
          }}
        >
          <Lock size={16} />
          Results are locked — this stage has already advanced.
        </div>
      )}

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <StatCard
          label="Eligible (video approved)"
          value={eligibleCount}
          color={c.accent.green}
          icon={<Video size={16} />}
        />
        <StatCard
          label="Not eligible (auto 0)"
          value={notEligibleCount}
          color={c.accent.red}
          icon={<VideoOff size={16} />}
        />
        <StatCard
          label="Results saved"
          value={enteredCount}
          color={c.accent.blue}
          icon={<Save size={16} />}
        />
      </div>

      {/* Alerts */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            borderRadius: c.radius.md,
            background: "rgba(239, 83, 80, 0.1)",
            border: "1px solid rgba(239, 83, 80, 0.25)",
            color: c.accent.red,
            marginBottom: "16px",
            fontSize: "13px",
          }}
        >
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      {notice && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            borderRadius: c.radius.md,
            background: "rgba(76, 175, 80, 0.1)",
            border: "1px solid rgba(76, 175, 80, 0.25)",
            color: c.accent.green,
            marginBottom: "16px",
            fontSize: "13px",
          }}
        >
          <CheckCircle size={16} />
          {notice}
        </div>
      )}

      {/* Roster table */}
      {roster.length === 0 ? (
        <div
          style={{
            padding: "60px 24px",
            textAlign: "center",
            background: c.bg.card,
            borderRadius: c.radius.lg,
            border: `1px dashed ${c.border.mid}`,
          }}
        >
          <Users size={40} color={c.text.faint} style={{ marginBottom: "12px" }} />
          <h3 style={{ margin: 0, color: c.text.secondary }}>No eligible participants</h3>
          <p style={{ color: c.text.muted, marginTop: "6px" }}>
            {contest.stage === "GROUP_STAGE" && contest.group
              ? `Group ${contest.group} has no approved participants yet.`
              : "This contest has no approved participants."}
          </p>
        </div>
      ) : (
        <div
          style={{
            background: c.bg.card,
            border: `1px solid ${c.border.subtle}`,
            borderRadius: c.radius.lg,
            overflow: "hidden",
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
                    background: "rgba(255,255,255,0.04)",
                    borderBottom: `1px solid ${c.border.subtle}`,
                  }}
                >
                  <Th>Rank</Th>
                  <Th>Participant</Th>
                  <Th align="center">Group</Th>
                  <Th align="center">Video</Th>
                  <Th align="center">Solved</Th>
                  <Th align="center">Penalty (min)</Th>
                  <Th align="center">Save</Th>
                </tr>
              </thead>
              <tbody>
                {roster.map((r) => {
                  const edit = edits[r.participantId] || {
                    solved: r.solved,
                    penalty: r.penalty,
                  };
                  const preview = previewRanks[r.participantId] ?? r.rank ?? "—";
                  const isSaved = savedIds.has(r.participantId);
                  const isSaving = savingId === r.participantId;
                  const isEligible = r.isEligible;
                  const videoTone = getVideoTone(r.videoStatus);
                  const name = r.user?.name || r.user?.username || "Unknown";
                  const initial = name.charAt(0).toUpperCase();
                  const inputsDisabled = !isEligible || isLocked;

                  return (
                    <tr
                      key={r.participantId}
                      style={{
                        borderBottom: `1px solid ${c.border.subtle}`,
                      }}
                    >
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minWidth: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            background:
                              preview === 1
                                ? "linear-gradient(135deg, #FFD700, #FFA000)"
                                : preview === 2
                                  ? "linear-gradient(135deg, #C0C0C0, #9E9E9E)"
                                  : preview === 3
                                    ? "linear-gradient(135deg, #CD7F32, #A0522D)"
                                    : "rgba(255,255,255,0.05)",
                            color:
                              typeof preview === "number" && preview <= 3
                                ? "#fff"
                                : c.text.secondary,
                            fontSize: "12px",
                            fontWeight: 800,
                          }}
                        >
                          {preview}
                        </span>
                      </td>

                      <td style={{ padding: "12px 16px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              background: "linear-gradient(135deg, #2979FF, #EAB308)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              fontWeight: 800,
                              fontSize: "13px",
                              flexShrink: 0,
                            }}
                          >
                            {initial}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 600,
                                color: c.text.primary,
                              }}
                            >
                              {name}
                            </div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: c.text.muted,
                              }}
                            >
                              @{r.user?.username || "—"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td
                        style={{
                          padding: "12px 16px",
                          textAlign: "center",
                        }}
                      >
                        {r.group ? (
                          <span
                            style={{
                              display: "inline-flex",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              background: "rgba(56,189,248,0.12)",
                              border: "1px solid rgba(56,189,248,0.25)",
                              color: c.accent.purple,
                              fontSize: "11px",
                              fontWeight: 700,
                            }}
                          >
                            {r.group}
                          </span>
                        ) : (
                          <span style={{ color: c.text.faint }}>—</span>
                        )}
                      </td>

                      <td
                        style={{
                          padding: "12px 16px",
                          textAlign: "center",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "3px 10px",
                            borderRadius: "999px",
                            background: `${videoTone.color}15`,
                            border: `1px solid ${videoTone.color}30`,
                            color: videoTone.color,
                            fontSize: "10px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.4px",
                          }}
                        >
                          {videoTone.icon}
                          {videoTone.label}
                        </span>
                      </td>

                      <td
                        style={{
                          padding: "12px 16px",
                          textAlign: "center",
                        }}
                      >
                        <input
                          type="number"
                          min={0}
                          value={edit.solved}
                          onChange={(e) =>
                            setEdit(r.participantId, {
                              solved: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                          disabled={inputsDisabled}
                          style={{
                            width: "70px",
                            padding: "7px 10px",
                            borderRadius: c.radius.sm,
                            background: inputsDisabled
                              ? "rgba(255,255,255,0.02)"
                              : "rgba(255,255,255,0.05)",
                            border: `1px solid ${c.border.mid}`,
                            color: inputsDisabled ? c.text.faint : "#fff",
                            fontSize: "13px",
                            textAlign: "center",
                            outline: "none",
                            cursor: inputsDisabled ? "not-allowed" : "text",
                          }}
                        />
                      </td>

                      <td
                        style={{
                          padding: "12px 16px",
                          textAlign: "center",
                        }}
                      >
                        <input
                          type="number"
                          min={0}
                          value={edit.penalty}
                          onChange={(e) =>
                            setEdit(r.participantId, {
                              penalty: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                          disabled={inputsDisabled}
                          style={{
                            width: "90px",
                            padding: "7px 10px",
                            borderRadius: c.radius.sm,
                            background: inputsDisabled
                              ? "rgba(255,255,255,0.02)"
                              : "rgba(255,255,255,0.05)",
                            border: `1px solid ${c.border.mid}`,
                            color: inputsDisabled ? c.text.faint : "#fff",
                            fontSize: "13px",
                            textAlign: "center",
                            outline: "none",
                            cursor: inputsDisabled ? "not-allowed" : "text",
                          }}
                        />
                      </td>

                      <td
                        style={{
                          padding: "12px 16px",
                          textAlign: "center",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleSave(r.participantId)}
                          disabled={isSaving || inputsDisabled}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "7px 14px",
                            borderRadius: c.radius.sm,
                            background: isSaved
                              ? "rgba(76,175,80,0.15)"
                              : "linear-gradient(135deg, #2979FF, #1565C0)",
                            border: isSaved ? "1px solid rgba(76,175,80,0.35)" : "none",
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: "12px",
                            cursor: isSaving || inputsDisabled ? "not-allowed" : "pointer",
                            opacity: isSaving || inputsDisabled ? 0.5 : 1,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {isSaving ? (
                            <>
                              <RefreshCw
                                size={12}
                                style={{
                                  animation: "spin 0.9s linear infinite",
                                }}
                              />
                              Saving…
                            </>
                          ) : isSaved ? (
                            <>
                              <CheckCircle size={12} />
                              Saved
                            </>
                          ) : (
                            <>
                              <Save size={12} />
                              Save
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rematch modal */}
      {showRematchForm && matchInfo && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "24px",
          }}
          onClick={() => setShowRematchForm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "480px",
              background: "#0F1420",
              borderRadius: c.radius.lg,
              border: `1px solid ${c.border.subtle}`,
              padding: "24px",
            }}
          >
            <div
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "#fff",
                marginBottom: "4px",
              }}
            >
              Start Rematch
            </div>
            <div
              style={{
                fontSize: "13px",
                color: c.text.muted,
                marginBottom: "20px",
                lineHeight: 1.5,
              }}
            >
              A new contest will be created for Match {matchInfo.matchNumber}. Old results will be
              cleared so you can enter the new ones.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: c.text.secondary,
                    marginBottom: "6px",
                  }}
                >
                  New Invitation URL *
                </label>
                <input
                  type="url"
                  value={rematchUrl}
                  onChange={(e) => setRematchUrl(e.target.value)}
                  placeholder="https://codeforces.com/contestInvitation/..."
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: c.radius.sm,
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${c.border.mid}`,
                    color: "#fff",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: c.text.secondary,
                    marginBottom: "6px",
                  }}
                >
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  value={rematchStart}
                  onChange={(e) => setRematchStart(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: c.radius.sm,
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${c.border.mid}`,
                    color: "#fff",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                    colorScheme: "dark",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: c.text.secondary,
                    marginBottom: "6px",
                  }}
                >
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min={1}
                  value={rematchDuration}
                  onChange={(e) => setRematchDuration(Number(e.target.value))}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: c.radius.sm,
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${c.border.mid}`,
                    color: "#fff",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button
                type="button"
                onClick={handleStartRematch}
                disabled={rematchSubmitting || !rematchUrl || !rematchStart}
                style={{
                  flex: 1,
                  padding: "11px 16px",
                  borderRadius: c.radius.md,
                  background: "linear-gradient(135deg, #F59E0B, #F57C00)",
                  border: "none",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor:
                    rematchSubmitting || !rematchUrl || !rematchStart ? "not-allowed" : "pointer",
                  opacity: rematchSubmitting || !rematchUrl || !rematchStart ? 0.5 : 1,
                }}
              >
                {rematchSubmitting ? "Creating…" : "Create Rematch"}
              </button>
              <button
                type="button"
                onClick={() => setShowRematchForm(false)}
                style={{
                  flex: 1,
                  padding: "11px 16px",
                  borderRadius: c.radius.md,
                  background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${c.border.mid}`,
                  color: c.text.secondary,
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
};

// ---- Helpers --------------------------------------------------------

const Th: React.FC<{
  children: React.ReactNode;
  align?: "left" | "center";
}> = ({ children, align = "left" }) => (
  <th
    style={{
      padding: "12px 16px",
      textAlign: align,
      fontSize: "11px",
      fontWeight: 700,
      color: "rgba(255,255,255,0.4)",
      textTransform: "uppercase",
      letterSpacing: "1px",
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </th>
);

const StatCard: React.FC<{
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}> = ({ label, value, color, icon }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "14px 16px",
      borderRadius: "12px",
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.06)",
    }}
  >
    <div
      style={{
        width: "38px",
        height: "38px",
        borderRadius: "10px",
        background: `${color}1a`,
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
          color: "rgba(255,255,255,0.5)",
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

export default AdminContestResults;
