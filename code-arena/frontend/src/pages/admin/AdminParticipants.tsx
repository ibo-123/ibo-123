import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Users,
  Code2,
  RefreshCw,
  Search,
  ArrowUp,
  ArrowDown,
  Crown,
  Star,
  CheckCircle,
  Clock,
  Edit3,
  Save,
  X,
  UserCheck,
  UserX,
  AlertCircle,
  Hourglass,
} from "lucide-react";
import { Badge, Card, EmptyState, ErrorState, LoadingState } from "../../components/ui";
import { adminApi } from "../../services/adminApi";
import { useAdmin } from "../../context/AdminContext";
import type { Participant } from "../../types";

type RegFilter = "all" | "PENDING" | "APPROVED" | "REJECTED";

// ---- Design tokens -----------------------------------------------------

const c = {
  bg: { card: "rgba(255,255,255,0.02)", header: "rgba(255,255,255,0.04)" },
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

const getRegistrationTone = (status?: string) => {
  switch (status) {
    case "APPROVED":
      return {
        color: c.accent.green,
        bg: "rgba(76,175,80,0.12)",
        border: "rgba(76,175,80,0.25)",
        icon: <CheckCircle size={12} />,
      };
    case "REJECTED":
      return {
        color: c.accent.red,
        bg: "rgba(239,83,80,0.12)",
        border: "rgba(239,83,80,0.25)",
        icon: <UserX size={12} />,
      };
    case "PENDING":
      return {
        color: c.accent.gold,
        bg: "rgba(255,215,0,0.12)",
        border: "rgba(255,215,0,0.25)",
        icon: <Hourglass size={12} />,
      };
    default:
      return {
        color: c.text.muted,
        bg: "rgba(255,255,255,0.05)",
        border: "rgba(255,255,255,0.1)",
        icon: <Clock size={12} />,
      };
  }
};

const getStatusTone = (status?: string): "blue" | "gold" | "green" | "red" | "muted" => {
  if (status === "ELIMINATED") return "muted";
  if (status === "CHAMPION") return "gold";
  if (status === "ADVANCED") return "blue";
  if (status === "ACTIVE") return "green";
  return "blue";
};

export const AdminParticipants = () => {
  const { selectedTournament } = useAdmin();
  const tournamentId = selectedTournament?._id;

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [filterReg, setFilterReg] = useState<RegFilter>("PENDING"); // default to pending queue
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Inline edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ group: string; seed: number }>({
    group: "",
    seed: 1,
  });
  const [saving, setSaving] = useState(false);

  // Approve / reject
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Participant | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  // ---- Fetch -----------------------------------------------------------
  const fetchParticipants = useCallback(async () => {
    if (!tournamentId) {
      setParticipants([]);
      setLoading(false);
      return;
    }
    try {
      setError("");
      const { participants: items } = await adminApi.getParticipants(tournamentId);
      setParticipants(items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load participants");
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    setLoading(true);
    fetchParticipants();
  }, [fetchParticipants]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchParticipants();
    setRefreshing(false);
  };

  // ---- Approve / reject ------------------------------------------------
  const handleApprove = async (p: Participant) => {
    if (!tournamentId) return;
    setBusyId(p._id);
    setError("");
    try {
      await adminApi.approveParticipant(tournamentId, p._id);
      setNotice(`${p.user?.name || p.user?.username || "Participant"} approved`);
      await fetchParticipants();
      setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async () => {
    if (!tournamentId || !rejectTarget) return;
    setRejecting(true);
    setError("");
    try {
      await adminApi.rejectParticipant(tournamentId, rejectTarget._id, rejectReason);
      setNotice(`${rejectTarget.user?.name || "Participant"} rejected`);
      setRejectTarget(null);
      setRejectReason("");
      await fetchParticipants();
      setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setRejecting(false);
    }
  };

  // ---- Edit group/seed -------------------------------------------------
  const handleEditStart = (p: Participant) => {
    setEditingId(p._id);
    setEditValues({ group: p.group || "", seed: p.seed || 1 });
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditValues({ group: "", seed: 1 });
  };

  const handleEditSave = async (participantId: string) => {
    if (!tournamentId) return;
    setSaving(true);
    setError("");
    try {
      await adminApi.updateParticipant(tournamentId, participantId, {
        group: editValues.group ? editValues.group.toUpperCase() : undefined,
        seed: editValues.seed,
      });
      await fetchParticipants();
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update participant");
    } finally {
      setSaving(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // ---- Derived ---------------------------------------------------------
  const counts = useMemo(() => {
    const total = participants.length;
    const pending = participants.filter((p) => p.registrationStatus === "PENDING").length;
    const approved = participants.filter((p) => p.registrationStatus === "APPROVED").length;
    const rejected = participants.filter((p) => p.registrationStatus === "REJECTED").length;
    const active = participants.filter((p) => p.status !== "ELIMINATED").length;
    const champion = participants.filter((p) => p.status === "CHAMPION").length;
    return { total, pending, approved, rejected, active, champion };
  }, [participants]);

  const groups = useMemo(
    () => ["all", ...new Set(participants.map((p) => p.group).filter(Boolean))],
    [participants],
  );

  const statuses = useMemo(
    () => ["all", ...new Set(participants.map((p) => p.status).filter(Boolean))],
    [participants],
  );

  const filteredParticipants = useMemo(() => {
    return participants
      .filter((p) => {
        const matchesSearch =
          !searchTerm ||
          p.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.user?.codeforcesUsername?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = filterStatus === "all" || p.status === filterStatus;
        const matchesGroup = filterGroup === "all" || p.group === filterGroup;
        const matchesReg = filterReg === "all" || p.registrationStatus === filterReg;

        return matchesSearch && matchesStatus && matchesGroup && matchesReg;
      })
      .sort((a, b) => {
        let aVal: unknown = a[sortField as keyof Participant];
        let bVal: unknown = b[sortField as keyof Participant];

        if (sortField === "user.name") {
          aVal = a.user?.name || "";
          bVal = b.user?.name || "";
        } else if (sortField === "user.username") {
          aVal = a.user?.username || "";
          bVal = b.user?.username || "";
        } else if (sortField === "user.codeforcesUsername") {
          aVal = a.user?.codeforcesUsername || "";
          bVal = b.user?.codeforcesUsername || "";
        } else if (sortField === "createdAt") {
          aVal = new Date(a.createdAt || 0).getTime();
          bVal = new Date(b.createdAt || 0).getTime();
        }

        if (aVal === undefined || aVal === null) aVal = "";
        if (bVal === undefined || bVal === null) bVal = "";

        if (typeof aVal === "string" || typeof bVal === "string") {
          const strA = String(aVal);
          const strB = String(bVal);
          return sortDirection === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA);
        }
        const numA = Number(aVal) || 0;
        const numB = Number(bVal) || 0;
        return sortDirection === "asc" ? numA - numB : numB - numA;
      });
  }, [participants, searchTerm, filterStatus, filterGroup, filterReg, sortField, sortDirection]);

  if (!selectedTournament) {
    return (
      <div style={{ padding: "40px 0" }}>
        <EmptyState label="No tournament selected. Pick one from the sidebar." />
      </div>
    );
  }

  if (loading) return <LoadingState label="Loading participants directory..." />;
  if (error && !participants.length) return <ErrorState error={error} />;

  const regFilterChips: { value: RegFilter; label: string; count: number; color: string }[] = [
    { value: "all", label: "All", count: counts.total, color: c.accent.blue },
    { value: "PENDING", label: "Pending", count: counts.pending, color: c.accent.gold },
    { value: "APPROVED", label: "Approved", count: counts.approved, color: c.accent.green },
    { value: "REJECTED", label: "Rejected", count: counts.rejected, color: c.accent.red },
  ];

  return (
    <div style={{ padding: "24px 0" }}>
      {/* ---- Header ---- */}
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
                background: "linear-gradient(135deg, #2979FF, #EAB308)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                boxShadow: "0 12px 32px rgba(41, 121, 255, 0.35)",
                flexShrink: 0,
              }}
            >
              <Users size={24} />
            </div>
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "1.2px",
                  color: "rgba(100, 181, 246, 0.85)",
                  marginBottom: "2px",
                }}
              >
                Administrative Management
              </div>
              <h1
                style={{
                  fontSize: "24px",
                  fontWeight: 800,
                  margin: 0,
                  letterSpacing: "-0.01em",
                  background: "linear-gradient(135deg, #FFFFFF, #90CAF9)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Tournament Participants
              </h1>
              <div
                style={{
                  fontSize: "13px",
                  color: c.text.muted,
                  marginTop: "2px",
                }}
              >
                {selectedTournament.name} · {counts.total} registered · {counts.active} active
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
              background: "rgba(255, 255, 255, 0.04)",
              border: `1px solid ${c.border.mid}`,
              color: c.text.primary,
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

      {/* ---- Stat cards ---- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <StatCard
          label="Pending"
          value={counts.pending}
          color={c.accent.gold}
          icon={<Hourglass size={18} />}
        />
        <StatCard
          label="Approved"
          value={counts.approved}
          color={c.accent.green}
          icon={<UserCheck size={18} />}
        />
        <StatCard
          label="Rejected"
          value={counts.rejected}
          color={c.accent.red}
          icon={<UserX size={18} />}
        />
        <StatCard
          label="Champions"
          value={counts.champion}
          color={c.accent.purple}
          icon={<Crown size={18} />}
        />
      </div>

      {/* ---- Alerts ---- */}
      {error && participants.length > 0 && (
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
            fontSize: "13px",
            marginBottom: "16px",
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
            fontSize: "13px",
            marginBottom: "16px",
          }}
        >
          <CheckCircle size={16} />
          {notice}
        </div>
      )}

      {/* ---- Filters ---- */}
      <Card
        style={{
          padding: "16px 20px",
          marginBottom: "20px",
          background: c.bg.card,
          border: `1px solid ${c.border.subtle}`,
          borderRadius: c.radius.md,
        }}
      >
        {/* Registration filter chips */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
            marginBottom: "14px",
            paddingBottom: "14px",
            borderBottom: `1px solid ${c.border.subtle}`,
          }}
        >
          {regFilterChips.map((chip) => {
            const isActive = filterReg === chip.value;
            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => setFilterReg(chip.value)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  borderRadius: "999px",
                  background: isActive ? `${chip.color}1a` : "rgba(255,255,255,0.03)",
                  border: isActive ? `1px solid ${chip.color}40` : `1px solid ${c.border.subtle}`,
                  color: isActive ? chip.color : c.text.muted,
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {chip.label}
                <span
                  style={{
                    padding: "1px 7px",
                    borderRadius: "999px",
                    background: isActive ? `${chip.color}25` : "rgba(255,255,255,0.05)",
                    fontSize: "10px",
                    fontWeight: 700,
                  }}
                >
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Secondary filters */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: c.radius.sm,
              padding: "6px 12px",
              border: `1px solid ${c.border.subtle}`,
              flex: "1",
              minWidth: "180px",
            }}
          >
            <Search size={14} color={c.text.faint} />
            <input
              type="text"
              placeholder="Search participants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                color: "#fff",
                fontSize: "13px",
                outline: "none",
                width: "100%",
              }}
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={selectStyle}
          >
            <option value="all">All Statuses</option>
            {statuses
              .filter((s) => s !== "all")
              .map((status) => (
                <option key={status} value={status} style={{ background: "#1a1f35" }}>
                  {status}
                </option>
              ))}
          </select>

          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            style={selectStyle}
          >
            <option value="all">All Groups</option>
            {groups
              .filter((g) => g !== "all")
              .map((group) => (
                <option key={group} value={group} style={{ background: "#1a1f35" }}>
                  Group {group}
                </option>
              ))}
          </select>

          <div style={{ fontSize: "12px", color: c.text.faint, marginLeft: "auto" }}>
            {filteredParticipants.length} shown
          </div>
        </div>
      </Card>

      {/* ---- Table ---- */}
      <Card
        style={{
          padding: 0,
          background: c.bg.card,
          border: `1px solid ${c.border.subtle}`,
          borderRadius: c.radius.lg,
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${c.border.subtle}`, background: c.bg.header }}>
                {[
                  { key: "user.name", label: "Participant" },
                  { key: "user.codeforcesUsername", label: "Codeforces" },
                  { key: "registrationStatus", label: "Registration" },
                  { key: "group", label: "Group" },
                  { key: "seed", label: "Seed" },
                  { key: "status", label: "Status" },
                  { key: "_actions", label: "Actions" },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => col.key !== "_actions" && handleSort(col.key)}
                    style={{
                      ...thStyle,
                      cursor: col.key === "_actions" ? "default" : "pointer",
                      userSelect: "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      {col.label}
                      {col.key !== "_actions" &&
                        sortField === col.key &&
                        (sortDirection === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredParticipants.length ? (
                filteredParticipants.map((p) => {
                  const isChampion = p.status === "CHAMPION";
                  const isEliminated = p.status === "ELIMINATED";
                  const isTopSeed = p.seed && p.seed <= 3;
                  const isEditing = editingId === p._id;
                  const isPendingReg = p.registrationStatus === "PENDING";
                  const isRejectedReg = p.registrationStatus === "REJECTED";
                  const busy = busyId === p._id;
                  const regTone = getRegistrationTone(p.registrationStatus);

                  return (
                    <tr
                      key={p._id}
                      style={{
                        borderBottom: `1px solid ${c.border.subtle}`,
                        background: isChampion
                          ? "rgba(255,215,0,0.03)"
                          : isPendingReg
                            ? "rgba(255,215,0,0.02)"
                            : isRejectedReg
                              ? "rgba(239,83,80,0.02)"
                              : isEliminated
                                ? "rgba(255,255,255,0.01)"
                                : "transparent",
                      }}
                    >
                      {/* Participant */}
                      <td style={tdStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              background: isChampion
                                ? "linear-gradient(135deg, #FFD700, #FFA000)"
                                : isPendingReg
                                  ? "linear-gradient(135deg, #FFB74D, #F57C00)"
                                  : "linear-gradient(135deg, #2979FF, #EAB308)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "12px",
                              fontWeight: 700,
                              color: isChampion ? "#0a0e1a" : "#fff",
                              flexShrink: 0,
                            }}
                          >
                            {p.user?.name?.charAt(0).toUpperCase() ||
                              p.user?.username?.charAt(0).toUpperCase() ||
                              "U"}
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: "14px",
                                fontWeight: isChampion ? 700 : 500,
                                color: isChampion ? "#FFD700" : "#fff",
                              }}
                            >
                              {p.user?.name || "Unknown"}
                              {isChampion && (
                                <Crown
                                  size={14}
                                  color="#FFD700"
                                  style={{ marginLeft: "6px", display: "inline" }}
                                />
                              )}
                            </div>
                            <div style={{ fontSize: "12px", color: c.text.muted }}>
                              @{p.user?.username || "unknown"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Codeforces */}
                      <td style={{ ...tdStyle, color: c.text.secondary }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Code2 size={14} color={c.text.faint} />
                          {p.user?.codeforcesUsername || "—"}
                        </div>
                      </td>

                      {/* Registration status */}
                      <td style={tdStyle}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "4px 10px",
                            borderRadius: "999px",
                            background: regTone.bg,
                            border: `1px solid ${regTone.border}`,
                            color: regTone.color,
                            fontSize: "11px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.4px",
                          }}
                        >
                          {regTone.icon}
                          {p.registrationStatus || "—"}
                        </span>
                      </td>

                      {/* Group */}
                      <td style={{ ...tdStyle, color: c.text.secondary }}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editValues.group}
                            onChange={(e) =>
                              setEditValues({ ...editValues, group: e.target.value })
                            }
                            placeholder="A"
                            style={inlineInputStyle}
                          />
                        ) : p.group ? (
                          `Group ${p.group}`
                        ) : (
                          <span style={{ color: c.text.faint }}>—</span>
                        )}
                      </td>

                      {/* Seed */}
                      <td
                        style={{
                          ...tdStyle,
                          fontWeight: isTopSeed ? 700 : 400,
                          color: isTopSeed ? c.accent.gold : c.text.secondary,
                        }}
                      >
                        {isEditing ? (
                          <input
                            type="number"
                            min={1}
                            value={editValues.seed}
                            onChange={(e) =>
                              setEditValues({ ...editValues, seed: Number(e.target.value) })
                            }
                            style={inlineInputStyle}
                          />
                        ) : p.seed ? (
                          <>
                            #{p.seed}
                            {isTopSeed && (
                              <Star
                                size={12}
                                color="#FFD700"
                                style={{ marginLeft: "4px", display: "inline" }}
                              />
                            )}
                          </>
                        ) : (
                          <span style={{ color: c.text.faint }}>—</span>
                        )}
                      </td>

                      {/* Tournament status */}
                      <td style={tdStyle}>
                        <Badge tone={getStatusTone(p.status)}>{p.status || "ACTIVE"}</Badge>
                      </td>

                      {/* Actions */}
                      <td style={tdStyle}>
                        {isEditing ? (
                          <div style={{ display: "flex", gap: "4px" }}>
                            <button
                              type="button"
                              onClick={() => handleEditSave(p._id)}
                              disabled={saving}
                              style={actionBtn(c.accent.green, saving)}
                            >
                              <Save size={12} />
                              {saving ? "…" : "Save"}
                            </button>
                            <button
                              type="button"
                              onClick={handleEditCancel}
                              style={actionBtn(c.text.muted)}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : isPendingReg ? (
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            <button
                              type="button"
                              onClick={() => handleApprove(p)}
                              disabled={busy}
                              style={actionBtn(c.accent.green, busy)}
                            >
                              <UserCheck size={12} />
                              {busy ? "Approving…" : "Approve"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectTarget(p)}
                              disabled={busy}
                              style={actionBtn(c.accent.red, busy)}
                            >
                              <UserX size={12} />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleEditStart(p)}
                            style={actionBtn(c.accent.blue)}
                          >
                            <Edit3 size={12} />
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7}>
                    <div style={{ padding: "40px" }}>
                      <EmptyState
                        label={
                          filterReg === "PENDING" && counts.pending === 0
                            ? "No pending registrations — you're all caught up!"
                            : searchTerm || filterStatus !== "all" || filterGroup !== "all"
                              ? "No participants match your filters"
                              : "No participants in this category yet."
                        }
                      />
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ---- Reject modal ---- */}
      {rejectTarget && (
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
          onClick={() => {
            setRejectTarget(null);
            setRejectReason("");
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "440px",
              background: "#0F1420",
              borderRadius: c.radius.lg,
              border: `1px solid ${c.border.subtle}`,
              padding: "24px",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: c.radius.sm,
                  background: "rgba(239, 83, 80, 0.12)",
                  border: "1px solid rgba(239, 83, 80, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: c.accent.red,
                }}
              >
                <UserX size={18} />
              </div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#fff" }}>
                  Reject Registration
                </div>
                <div style={{ fontSize: "12px", color: c.text.muted }}>
                  {rejectTarget.user?.name || rejectTarget.user?.username}
                </div>
              </div>
            </div>

            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: c.text.secondary,
                marginBottom: "6px",
              }}
            >
              Reason (optional)
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Explain why this registration is being rejected..."
              autoFocus
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: c.radius.sm,
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${c.border.mid}`,
                color: "#fff",
                fontSize: "13px",
                outline: "none",
                resize: "vertical",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />

            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button
                type="button"
                onClick={handleReject}
                disabled={rejecting}
                style={{
                  flex: 1,
                  padding: "11px 16px",
                  borderRadius: c.radius.md,
                  background: "linear-gradient(135deg, #EF5350, #C62828)",
                  border: "none",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: rejecting ? "wait" : "pointer",
                  opacity: rejecting ? 0.6 : 1,
                }}
              >
                {rejecting ? "Rejecting…" : "Confirm Rejection"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setRejectTarget(null);
                  setRejectReason("");
                }}
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

// ---- Small helpers ----------------------------------------------------

interface StatCardProps {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color, icon }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "14px 16px",
      borderRadius: c.radius.md,
      background: c.bg.card,
      border: `1px solid ${c.border.subtle}`,
      transition: "transform 0.2s ease, border-color 0.2s ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.borderColor = `${color}40`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.borderColor = c.border.subtle;
    }}
  >
    <div
      style={{
        width: "38px",
        height: "38px",
        borderRadius: c.radius.sm,
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
          color: c.text.muted,
          marginBottom: "2px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "20px",
          fontWeight: 800,
          color: c.text.primary,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
    </div>
  </div>
);

// ---- Style constants --------------------------------------------------

const thStyle: React.CSSProperties = {
  padding: "12px 16px",
  textAlign: "left",
  color: c.text.faint,
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 16px",
  color: c.text.secondary,
  verticalAlign: "middle",
};

const inlineInputStyle: React.CSSProperties = {
  width: "80px",
  padding: "4px 8px",
  borderRadius: "6px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(41,121,255,0.4)",
  color: "#fff",
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  padding: "7px 12px",
  borderRadius: c.radius.sm,
  background: "rgba(255,255,255,0.05)",
  border: `1px solid ${c.border.subtle}`,
  color: "#fff",
  fontSize: "13px",
  outline: "none",
  cursor: "pointer",
};

const actionBtn = (color: string, disabled = false): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  padding: "5px 10px",
  borderRadius: "6px",
  background: `${color}1a`,
  border: `1px solid ${color}40`,
  color,
  fontSize: "11px",
  fontWeight: 700,
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.5 : 1,
  whiteSpace: "nowrap",
});

export default AdminParticipants;
