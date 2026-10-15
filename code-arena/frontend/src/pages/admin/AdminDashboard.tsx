import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../../context/AdminContext";
import { Badge, LoadingState } from "../../components/ui";
import {
  Trophy,
  Users,
  Clock,
  Play,
  ArrowRight,
  Crown,
  RefreshCw,
  Sparkles,
  Medal,
  Plus,
  TrendingUp,
  Zap,
  Gift,
  Star,
  Download,
  UserCheck,
  BarChart3,
  Activity,
  Timer,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Award,
  Target,
} from "lucide-react";
import { tournamentApi } from "../../services/tournamentApi";
import { getErrorMessage } from "../../services/api";
import type { Participant } from "../../types";
import {
  PageHeader,
  Button,
  Alert,
  AdminCard,
  StatCard,
  globalStyles,
} from "../../components/admin/AdminUI";
import { tokens } from "../../styles/designTokens";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const STAGES = [
  { key: "REGISTRATION", label: "Registration" },
  { key: "GROUP_STAGE", label: "Group" },
  { key: "QUARTER_FINAL", label: "Quarters" },
  { key: "SEMI_FINAL", label: "Semis" },
  { key: "FINAL", label: "Final" },
  { key: "COMPLETED", label: "Done" },
] as const;

/** Prefer tournament.status — currentStage defaults to GROUP_STAGE even in registration. */
const getStageIndex = (status?: string, stage?: string): number => {
  const statusUpper = String(status || "").toUpperCase();
  if (statusUpper === "COMPLETED") {
    return STAGES.findIndex((s) => s.key === "COMPLETED");
  }
  if (
    statusUpper === "DRAFT" ||
    statusUpper === "REGISTRATION" ||
    statusUpper === "CANCELLED" ||
    !statusUpper
  ) {
    return STAGES.findIndex((s) => s.key === "REGISTRATION");
  }
  const value = statusUpper || String(stage || "").toUpperCase();
  const idx = STAGES.findIndex((s) => s.key === value);
  return idx >= 0 ? idx : 0;
};

const statusTone = (status: string): "gold" | "green" | "blue" | "muted" => {
  switch (status) {
    case "COMPLETED":
      return "gold";
    case "GROUP_STAGE":
    case "QUARTER_FINAL":
    case "SEMI_FINAL":
    case "FINAL":
      return "green";
    case "REGISTRATION":
    case "DRAFT":
      return "blue";
    default:
      return "muted";
  }
};

const statusColor = (status: string): string => {
  switch (status) {
    case "COMPLETED":
      return tokens.colors.accent.gold;
    case "REGISTRATION":
    case "DRAFT":
      return tokens.colors.accent.blue;
    case "GROUP_STAGE":
    case "QUARTER_FINAL":
    case "SEMI_FINAL":
    case "FINAL":
      return tokens.colors.accent.green;
    default:
      return tokens.colors.text.muted;
  }
};

