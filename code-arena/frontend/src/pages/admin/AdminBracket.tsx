import { useEffect, useState, useMemo, useRef } from "react";
import { Badge, EmptyState, LoadingState } from "../../components/ui";
import { useAdmin } from "../../context/AdminContext";
import {
  Trophy,
  Users,
  ArrowRight,
  Crown,
  Medal,
  RefreshCw,
  Swords,
  LayoutGrid,
  List,
  Printer,
  ZoomIn,
  ZoomOut,
  ChevronRight,
  Play,
} from "lucide-react";
import { tournamentApi } from "../../services/tournamentApi";
import { getErrorMessage } from "../../services/api";
import type { Bracket, BracketMatch, Participant } from "../../types";
import {
  PageHeader,
  Button,
  Alert,
  AdminCard,
  CollapsibleSection,
  AdminEmptyState,
  globalStyles,
} from "../../components/admin/AdminUI";
import { tokens } from "../../styles/designTokens";

/* ------------------------------------------------------------------ */
/* Types & helpers                                                     */
/* ------------------------------------------------------------------ */

type ViewMode = "bracket" | "list";

const ZOOM_LEVELS = [0.8, 1, 1.2] as const;
type ZoomLevel = (typeof ZOOM_LEVELS)[number];

const STAGE_ORDER = [
  { key: "REGISTRATION", label: "Registration" },
  { key: "GROUP_STAGE", label: "Group" },
  { key: "QUARTER_FINAL", label: "Quarters" },
  { key: "SEMI_FINAL", label: "Semis" },
  { key: "FINAL", label: "Final" },
  { key: "COMPLETED", label: "Complete" },
] as const;

/** Prefer tournament.status — currentStage defaults to GROUP_STAGE even in registration. */
const getStageIndex = (status?: string, stage?: string): number => {
  const statusUpper = String(status || "").toUpperCase();
  if (statusUpper === "COMPLETED") {
    return STAGE_ORDER.findIndex((s) => s.key === "COMPLETED");
  }
  if (
    statusUpper === "DRAFT" ||
    statusUpper === "REGISTRATION" ||
    statusUpper === "CANCELLED" ||
    !statusUpper
  ) {
    return STAGE_ORDER.findIndex((s) => s.key === "REGISTRATION");
  }
  const value = statusUpper || String(stage || "").toUpperCase();
  const idx = STAGE_ORDER.findIndex((s) => s.key === value);
  return idx >= 0 ? idx : 0;
};

const getGroupColor = (groupKey: string): string => {
  const colors: Record<string, string> = {
    A: "#22C55E",
    B: "#2979FF",
    C: "#F59E0B",
    D: "#38BDF8",
    E: "#14B8A6",
    F: "#0EA5E9",
    G: "#F97316",
    H: "#64748B",
  };
  return colors[groupKey] || "#607D8B";
};