/* Animated counter hook */
const useCountUp = (target: number, duration = 800) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf: number;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { selectedTournament, tournaments, setSelectedTournament, refreshTournaments } =
    useAdmin();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  /* ---- Load metrics --------------------------------------------- */
  const loadMetrics = async () => {
    if (!selectedTournament) return;
    try {
      const { participants: data } = await tournamentApi.participants(selectedTournament._id);
      setParticipants(data);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load participants"));
    }
  };

  useEffect(() => {
    if (selectedTournament) {
      loadMetrics();
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTournament?._id]);

  /* ---- Actions --------------------------------------------------- */
  const handleAction = async (action: () => Promise<unknown>, successMsg: string) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(successMsg);
      await loadMetrics();
      await refreshTournaments();
      window.setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      setError(getErrorMessage(err, "Action failed"));
    } finally {
      setBusy(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshTournaments();
      if (selectedTournament) {
        const { participants: data } = await tournamentApi.participants(selectedTournament._id);
        setParticipants(data);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to refresh"));
    } finally {
      setRefreshing(false);
    }
  };

  const handleExportCSV = () => {
    if (!participants.length) return;
    const header = ["rank", "username", "score", "solved", "penalty", "group", "status"];
    const rows = participants.map((p) => [
      p.rank ?? "",
      p.user?.username ?? "",
      p.score ?? 0,
      p.solved ?? 0,
      p.penalty ?? 0,
      p.group ?? "",
      p.status ?? "",
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedTournament?.name ?? "tournament"}-participants.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ---- Derived --------------------------------------------------- */
  const participantCount = participants.length;
  const maxParticipants = selectedTournament?.maxParticipants || 20;
  const isCompleted = selectedTournament?.status === "COMPLETED";
  const tournamentStatus = selectedTournament?.status || "";
  const qualifierSlots =
    (selectedTournament?.numberOfGroups || 4) * (selectedTournament?.qualifiersPerGroup || 2);
  const progress = Math.min(100, Math.round((participantCount / maxParticipants) * 100));

  const approvedCount = participants.filter((p) => p.registrationStatus === "APPROVED").length;
  const pendingCount = participants.filter((p) => p.registrationStatus === "PENDING").length;
  const rejectedCount = participants.filter((p) => p.registrationStatus === "REJECTED").length;
  const acceptanceRate =
    participantCount > 0 ? Math.round((approvedCount / participantCount) * 100) : 0;

  const topPerformers = useMemo(
    () =>
      participants
        .filter((p) => p.rank && p.rank <= 3)
        .sort((a, b) => (a.rank || 999) - (b.rank || 999)),
    [participants],
  );

  const topScore = useMemo(
    () => Math.max(1, ...participants.map((p) => p.score || 0)),
    [participants],
  );

  const totalScore = participants.reduce((sum, p) => sum + (p.score || 0), 0);
  const avgScore = participantCount > 0 ? Math.round(totalScore / participantCount) : 0;

  const currentStageIndex = getStageIndex(
    selectedTournament?.status,
    selectedTournament?.currentStage,
  );

  /* Count-up values */
  const animatedParticipants = useCountUp(participantCount);
  const animatedProgress = useCountUp(progress);
  const animatedAvg = useCountUp(avgScore);

  /* Score distribution buckets */
  const scoreBuckets = useMemo(() => {
    if (!participants.length) return [];
    const scores = participants.map((p) => p.score || 0);
    const max = Math.max(1, ...scores);
    const bucketSize = Math.max(1, Math.ceil(max / 5));
    const buckets = Array.from({ length: 5 }, (_, i) => ({
      label: `${i * bucketSize}–${(i + 1) * bucketSize - 1}`,
      count: 0,
    }));
    scores.forEach((s) => {
      const idx = Math.min(4, Math.floor(s / bucketSize));
      buckets[idx].count += 1;
    });
    return buckets;
  }, [participants]);

  const maxBucket = Math.max(1, ...scoreBuckets.map((b) => b.count));

  /* ---- Empty state ---------------------------------------------- */
  if (loading) return <LoadingState label="Loading admin dashboard..." />;

  if (!selectedTournament) {
    return (
      <div style={{ padding: "24px 0" }}>
        <PageHeader
          eyebrow="Tournament Control Center"
          title="Admin Overview"
          subtitle="Monitor and manage tournament progress in real-time"
        />
        <AdminCard
          padding="80px 40px"
          style={{ textAlign: "center", maxWidth: "600px", margin: "40px auto" }}
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
            <Trophy size={40} color="rgba(255,215,0,0.2)" />
          </div>
          <h3
            style={{
              color: tokens.colors.text.secondary,
              marginTop: 0,
              fontSize: "24px",
            }}
          >
            No Tournament Selected
          </h3>
          <p style={{ color: tokens.colors.text.muted, marginBottom: "24px" }}>
            Create a tournament to get started with the admin panel
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate("/admin/tournaments/create")}
            icon={<Sparkles size={20} />}
          >
            Create Tournament
          </Button>
        </AdminCard>
        <style>{globalStyles}</style>
      </div>
    );
  }

  /* ---- Main ----------------------------------------------------- */
  return (
    <div
      style={{
        padding: "24px 0",
        minHeight: "100vh",
        color: tokens.colors.text.primary,
      }}
    >
      {/* ================= HEADER ================= */}
      <PageHeader
        eyebrow="Tournament Control Center"
        title="Admin Overview"
        subtitle="Monitor and manage tournament progress in real-time"
        actions={
          <>
            <Badge tone={statusTone(selectedTournament.status || "")}>
              <span
                style={{
                  display: "inline-block",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: statusColor(selectedTournament.status || ""),
                  marginRight: "6px",
                }}
              />
              {selectedTournament.status || "DRAFT"}
            </Badge>

            <Button
              variant="gold"
              onClick={() => navigate("/admin/tournaments/create")}
              icon={<Plus size={16} />}
            >
              New Tournament
            </Button>

            <Button onClick={handleRefresh} loading={refreshing} icon={<RefreshCw size={16} />}>
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </>
        }
      />

      {/* Alerts */}
      {error && <Alert type="error" message={error} onDismiss={() => setError("")} />}
      {notice && <Alert type="success" message={notice} onDismiss={() => setNotice("")} />}

      {/* ================= QUICK ACTIONS ================= */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "24px",
        }}
      >
        <QuickAction
          icon={<UserCheck size={15} />}
          label="Manage Participants"
          onClick={() => navigate("/admin/participants")}
        />
        <QuickAction
          icon={<BarChart3 size={15} />}
          label="View Standings"
          onClick={() => navigate("/admin/standings")}
        />
        <QuickAction icon={<Download size={15} />} label="Export CSV" onClick={handleExportCSV} />
        <QuickAction
          icon={<Target size={15} />}
          label="Contests"
          onClick={() => navigate("/admin/contests")}
        />
      </div>

      {/* ================= STAGE PIPELINE ================= */}
      <AdminCard padding="22px 28px" style={{ marginBottom: "24px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              padding: "6px",
              borderRadius: tokens.radius.md,
              background: "rgba(41,121,255,0.1)",
            }}
          >
            <Activity size={18} color={tokens.colors.accent.blue} />
          </div>
          <small
            style={{
              fontSize: "11px",
              color: tokens.colors.text.muted,
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              fontWeight: 600,
            }}
          >
            Stage Pipeline
          </small>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${STAGES.length}, 1fr)`,
            gap: "10px",
            alignItems: "center",
          }}
        >
          {STAGES.map((s, i) => {
            const done = i < currentStageIndex;
            const active = i === currentStageIndex;
            return (
              <div
                key={s.key}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "10px",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
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
                    fontWeight: 800,
                    fontSize: "13px",
                    transition: "all 0.3s ease",
                    boxShadow: active ? "0 0 24px rgba(41,121,255,0.4)" : "none",
                  }}
                >
                  {done ? <CheckCircle2 size={16} /> : i + 1}
                </div>
                <small
                  style={{
                    fontSize: "11px",
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
                </small>
                {i < STAGES.length - 1 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "18px",
                      left: "calc(50% + 24px)",
                      right: "calc(-50% + 24px)",
                      height: "2px",
                      background: done ? tokens.colors.accent.green : "rgba(255,255,255,0.06)",
                      transition: "background-color 0.3s ease",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </AdminCard>

      {/* ================= STAT CARDS ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        <StatCard
          label="Tournament"
          value={selectedTournament.name || "Code Arena 2026"}
          icon={<Trophy size={22} color={tokens.colors.accent.gold} />}
          bgColor="rgba(255,215,0,0.08)"
          subtitle={selectedTournament.currentStage || "Not started"}
        />
        <StatCard
          label="Participants"
          value={`${animatedParticipants} / ${maxParticipants}`}
          icon={<Users size={22} color={tokens.colors.accent.blue} />}
          bgColor="rgba(41,121,255,0.08)"
          subtitle={`${animatedProgress}% capacity`}
        />
        <StatCard
          label="Current Stage"
          value={selectedTournament.currentStage?.replace(/_/g, " ") || "—"}
          icon={<Clock size={22} color={tokens.colors.accent.green} />}
          bgColor="rgba(34,197,94,0.08)"
          subtitle={isCompleted ? "✅ Completed" : "🔄 In progress"}
        />
        <StatCard
          label="Average Score"
          value={animatedAvg}
          icon={<TrendingUp size={22} color={tokens.colors.accent.orange} />}
          bgColor="rgba(245,158,11,0.08)"
          subtitle={`${participantCount} participants`}
        />
      </div>

      {/* ================= REGISTRATION HEALTH ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        {/* Progress */}
        <AdminCard padding="22px 28px">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Sparkles size={16} color={tokens.colors.accent.gold} style={{ opacity: 0.6 }} />
                <small
                  style={{
                    fontSize: "11px",
                    color: tokens.colors.text.muted,
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
                    fontWeight: 600,
                  }}
                >
                  Registration Progress
                </small>
              </div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: tokens.colors.text.secondary,
                  marginTop: "2px",
                }}
              >
                {participantCount} of {maxParticipants} spots filled
              </div>
            </div>
            <div
              style={{
                padding: "4px 16px",
                borderRadius: tokens.radius.full,
                fontSize: "14px",
                fontWeight: 700,
                background: progress >= 100 ? "rgba(255,215,0,0.15)" : "rgba(41,121,255,0.15)",
                color: progress >= 100 ? tokens.colors.accent.gold : tokens.colors.accent.blue,
              }}
            >
              {progress}%
            </div>
          </div>
          <div
            style={{
              width: "100%",
              height: "10px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "6px",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: progress >= 100 ? tokens.gradients.gold : tokens.gradients.brand,
                borderRadius: "6px",
                transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 0 20px rgba(41,121,255,0.2)",
              }}
            />
          </div>

          {/* Sub-stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "12px",
              marginTop: "20px",
            }}
          >
            <MiniStat
              label="Approved"
              value={approvedCount}
              color={tokens.colors.accent.green}
              icon={<CheckCircle2 size={14} />}
            />
            <MiniStat
              label="Pending"
              value={pendingCount}
              color={tokens.colors.accent.gold}
              icon={<Timer size={14} />}
            />
            <MiniStat
              label="Rejected"
              value={rejectedCount}
              color="#EF5350"
              icon={<AlertCircle size={14} />}
            />
          </div>
        </AdminCard>

        {/* Acceptance rate */}
        <AdminCard
          padding="22px 28px"
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              fontSize: "42px",
              fontWeight: 900,
              color: tokens.colors.text.primary,
              lineHeight: 1,
            }}
          >
            {acceptanceRate}
            <span
              style={{
                fontSize: "20px",
                color: tokens.colors.text.muted,
                marginLeft: "2px",
              }}
            >
              %
            </span>
          </div>
          <div
            style={{
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "1.2px",
              color: tokens.colors.text.muted,
              fontWeight: 700,
            }}
          >
            Acceptance Rate
          </div>
          <div
            style={{
              width: "60px",
              height: "2px",
              background: tokens.gradients.brand,
              borderRadius: "2px",
            }}
          />
          <div style={{ fontSize: "12px", color: tokens.colors.text.muted }}>
            {approvedCount} approved of {participantCount} total
          </div>
        </AdminCard>
      </div>

      {/* ================= SCORE DISTRIBUTION ================= */}
      {scoreBuckets.length > 0 && participantCount > 0 && (
        <AdminCard padding="22px 28px" style={{ marginBottom: "28px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "18px",
            }}
          >
            <div
              style={{
                padding: "6px",
                borderRadius: tokens.radius.md,
                background: "rgba(41,121,255,0.1)",
              }}
            >
              <BarChart3 size={18} color={tokens.colors.accent.blue} />
            </div>
            <small
              style={{
                fontSize: "11px",
                color: tokens.colors.text.muted,
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                fontWeight: 600,
              }}
            >
              Score Distribution
            </small>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${scoreBuckets.length}, 1fr)`,
              gap: "12px",
              alignItems: "end",
              height: "160px",
            }}
          >
            {scoreBuckets.map((b, i) => {
              const h = (b.count / maxBucket) * 100;
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                    height: "100%",
                    justifyContent: "flex-end",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 800,
                      color: tokens.colors.text.primary,
                    }}
                  >
                    {b.count}
                  </div>
                  <div
                    style={{
                      width: "100%",
                      maxWidth: "60px",
                      height: `${Math.max(4, h)}%`,
                      borderRadius: "8px 8px 4px 4px",
                      background: tokens.gradients.brand,
                      transition: "height 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                      boxShadow: "0 0 16px rgba(41,121,255,0.25)",
                    }}
                  />
                  <div
                    style={{
                      fontSize: "10px",
                      color: tokens.colors.text.muted,
                      fontWeight: 600,
                      textAlign: "center",
                    }}
                  >
                    {b.label}
                  </div>
                </div>
              );
            })}
          </div>
        </AdminCard>
      )}

      {/* ================= TOP PERFORMERS ================= */}
      {topPerformers.length > 0 && (
        <AdminCard variant="gold" padding="22px 28px" style={{ marginBottom: "28px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                padding: "6px",
                borderRadius: tokens.radius.md,
                background: "rgba(255,215,0,0.1)",
              }}
            >
              <Medal size={18} color={tokens.colors.accent.gold} />
            </div>
            <small
              style={{
                fontSize: "11px",
                color: tokens.colors.text.muted,
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                fontWeight: 600,
              }}
            >
              Top Performers
            </small>
            <span
              style={{
                fontSize: "10px",
                color: tokens.colors.text.muted,
                marginLeft: "auto",
              }}
            >
              🏆 Leaderboard
            </span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "12px",
            }}
          >
            {topPerformers.map((p) => {
              const share = Math.round(((p.score || 0) / topScore) * 100);
              return (
                <AdminCard
                  key={p._id}
                  padding="14px 16px"
                  hoverable
                  style={{ display: "flex", flexDirection: "column", gap: "10px" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background:
                          p.rank === 1
                            ? tokens.gradients.gold
                            : p.rank === 2
                              ? "linear-gradient(135deg, #E0E0E0, #9E9E9E)"
                              : "linear-gradient(135deg, #CD7F32, #A67B5B)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "16px",
                        color: p.rank === 1 ? tokens.colors.bg.primary : "white",
                        flexShrink: 0,
                      }}
                    >
                      {p.rank === 1 ? "🥇" : p.rank === 2 ? "🥈" : "🥉"}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: tokens.colors.text.primary,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.user?.username || "Anonymous"}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: tokens.colors.text.muted,
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span>⭐ {p.score || 0} pts</span>
                        <span>•</span>
                        <span>#{p.rank}</span>
                      </div>
                    </div>
                    {p.rank === 1 && (
                      <Crown
                        size={16}
                        color={tokens.colors.accent.gold}
                        style={{ flexShrink: 0 }}
                      />
                    )}
                  </div>
                  <div
                    style={{
                      height: "4px",
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: "4px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${share}%`,
                        height: "100%",
                        background: p.rank === 1 ? tokens.gradients.gold : tokens.gradients.brand,
                        borderRadius: "4px",
                        transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    />
                  </div>
                </AdminCard>
              );
            })}
          </div>
        </AdminCard>
      )}

      {/* ================= STAGE CONTROL ================= */}
      <AdminCard
        padding="28px"
        style={{
          position: "relative",
          overflow: "hidden",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-50%",
            right: "-20%",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(41,121,255,0.03), transparent)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "12px",
            position: "relative",
          }}
        >
          <div
            style={{
              padding: "6px",
              borderRadius: tokens.radius.md,
              background: "rgba(255,215,0,0.08)",
            }}
          >
            <Zap size={18} color={tokens.colors.accent.gold} />
          </div>
          <small
            style={{
              fontSize: "11px",
              color: tokens.colors.text.muted,
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              fontWeight: 600,
            }}
          >
            Advancement & Stage Control
          </small>
        </div>

        <h3
          style={{
            fontSize: "22px",
            fontWeight: 800,
            margin: "0 0 6px 0",
            color: tokens.colors.text.primary,
            letterSpacing: "-0.5px",
            position: "relative",
          }}
        >
          Trigger Stage Transitions
        </h3>

        <p
          style={{
            color: tokens.colors.text.muted,
            fontSize: "14px",
            marginBottom: "24px",
            position: "relative",
          }}
        >
          Manage tournament progression through group stage draw, knockout quarter-finals,
          semi-finals, and grand final completion.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            position: "relative",
          }}
        >
          {(tournamentStatus === "REGISTRATION" || tournamentStatus === "DRAFT") && (
            <Button
              variant="success"
              size="lg"
              loading={busy}
              onClick={() =>
                handleAction(
                  () => tournamentApi.start(selectedTournament._id),
                  "Tournament started & groups drawn!",
                )
              }
              icon={<Play size={18} />}
            >
              Start & Draw Groups
            </Button>
          )}

          {tournamentStatus === "GROUP_STAGE" && (
            <Button
              variant="primary"
              size="lg"
              loading={busy}
              onClick={() =>
                handleAction(
                  () => tournamentApi.advance(selectedTournament._id, "group-stage"),
                  `Advanced top ${qualifierSlots} to Quarter-Finals!`,
                )
              }
              icon={<ArrowRight size={18} />}
            >
              Advance to Quarter-Finals (Top {qualifierSlots})
            </Button>
          )}

          {tournamentStatus === "QUARTER_FINAL" && (
            <Button
              variant="primary"
              size="lg"
              loading={busy}
              onClick={() =>
                handleAction(
                  () => tournamentApi.advance(selectedTournament._id, "quarter-final"),
                  "Advanced QF winners to Semi-Finals!",
                )
              }
              icon={<ArrowRight size={18} />}
            >
              Advance to Semi-Finals
            </Button>
          )}

          {tournamentStatus === "SEMI_FINAL" && (
            <Button
              variant="primary"
              size="lg"
              loading={busy}
              onClick={() =>
                handleAction(
                  () => tournamentApi.advance(selectedTournament._id, "semi-final"),
                  "Advanced SF winners to Grand Final!",
                )
              }
              icon={<ArrowRight size={18} />}
            >
              Advance to Grand Final
            </Button>
          )}

          {tournamentStatus === "FINAL" && !isCompleted && (
            <Button
              variant="gold"
              size="lg"
              loading={busy}
              onClick={() =>
                handleAction(
                  () => tournamentApi.advance(selectedTournament._id, "complete"),
                  "Tournament completed & Champion crowned!",
                )
              }
              icon={<Crown size={18} />}
            >
              Crown Champion & Complete
            </Button>
          )}

          {isCompleted && (
            <div
              style={{
                padding: "14px 24px",
                borderRadius: tokens.radius.lg,
                background: "rgba(255,215,0,0.08)",
                border: "1px solid rgba(255,215,0,0.15)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: tokens.colors.accent.gold,
                fontWeight: 700,
                fontSize: "14px",
              }}
            >
              <Gift size={20} />
              Tournament Completed
            </div>
          )}
        </div>
      </AdminCard>

      {/* ================= TOURNAMENT SELECTOR (STICKY) ================= */}
      {tournaments.length > 0 && (
        <div
          style={{
            position: "sticky",
            bottom: "16px",
            zIndex: 5,
          }}
        >
          <AdminCard
            padding="16px 20px"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              flexWrap: "wrap",
              backdropFilter: "blur(12px)",
            }}
          >
            <Star size={16} color={tokens.colors.text.muted} />
            <label
              style={{
                color: tokens.colors.text.secondary,
                fontSize: "13px",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              Switch Tournament:
            </label>
            <select
              value={selectedTournament?._id || ""}
              onChange={(event) => {
                const selectedId = event.target.value;
                const foundTournament = tournaments.find((item) => item._id === selectedId) || null;
                if (foundTournament) {
                  setSelectedTournament(foundTournament);
                  localStorage.setItem("admin-selected-tournament", foundTournament._id);
                }
              }}
              style={{
                padding: "10px 16px",
                borderRadius: tokens.radius.md,
                background: tokens.colors.bg.input,
                border: `1px solid ${tokens.colors.border.subtle}`,
                color: tokens.colors.text.primary,
                minWidth: "240px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                outline: "none",
                transition: "all 0.3s ease",
              }}
            >
              {tournaments.map((item) => (
                <option
                  key={item._id}
                  value={item._id}
                  style={{
                    background: tokens.colors.bg.secondary,
                    color: tokens.colors.text.primary,
                  }}
                >
                  {item.name}
                </option>
              ))}
            </select>
          </AdminCard>
        </div>
      )}

      <style>{globalStyles}</style>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

const QuickAction = ({ icon, label, onClick }: QuickActionProps) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      padding: "10px 16px",
      borderRadius: tokens.radius.md,
      background: "rgba(255,255,255,0.03)",
      border: `1px solid ${tokens.colors.border.subtle}`,
      color: tokens.colors.text.secondary,
      fontSize: "13px",
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: "inherit",
      transition: "all 0.2s ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = "rgba(41,121,255,0.1)";
      e.currentTarget.style.borderColor = "rgba(41,121,255,0.3)";
      e.currentTarget.style.color = tokens.colors.accent.blue;
      e.currentTarget.style.transform = "translateY(-2px)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "rgba(255,255,255,0.03)";
      e.currentTarget.style.borderColor = tokens.colors.border.subtle;
      e.currentTarget.style.color = tokens.colors.text.secondary;
      e.currentTarget.style.transform = "translateY(0)";
    }}
  >
    {icon}
    {label}
    <ChevronRight size={13} style={{ opacity: 0.5 }} />
  </button>
);

interface MiniStatProps {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}

const MiniStat = ({ label, value, color, icon }: MiniStatProps) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "10px 14px",
      borderRadius: tokens.radius.md,
      background: "rgba(255,255,255,0.02)",
      border: `1px solid ${tokens.colors.border.subtle}`,
    }}
  >
    <div style={{ color, display: "flex" }}>{icon}</div>
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontSize: "16px",
          fontWeight: 800,
          color: tokens.colors.text.primary,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: "10px",
          color: tokens.colors.text.muted,
          textTransform: "uppercase",
          letterSpacing: "0.8px",
          fontWeight: 700,
          marginTop: "3px",
        }}
      >
        {label}
      </div>
    </div>
  </div>
);

export default AdminDashboard;