const getMatchStatusTone = (
  status?: string,
): { color: string; bg: string; border: string; pulse: boolean } => {
  const s = (status || "").toUpperCase();
  if (s === "LIVE" || s === "ONGOING") {
    return {
      color: "#EF5350",
      bg: "rgba(239, 83, 80, 0.12)",
      border: "rgba(239, 83, 80, 0.35)",
      pulse: true,
    };
  }
  if (s === "COMPLETED" || s === "FINISHED") {
    return {
      color: "#22C55E",
      bg: "rgba(76, 175, 80, 0.12)",
      border: "rgba(76, 175, 80, 0.25)",
      pulse: false,
    };
  }
  return {
    color: "rgba(255, 255, 255, 0.5)",
    bg: "rgba(255, 255, 255, 0.05)",
    border: "rgba(255, 255, 255, 0.1)",
    pulse: false,
  };
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export const AdminBracket = () => {
  const { selectedTournament, refreshTournaments } = useAdmin();
  const [bracket, setBracket] = useState<Bracket | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [expandedStages, setExpandedStages] = useState<string[]>([
    "GROUP_STAGE",
    "QUARTER_FINAL",
    "SEMI_FINAL",
    "FINAL",
  ]);

  // new UI state
  const [viewMode, setViewMode] = useState<ViewMode>("bracket");
  const [zoom, setZoom] = useState<ZoomLevel>(1);
  const [selectedMatch, setSelectedMatch] = useState<BracketMatch | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const bracketRef = useRef<HTMLDivElement>(null);

  /* ---- Load ----------------------------------------------------- */
  useEffect(() => {
    let isMounted = true;
    if (selectedTournament) {
      setLoading(true);
      tournamentApi
        .bracket(selectedTournament._id)
        .then(({ bracket: data }) => {
          if (isMounted) setBracket(data);
        })
        .catch((err: unknown) => {
          if (isMounted) setError(getErrorMessage(err, "Failed to load bracket"));
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      setLoading(false);
    }
    return () => {
      isMounted = false;
    };
  }, [selectedTournament]);

  /* ---- Confetti trigger on champion ---------------------------- */
  useEffect(() => {
    if (bracket?.champion && selectedTournament?.status === "COMPLETED") {
      setShowConfetti(true);
      const id = window.setTimeout(() => setShowConfetti(false), 6000);
      return () => window.clearTimeout(id);
    }
  }, [bracket?.champion, selectedTournament?.status]);

  /* ---- Actions -------------------------------------------------- */
  const reloadBracket = async () => {
    if (!selectedTournament) return;
    setRefreshing(true);
    try {
      const { bracket: data } = await tournamentApi.bracket(selectedTournament._id);
      setBracket(data);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to reload bracket"));
    } finally {
      setRefreshing(false);
    }
  };

  const startTournament = async () => {
    if (!selectedTournament) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await tournamentApi.start(selectedTournament._id);
      setNotice("Tournament started and groups drawn.");
      await reloadBracket();
      await refreshTournaments();
      window.setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to start tournament"));
    } finally {
      setBusy(false);
    }
  };

  const advanceStage = async (
    stage: "group-stage" | "quarter-final" | "semi-final" | "complete",
    label?: string,
  ) => {
    if (!selectedTournament) return;
    const confirmed = window.confirm(
      label
        ? `Advance tournament: ${label}? This cannot be undone easily.`
        : "Advance to the next stage?",
    );
    if (!confirmed) return;

    setBusy(true);
    setError("");
    setNotice("");
    try {
      await tournamentApi.advance(selectedTournament._id, stage);
      setNotice(label ? `${label} completed.` : "Stage advanced successfully.");
      await reloadBracket();
      await refreshTournaments();
      window.setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      setError(getErrorMessage(err, "Advancement failed"));
    } finally {
      setBusy(false);
    }
  };

  const toggleStage = (stage: string) => {
    setExpandedStages((prev) =>
      prev.includes(stage) ? prev.filter((s) => s !== stage) : [...prev, stage],
    );
  };

  const handlePrint = () => window.print();

  const cycleZoom = (dir: "in" | "out") => {
    const idx = ZOOM_LEVELS.indexOf(zoom);
    if (dir === "in" && idx < ZOOM_LEVELS.length - 1) {
      setZoom(ZOOM_LEVELS[idx + 1]);
    } else if (dir === "out" && idx > 0) {
      setZoom(ZOOM_LEVELS[idx - 1]);
    }
  };

  /* ---- Derived -------------------------------------------------- */
  const isCompleted = selectedTournament?.status === "COMPLETED";
  const hasBracketData =
    !!bracket &&
    ((bracket.quarterFinal?.length ?? 0) > 0 ||
      (bracket.semiFinal?.length ?? 0) > 0 ||
      !!bracket.final ||
      Object.keys(bracket.groupStage || {}).length > 0);

  const groupCount = bracket?.groupStage ? Object.keys(bracket.groupStage).length : 0;
  const qfCount = bracket?.quarterFinal?.length ?? 0;
  const sfCount = bracket?.semiFinal?.length ?? 0;
  const hasFinal = !!bracket?.final;
  const currentStageIdx = getStageIndex(
    selectedTournament?.status,
    selectedTournament?.currentStage,
  );

  const qualifierSlots =
    (selectedTournament?.numberOfGroups || 4) * (selectedTournament?.qualifiersPerGroup || 2);

  const advanceOptions = useMemo(
    () =>
      [
        {
          stage: "GROUP_STAGE",
          label: "Advance Group Stage",
          sublabel: `Top ${qualifierSlots} → Quarter Finals`,
          action: "group-stage" as const,
          requiredStatus: "GROUP_STAGE",
          icon: <Users size={18} />,
          gradient: tokens.gradients.orange,
        },
        {
          stage: "QUARTER_FINAL",
          label: "Advance Quarter Finals",
          sublabel: "Winners → Semi Finals",
          action: "quarter-final" as const,
          requiredStatus: "QUARTER_FINAL",
          icon: <Medal size={18} />,
          gradient: tokens.gradients.brand,
        },
        {
          stage: "SEMI_FINAL",
          label: "Advance Semi Finals",
          sublabel: "Winners → Grand Final",
          action: "semi-final" as const,
          requiredStatus: "SEMI_FINAL",
          icon: <Trophy size={18} />,
          gradient: tokens.gradients.green,
        },
        {
          stage: "FINAL",
          label: "Crown Champion",
          sublabel: "Finish the tournament",
          action: "complete" as const,
          requiredStatus: "FINAL",
          icon: <Crown size={18} />,
          gradient: tokens.gradients.gold,
        },
      ] as const,
    [qualifierSlots],
  );

  const currentAdvanceOption = advanceOptions.find(
    (opt) => opt.requiredStatus === selectedTournament?.status,
  );

  const canStartTournament =
    selectedTournament?.status === "REGISTRATION" ||
    selectedTournament?.status === "DRAFT";

  /* ---- Early returns ------------------------------------------- */
  if (loading) {
    return <LoadingState label="Loading tournament seeding & bracket..." />;
  }
  if (!selectedTournament) {
    return <EmptyState label="No tournament selected." />;
  }

  /* ------------------------------------------------------------------ */
  /* Match card                                                          */
  /* ------------------------------------------------------------------ */
  const renderMatch = (match: BracketMatch) => {
    const tone = getMatchStatusTone(match.status);
    const isFinal = match.matchNumber === 999 || !match.matchNumber;

    return (
      <button
        key={`${match.matchNumber}-${match.participants?.[0]?._id || "unknown"}`}
        type="button"
        onClick={() => setSelectedMatch(match)}
        style={{
          position: "relative",
          background: isFinal
            ? "linear-gradient(135deg, rgba(255,215,0,0.06), rgba(255,215,0,0.01))"
            : tokens.colors.bg.card,
          borderRadius: tokens.radius.lg,
          padding: "14px 16px",
          border: `1px solid ${tone.pulse ? tone.border : tokens.colors.border.subtle}`,
          width: "100%",
          maxWidth: "320px",
          cursor: "pointer",
          textAlign: "left",
          fontFamily: "inherit",
          transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.borderColor = tone.color;
          e.currentTarget.style.boxShadow = `0 12px 32px ${tone.color}25`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.borderColor = tone.pulse
            ? tone.border
            : tokens.colors.border.subtle;
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {/* Match header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "10px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
              fontWeight: 700,
              color: tokens.colors.text.muted,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            <Swords size={12} />
            {isFinal ? "Grand Final" : `Match ${match.matchNumber}`}
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
                animation: tone.pulse ? "bracketPulse 1.5s infinite" : "none",
              }}
            />
            {match.status || "PENDING"}
          </div>
        </div>

        {/* Participants */}
        {match.participants?.map((p: Participant, idx: number) => {
          const isWinner = match.winner?._id === p._id;
          const isLast = idx === (match.participants?.length ?? 0) - 1;

          return (
            <div key={p._id}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 10px",
                  borderRadius: tokens.radius.sm,
                  background: isWinner ? "rgba(255, 215, 0, 0.08)" : "rgba(255, 255, 255, 0.02)",
                  border: isWinner ? "1px solid rgba(255, 215, 0, 0.25)" : "1px solid transparent",
                }}
              >
                <div
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    background: isWinner
                      ? "linear-gradient(135deg, #FFD700, #FFA000)"
                      : "rgba(255, 255, 255, 0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 800,
                    color: isWinner ? "#fff" : tokens.colors.text.muted,
                    flexShrink: 0,
                  }}
                >
                  {(p.user?.username || "?").charAt(0).toUpperCase()}
                </div>

                <span
                  style={{
                    flex: 1,
                    fontSize: "13px",
                    fontWeight: isWinner ? 700 : 500,
                    color: isWinner ? tokens.colors.accent.gold : tokens.colors.text.secondary,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {p.user?.username || "Unknown"}
                </span>

                {isWinner && (
                  <Crown
                    size={14}
                    color={tokens.colors.accent.gold}
                    style={{
                      filter: "drop-shadow(0 0 4px rgba(255,215,0,0.6))",
                    }}
                  />
                )}
              </div>

              {!isLast && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "2px 10px",
                    fontSize: "9px",
                    fontWeight: 700,
                    letterSpacing: "1px",
                    color: tokens.colors.text.faint,
                    opacity: 0.6,
                  }}
                  aria-hidden="true"
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

        {/* Hover hint */}
        <div
          style={{
            marginTop: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "4px",
            fontSize: "10px",
            color: tokens.colors.text.muted,
            fontWeight: 600,
          }}
        >
          Details <ChevronRight size={11} />
        </div>
      </button>
    );
  };

  /* ------------------------------------------------------------------ */
  /* Group Stage renderer                                                */
  /* ------------------------------------------------------------------ */
  const renderGroupStage = () => {
    if (!bracket?.groupStage || Object.keys(bracket.groupStage).length === 0) {
      return <EmptyState label="Group stage not yet drawn" />;
    }

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "12px",
        }}
      >
        {Object.entries(bracket.groupStage).map(([groupName, participants]) => {
          const groupColor = getGroupColor(groupName);
          return (
            <div
              key={groupName}
              style={{
                background: tokens.colors.bg.card,
                borderRadius: tokens.radius.md,
                overflow: "hidden",
                border: `1px solid ${tokens.colors.border.subtle}`,
              }}
            >
              <div
                style={{
                  padding: "10px 14px",
                  background: `linear-gradient(135deg, ${groupColor}20, ${groupColor}08)`,
                  borderBottom: `1px solid ${tokens.colors.border.subtle}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${groupColor}, ${groupColor}cc)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: "12px",
                      fontWeight: 800,
                      boxShadow: `0 4px 12px ${groupColor}40`,
                    }}
                  >
                    {groupName}
                  </div>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: tokens.colors.text.primary,
                    }}
                  >
                    Group {groupName}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: groupColor,
                    background: `${groupColor}20`,
                    padding: "2px 8px",
                    borderRadius: "999px",
                  }}
                >
                  {participants.length}
                </span>
              </div>

              <div style={{ padding: "8px" }}>
                {participants.map((p) => {
                  const isEliminated = p.status === "ELIMINATED";
                  return (
                    <div
                      key={p._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "6px 10px",
                        borderRadius: tokens.radius.sm,
                        opacity: isEliminated ? 0.5 : 1,
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minWidth: "22px",
                          height: "22px",
                          borderRadius: "50%",
                          background: "rgba(255, 255, 255, 0.04)",
                          fontSize: "10px",
                          fontWeight: 700,
                          color: tokens.colors.text.muted,
                          flexShrink: 0,
                        }}
                      >
                        #{p.seed}
                      </span>
                      <span
                        style={{
                          flex: 1,
                          fontSize: "12px",
                          fontWeight: 500,
                          color: isEliminated
                            ? tokens.colors.text.faint
                            : tokens.colors.text.secondary,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {p.user?.username || "Unknown"}
                      </span>
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: isEliminated ? tokens.colors.text.faint : "#22C55E",
                          boxShadow: isEliminated ? "none" : "0 0 6px rgba(76,175,80,0.6)",
                          flexShrink: 0,
                        }}
                        aria-hidden="true"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /* ------------------------------------------------------------------ */
  /* Main render                                                         */
  /* ------------------------------------------------------------------ */
  return (
    <div style={{ padding: "24px 0" }}>
      {/* ============================== HEADER ============================== */}
      <PageHeader
        eyebrow="Tournament Bracket"
        title="Bracket Management"
        subtitle={`${selectedTournament.name} · ${
          isCompleted ? "COMPLETED" : selectedTournament.status || "REGISTRATION"
        }`}
        actions={
          <>
            <Badge tone={isCompleted ? "gold" : "blue"}>
              {isCompleted ? "COMPLETED" : selectedTournament.status || "REGISTRATION"}
            </Badge>

            <div
              style={{
                display: "inline-flex",
                padding: "3px",
                borderRadius: tokens.radius.md,
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${tokens.colors.border.subtle}`,
              }}
            >
              <ToggleBtn
                active={viewMode === "bracket"}
                onClick={() => setViewMode("bracket")}
                icon={<LayoutGrid size={14} />}
                label="Bracket"
              />
              <ToggleBtn
                active={viewMode === "list"}
                onClick={() => setViewMode("list")}
                icon={<List size={14} />}
                label="List"
              />
            </div>

            {viewMode === "bracket" && hasBracketData && (
              <div
                style={{
                  display: "inline-flex",
                  padding: "3px",
                  borderRadius: tokens.radius.md,
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${tokens.colors.border.subtle}`,
                }}
              >
                <IconBtn
                  onClick={() => cycleZoom("out")}
                  disabled={zoom === ZOOM_LEVELS[0]}
                  title="Zoom out"
                >
                  <ZoomOut size={14} />
                </IconBtn>
                <div
                  style={{
                    minWidth: "42px",
                    textAlign: "center",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: tokens.colors.text.muted,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {Math.round(zoom * 100)}%
                </div>
                <IconBtn
                  onClick={() => cycleZoom("in")}
                  disabled={zoom === ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
                  title="Zoom in"
                >
                  <ZoomIn size={14} />
                </IconBtn>
              </div>
            )}

            <Button onClick={handlePrint} icon={<Printer size={14} />} variant="secondary">
              Print
            </Button>

            <Button onClick={reloadBracket} loading={refreshing} icon={<RefreshCw size={16} />}>
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </>
        }
      />

      {/* Stage pipeline */}
      <AdminCard padding="22px 28px" style={{ marginBottom: tokens.spacing.lg }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${STAGE_ORDER.length}, 1fr)`,
            gap: "8px",
          }}
        >
          {STAGE_ORDER.map((s, i) => {
            const done = i < currentStageIdx;
            const active = i === currentStageIdx;
            return (
              <div
                key={s.key}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: done
                      ? tokens.colors.accent.green
                      : active
                        ? tokens.gradients.brand
                        : "rgba(255,255,255,0.04)",
                    border: `1px solid ${
                      done
                        ? tokens.colors.accent.green
                        : active
                          ? "rgba(41,121,255,0.5)"
                          : "rgba(255,255,255,0.08)"
                    }`,
                    color: done || active ? "white" : tokens.colors.text.muted,
                    fontSize: "11px",
                    fontWeight: 800,
                    boxShadow: active ? "0 0 20px rgba(41,121,255,0.4)" : "none",
                  }}
                >
                  {done ? "✓" : i + 1}
                </div>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: active
                      ? tokens.colors.text.primary
                      : done
                        ? tokens.colors.text.secondary
                        : tokens.colors.text.muted,
                    textTransform: "uppercase",
                    letterSpacing: "0.6px",
                    textAlign: "center",
                  }}
                >
                  {s.label}
                </span>
                {i < STAGE_ORDER.length - 1 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "15px",
                      left: "calc(50% + 20px)",
                      right: "calc(-50% + 20px)",
                      height: "2px",
                      background: done ? tokens.colors.accent.green : "rgba(255,255,255,0.06)",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </AdminCard>

      {error && <Alert type="error" message={error} onDismiss={() => setError("")} />}
      {notice && <Alert type="success" message={notice} onDismiss={() => setNotice("")} />}

      {/* ============================== STATS ============================== */}
      {hasBracketData && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "12px",
            marginBottom: tokens.spacing.lg,
          }}
        >
          <BracketStat
            icon={<Users size={18} />}
            label="Groups"
            value={groupCount}
            color="#22C55E"
          />
          <BracketStat
            icon={<Medal size={18} />}
            label="Quarter Finals"
            value={qfCount}
            color="#F59E0B"
          />
          <BracketStat
            icon={<Trophy size={18} />}
            label="Semi Finals"
            value={sfCount}
            color={tokens.colors.accent.blue}
          />
          <BracketStat
            icon={<Crown size={18} />}
            label="Grand Final"
            value={hasFinal ? 1 : 0}
            color="#FFD700"
          />
        </div>
      )}

      {/* ============================== CONTENT ============================== */}
      {!hasBracketData ? (
        <AdminEmptyState
          icon={<Trophy size={40} color="rgba(255,215,0,0.2)" />}
          title="No Bracket Data Available"
          description={
            canStartTournament
              ? "Start the tournament to generate groups and bracket matches."
              : "Bracket data is not available yet. Refresh after contests are linked."
          }
          action={
            canStartTournament ? (
              <Button
                variant="primary"
                size="lg"
                loading={busy}
                icon={<Play size={18} />}
                onClick={startTournament}
              >
                Start Tournament
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="lg"
                loading={refreshing}
                icon={<RefreshCw size={18} />}
                onClick={reloadBracket}
              >
                Refresh Bracket
              </Button>
            )
          }
        />
      ) : viewMode === "bracket" ? (
        /* ---------- BRACKET VIEW ---------- */
        <div
          ref={bracketRef}
          style={{
            display: "flex",
            gap: "32px",
            overflowX: "auto",
            padding: "16px 4px 24px",
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
            transition: "transform 0.25s ease",
          }}
        >
          {/* Quarter Finals column */}
          {bracket?.quarterFinal && bracket.quarterFinal.length > 0 && (
            <BracketColumn
              title="Quarter Finals"
              icon={<Medal size={18} color="#F59E0B" />}
              tone="#F59E0B"
            >
              {bracket.quarterFinal.map(renderMatch)}
            </BracketColumn>
          )}

          {/* Semi Finals column */}
          {bracket?.semiFinal && bracket.semiFinal.length > 0 && (
            <BracketColumn
              title="Semi Finals"
              icon={<Trophy size={18} color={tokens.colors.accent.blue} />}
              tone={tokens.colors.accent.blue}
            >
              {bracket.semiFinal.map(renderMatch)}
            </BracketColumn>
          )}

          {/* Final column */}
          {bracket?.final && (
            <BracketColumn
              title="Grand Final"
              icon={<Crown size={18} color="#FFD700" />}
              tone="#FFD700"
            >
              {renderMatch(bracket.final)}

              {bracket.champion && <ChampionCard champion={bracket.champion} />}
            </BracketColumn>
          )}

          {/* If only group stage exists (no knockouts yet) */}
          {!bracket?.quarterFinal?.length && !bracket?.semiFinal?.length && !bracket?.final && (
            <div style={{ width: "100%" }}>
              <AdminCard padding="40px 24px">
                <div style={{ textAlign: "center" }}>
                  <Swords
                    size={42}
                    color="rgba(41,121,255,0.4)"
                    style={{ marginBottom: "12px" }}
                  />
                  <h3
                    style={{
                      margin: "0 0 6px",
                      color: tokens.colors.text.primary,
                      fontSize: "18px",
                      fontWeight: 700,
                    }}
                  >
                    Knockout Stage Not Started
                  </h3>
                  <p
                    style={{
                      color: tokens.colors.text.muted,
                      fontSize: "14px",
                      margin: 0,
                    }}
                  >
                    Advance the group stage to generate the bracket.
                  </p>
                </div>
              </AdminCard>
            </div>
          )}
        </div>
      ) : (
        /* ---------- LIST VIEW ---------- */
        <>
          {/* Group Stage */}
          <CollapsibleSection
            title="Group Stage"
            icon={<Users size={20} color={tokens.colors.accent.blueLight} />}
            badge={<Badge tone="muted">{groupCount} Groups</Badge>}
            expanded={expandedStages.includes("GROUP_STAGE")}
            onToggle={() => toggleStage("GROUP_STAGE")}
          >
            {renderGroupStage()}
          </CollapsibleSection>

          {/* Quarter Finals */}
          {bracket?.quarterFinal && bracket.quarterFinal.length > 0 && (
            <CollapsibleSection
              title="Quarter Finals"
              icon={<Medal size={20} color={tokens.colors.accent.orange} />}
              badge={<Badge tone="muted">{bracket.quarterFinal.length} Matches</Badge>}
              expanded={expandedStages.includes("QUARTER_FINAL")}
              onToggle={() => toggleStage("QUARTER_FINAL")}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "12px",
                }}
              >
                {bracket.quarterFinal.map(renderMatch)}
              </div>
            </CollapsibleSection>
          )}

          {/* Semi Finals */}
          {bracket?.semiFinal && bracket.semiFinal.length > 0 && (
            <CollapsibleSection
              title="Semi Finals"
              icon={<Trophy size={20} color={tokens.colors.accent.blue} />}
              badge={<Badge tone="muted">{bracket.semiFinal.length} Matches</Badge>}
              expanded={expandedStages.includes("SEMI_FINAL")}
              onToggle={() => toggleStage("SEMI_FINAL")}
              variant="blue"
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "12px",
                }}
              >
                {bracket.semiFinal.map(renderMatch)}
              </div>
            </CollapsibleSection>
          )}

          {/* Final */}
          {bracket?.final && (
            <CollapsibleSection
              title="Grand Final"
              icon={<Crown size={20} color={tokens.colors.accent.gold} />}
              badge={<Badge tone="gold">Championship Match</Badge>}
              expanded={expandedStages.includes("FINAL")}
              onToggle={() => toggleStage("FINAL")}
              variant="gold"
            >
              <div style={{ maxWidth: "400px" }}>
                {renderMatch(bracket.final)}
                {bracket.champion && <ChampionCard champion={bracket.champion} />}
              </div>
            </CollapsibleSection>
          )}
        </>
      )}

      {/* ============================== ADVANCE ============================== */}
      {!isCompleted && currentAdvanceOption && hasBracketData && (
        <AdminCard variant="blue" padding="20px 24px" style={{ marginTop: tokens.spacing.md }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: tokens.radius.md,
                background: currentAdvanceOption.gradient,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {currentAdvanceOption.icon}
            </div>

            <div style={{ flex: 1, minWidth: "180px" }}>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  color: tokens.colors.accent.blue,
                  marginBottom: "2px",
                }}
              >
                Next Action
              </div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: tokens.colors.text.primary,
                }}
              >
                {currentAdvanceOption.label}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: tokens.colors.text.muted,
                }}
              >
                {currentAdvanceOption.sublabel}
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              loading={busy}
              onClick={() =>
                advanceStage(currentAdvanceOption.action, currentAdvanceOption.label)
              }
              icon={<ArrowRight size={18} />}
            >
              {busy ? "Processing..." : "Advance"}
            </Button>
          </div>
        </AdminCard>
      )}

      {/* ============================== CHAMPION (completed) ============================== */}
      {isCompleted && bracket?.champion && (
        <AdminCard
          variant="gold"
          padding="32px 24px"
          style={{
            marginTop: tokens.spacing.md,
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "-50%",
              left: "50%",
              transform: "translateX(-50%)",
              width: "400px",
              height: "400px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,215,0,0.15), transparent 70%)",
              filter: "blur(60px)",
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "relative", zIndex: 1 }}>
            <Crown
              size={56}
              color={tokens.colors.accent.gold}
              style={{
                marginBottom: "12px",
                filter: "drop-shadow(0 0 20px rgba(255,215,0,0.5))",
              }}
            />
            <h2
              style={{
                fontSize: "26px",
                fontWeight: 800,
                color: tokens.colors.accent.gold,
                margin: 0,
                marginBottom: "8px",
              }}
            >
              Tournament Complete
            </h2>
            <p
              style={{
                color: tokens.colors.text.secondary,
                fontSize: "15px",
                margin: 0,
              }}
            >
              Champion crowned
            </p>
            <div
              style={{
                marginTop: "12px",
                fontSize: "22px",
                fontWeight: 800,
                color: tokens.colors.accent.gold,
              }}
            >
              {bracket.champion.user?.username || "Unknown"}
            </div>
          </div>
        </AdminCard>
      )}

      {/* ============================== MATCH DRAWER ============================== */}
      {selectedMatch && (
        <MatchDrawer match={selectedMatch} onClose={() => setSelectedMatch(null)} />
      )}

      {/* ============================== CONFETTI ============================== */}
      {showConfetti && <ConfettiOverlay />}

      <style>{globalStyles}</style>
      <style>{`
        @keyframes bracketPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
        @keyframes confettiFall {
          0% { transform: translateY(-20vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @media print {
          button, .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

interface BracketStatProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

const BracketStat: React.FC<BracketStatProps> = ({ icon, label, value, color }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "14px 16px",
      borderRadius: tokens.radius.md,
      background: tokens.colors.bg.card,
      border: `1px solid ${tokens.colors.border.subtle}`,
      transition: "transform 0.2s ease, border-color 0.2s ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.borderColor = `${color}40`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.borderColor = tokens.colors.border.subtle;
    }}
  >
    <div
      style={{
        width: "38px",
        height: "38px",
        borderRadius: tokens.radius.sm,
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
          color: tokens.colors.text.muted,
          marginBottom: "2px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "20px",
          fontWeight: 800,
          color: tokens.colors.text.primary,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
    </div>
  </div>
);

interface ToggleBtnProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const ToggleBtn: React.FC<ToggleBtnProps> = ({ active, onClick, icon, label }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "7px 12px",
      borderRadius: tokens.radius.sm,
      background: active ? tokens.gradients.brand : "transparent",
      border: "none",
      color: active ? "#fff" : tokens.colors.text.muted,
      fontSize: "12px",
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit",
    }}
  >
    {icon}
    {label}
  </button>
);

interface IconBtnProps {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}

const IconBtn: React.FC<IconBtnProps> = ({ onClick, disabled, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "30px",
      height: "26px",
      borderRadius: tokens.radius.sm,
      background: "transparent",
      border: "none",
      color: tokens.colors.text.muted,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.3 : 1,
    }}
  >
    {children}
  </button>
);

interface BracketColumnProps {
  title: string;
  icon: React.ReactNode;
  tone: string;
  children: React.ReactNode;
}

const BracketColumn: React.FC<BracketColumnProps> = ({ title, icon, tone, children }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      minWidth: "320px",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 14px",
        borderRadius: tokens.radius.md,
        background: `${tone}12`,
        border: `1px solid ${tone}25`,
        fontSize: "12px",
        fontWeight: 800,
        color: tone,
        textTransform: "uppercase",
        letterSpacing: "1px",
      }}
    >
      {icon}
      {title}
    </div>
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        flex: 1,
        justifyContent: "space-around",
      }}
    >
      {children}
    </div>
  </div>
);

interface ChampionCardProps {
  champion: Participant;
}

const ChampionCard: React.FC<ChampionCardProps> = ({ champion }) => (
  <div
    style={{
      marginTop: tokens.spacing.md,
      padding: "20px 24px",
      borderRadius: tokens.radius.lg,
      background: "linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,215,0,0.02))",
      border: "1px solid rgba(255,215,0,0.25)",
      textAlign: "center",
      position: "relative",
      overflow: "hidden",
    }}
  >
    <Crown
      size={28}
      color={tokens.colors.accent.gold}
      style={{
        marginBottom: "8px",
        filter: "drop-shadow(0 0 12px rgba(255,215,0,0.5))",
      }}
    />
    <div
      style={{
        fontSize: "11px",
        color: tokens.colors.text.muted,
        textTransform: "uppercase",
        letterSpacing: "1.5px",
        fontWeight: 700,
        marginBottom: "4px",
      }}
    >
      Champion
    </div>
    <div
      style={{
        fontSize: "22px",
        fontWeight: 800,
        color: tokens.colors.accent.gold,
      }}
    >
      {champion.user?.username || "Unknown"}
    </div>
  </div>
);

interface MatchDrawerProps {
  match: BracketMatch;
  onClose: () => void;
}

const MatchDrawer: React.FC<MatchDrawerProps> = ({ match, onClose }) => {
  const tone = getMatchStatusTone(match.status);
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          zIndex: 90,
          backdropFilter: "blur(4px)",
        }}
      />
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(420px, 100vw)",
          background: "#0B0E1A",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          zIndex: 91,
          padding: "24px",
          overflowY: "auto",
          animation: "slideIn 0.25s ease",
        }}
      >
        <style>{`
          @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "1px",
              color: tone.color,
            }}
          >
            <Swords size={14} />
            Match {match.matchNumber ?? "—"}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: tokens.colors.text.muted,
              cursor: "pointer",
              fontSize: "20px",
              lineHeight: 1,
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "5px 12px",
            borderRadius: "999px",
            background: tone.bg,
            border: `1px solid ${tone.border}`,
            color: tone.color,
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: "20px",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: tone.color,
            }}
          />
          {match.status || "PENDING"}
        </div>

        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "1px",
            color: tokens.colors.text.muted,
            marginBottom: "12px",
          }}
        >
          Participants
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {match.participants?.map((p) => {
            const isWinner = match.winner?._id === p._id;
            return (
              <div
                key={p._id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "14px 16px",
                  borderRadius: tokens.radius.md,
                  background: isWinner ? "rgba(255,215,0,0.08)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${
                    isWinner ? "rgba(255,215,0,0.28)" : "rgba(255,255,255,0.06)"
                  }`,
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: isWinner
                      ? "linear-gradient(135deg, #FFD700, #FFA000)"
                      : "rgba(255,255,255,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isWinner ? "#fff" : tokens.colors.text.muted,
                    fontWeight: 800,
                    fontSize: "14px",
                    flexShrink: 0,
                  }}
                >
                  {(p.user?.username || "?").charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: isWinner ? tokens.colors.accent.gold : tokens.colors.text.primary,
                    }}
                  >
                    {p.user?.username || "Unknown"}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: tokens.colors.text.muted,
                    }}
                  >
                    Seed #{p.seed ?? "—"} · {p.status ?? "ACTIVE"}
                  </div>
                </div>
                {isWinner && <Crown size={16} color={tokens.colors.accent.gold} />}
              </div>
            );
          })}
        </div>

        {match.winner && (
          <div
            style={{
              marginTop: "20px",
              padding: "16px",
              borderRadius: tokens.radius.md,
              background: "rgba(76,175,80,0.08)",
              border: "1px solid rgba(76,175,80,0.25)",
              color: tokens.colors.accent.green,
              fontSize: "13px",
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            🏆 Winner: {match.winner.user?.username || "Unknown"}
          </div>
        )}
      </div>
    </>
  );
};

/* ------------------------------------------------------------------ */
/* Confetti overlay (CSS-only)                                         */
/* ------------------------------------------------------------------ */

const ConfettiOverlay: React.FC = () => {
  const pieces = Array.from({ length: 40 }, (_, i) => i);
  const colors = ["#FFD700", "#FFA000", "#22C55E", "#2979FF", "#64B5F6", "#FF6B6B"];
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 100,
        overflow: "hidden",
      }}
    >
      {pieces.map((i) => {
        // Deterministic layout avoids StrictMode remount flicker
        const left = (i * 37 + 11) % 100;
        const delay = (i % 10) * 0.2;
        const duration = 3 + (i % 5) * 0.4;
        const color = colors[i % colors.length];
        const size = 6 + (i % 6);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${left}%`,
              top: "-20px",
              width: `${size}px`,
              height: `${size * 1.6}px`,
              background: color,
              borderRadius: "2px",
              animation: `confettiFall ${duration}s linear ${delay}s forwards`,
            }}
          />
        );
      })}
    </div>
  );
};

export default AdminBracket;
