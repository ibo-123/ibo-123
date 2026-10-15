import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  X,
  Filter,
  Video,
  Copy,
  Play,
  Search,
  SortAsc,
  SortDesc,
  ChevronLeft,
  ChevronRight,
  Keyboard,
  ListChecks,
  PlayCircle,
} from "lucide-react";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui";
import { contestApi } from "../../services/contestApi";
import { adminApi, type AdminContest } from "../../services/adminApi";
import { useAdmin } from "../../context/AdminContext";
import type { VideoStatus } from "../../types";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface VideoWithDetails {
  _id: string;
  contestId: string;
  tournamentId: string;
  videoUrl: string;
  note?: string;
  status: VideoStatus;
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string;
  participantId?:
    | string
    | {
        _id?: string;
        group?: string;
        seed?: number;
        user?: {
          name?: string;
          username?: string;
          codeforcesUsername?: string;
        };
      };
}

type FilterStatus = "ALL" | "PENDING" | "APPROVED" | "REJECTED";
type SortKey = "newest" | "oldest" | "pending-first" | "participant";

const REJECT_PRESETS = [
  "Video not visible / private",
  "Wrong contest or problem",
  "Suspicious / edited",
  "No code or explanation shown",
  "Duplicate submission",
] as const;

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */

const c = {
  bg: {
    card: "rgba(255, 255, 255, 0.02)",
    cardHover: "rgba(255, 255, 255, 0.03)",
    input: "rgba(255, 255, 255, 0.04)",
  },
  border: {
    subtle: "rgba(255, 255, 255, 0.06)",
    mid: "rgba(255, 255, 255, 0.1)",
    input: "rgba(255, 255, 255, 0.08)",
  },
  text: {
    primary: "#ffffff",
    secondary: "rgba(255, 255, 255, 0.7)",
    muted: "rgba(255, 255, 255, 0.5)",
    faint: "rgba(255, 255, 255, 0.3)",
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

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const getParticipantObject = (
  value: VideoWithDetails["participantId"],
): {
  _id?: string;
  group?: string;
  seed?: number;
  user?: { name?: string; username?: string; codeforcesUsername?: string };
} | null => {
  if (!value || typeof value === "string") return null;
  return value;
};

const getStatusTone = (
  status: string,
): { color: string; bg: string; border: string; icon: React.ReactNode } => {
  switch (status) {
    case "APPROVED":
      return {
        color: c.accent.green,
        bg: "rgba(76, 175, 80, 0.12)",
        border: "rgba(76, 175, 80, 0.25)",
        icon: <CheckCircle size={12} />,
      };
    case "REJECTED":
      return {
        color: c.accent.red,
        bg: "rgba(239, 83, 80, 0.12)",
        border: "rgba(239, 83, 80, 0.25)",
        icon: <XCircle size={12} />,
      };
    default:
      return {
        color: c.accent.gold,
        bg: "rgba(255, 215, 0, 0.12)",
        border: "rgba(255, 215, 0, 0.25)",
        icon: <Clock size={12} />,
      };
  }
};

const getYouTubeId = (url: string): string | null => {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/,
  );
  return match ? match[1] : null;
};

const getStreamableId = (url: string): string | null => {
  const match = url.match(/streamable\.com\/([A-Za-z0-9]+)/);
  return match ? match[1] : null;
};

const getDisplayName = (v: VideoWithDetails): string => {
  const p = getParticipantObject(v.participantId);
  return p?.user?.name || p?.user?.username || "Unknown";
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export const AdminVideos = () => {
  const { selectedTournament } = useAdmin();
  const [searchParams, setSearchParams] = useSearchParams();

  const [contests, setContests] = useState<AdminContest[]>([]);
  const [selectedContestId, setSelectedContestId] = useState<string>("");
  const [videos, setVideos] = useState<VideoWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [filter, setFilter] = useState<FilterStatus>("ALL");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("newest");

  const [selectedVideo, setSelectedVideo] = useState<VideoWithDetails | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const [showShortcutPanel, setShowShortcutPanel] = useState(false);

  // ✅ Fix #2: RefObject<HTMLDivElement | null> matches React 19 useRef
  const modalRef = useRef<HTMLDivElement | null>(null);

  const tournamentId = selectedTournament?._id;

  /* ---- Load contests ------------------------------------------- */
  useEffect(() => {
    let mounted = true;
    if (!tournamentId) {
      setContests([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    adminApi
      .getContests(tournamentId)
      .then((res) => {
        if (!mounted) return;
        const list = res.contests || [];
        setContests(list);

        const fromQuery = searchParams.get("contestId");
        const pick =
          (fromQuery && list.find((ct) => ct._id === fromQuery)?._id) ||
          list.find((ct) => ct.status === "FINISHED")?._id ||
          list.find((ct) => ct.published)?._id ||
          list[0]?._id ||
          "";

        setSelectedContestId(pick);
      })
      .catch((err) => {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load contests");
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId]);

  /* ---- Load videos -------------------------------------------- */
  const loadVideos = useCallback(async () => {
    if (!selectedContestId) {
      setVideos([]);
      return;
    }
    try {
      setLoadingVideos(true);
      setError("");
      const res = await contestApi.getVideoSubmissions(selectedContestId);
      setVideos((res.submissions || []) as unknown as VideoWithDetails[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load videos");
    } finally {
      setLoadingVideos(false);
    }
  }, [selectedContestId]);

  useEffect(() => {
    loadVideos();
    setSelectedIds(new Set());
  }, [loadVideos]);

  /* ---- Handlers ------------------------------------------------ */
  const handleContestChange = (id: string) => {
    setSelectedContestId(id);
    if (id) searchParams.set("contestId", id);
    else searchParams.delete("contestId");
    setSearchParams(searchParams);
  };

  const handleApprove = async (submissionId: string) => {
    setSubmitting(true);
    try {
      await contestApi.approveVideo(submissionId);
      setNotice("Video approved");
      setSelectedVideo(null);
      await loadVideos();
      window.setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve video");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (submissionId: string) => {
    setSubmitting(true);
    try {
      await contestApi.rejectVideo(submissionId, rejectReason || "No reason provided");
      setNotice("Video rejected");
      setSelectedVideo(null);
      setShowRejectForm(false);
      setRejectReason("");
      await loadVideos();
      window.setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject video");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  /* ---- Bulk --------------------------------------------------- */
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisiblePending = () => {
    const pending = filteredVideos.filter((v) => v.status === "PENDING").map((v) => v._id);
    setSelectedIds(new Set(pending));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkApprove = async () => {
    const ids = Array.from(selectedIds).filter((id) => {
      const v = videos.find((x) => x._id === id);
      return v?.status === "PENDING";
    });
    if (ids.length === 0) return;
    if (!confirm(`Approve ${ids.length} submission(s)?`)) return;

    setBulkBusy(true);
    try {
      await Promise.all(ids.map((id) => contestApi.approveVideo(id)));
      setNotice(`${ids.length} submission(s) approved`);
      clearSelection();
      await loadVideos();
      window.setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk approve failed");
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkReject = async () => {
    const ids = Array.from(selectedIds).filter((id) => {
      const v = videos.find((x) => x._id === id);
      return v?.status === "PENDING";
    });
    if (ids.length === 0) return;
    const reason = prompt(
      `Reason for rejecting ${ids.length} submission(s)?`,
      "Does not meet requirements",
    );
    if (!reason) return;

    setBulkBusy(true);
    try {
      await Promise.all(ids.map((id) => contestApi.rejectVideo(id, reason)));
      setNotice(`${ids.length} submission(s) rejected`);
      clearSelection();
      await loadVideos();
      window.setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk reject failed");
    } finally {
      setBulkBusy(false);
    }
  };

  /* ---- Keyboard shortcuts ------------------------------------- */
  const goToAdjacent = useCallback(
    (dir: -1 | 1) => {
      if (!selectedVideo) return;
      const idx = filteredVideos.findIndex((v) => v._id === selectedVideo._id);
      if (idx === -1) return;
      const next = filteredVideos[idx + dir];
      if (next) {
        setSelectedVideo(next);
        setShowRejectForm(false);
        setRejectReason("");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedVideo, videos, filter, search, sortKey],
  );

  useEffect(() => {
    if (!selectedVideo) return;

    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      if (e.key === "Escape") {
        setSelectedVideo(null);
        setShowRejectForm(false);
        setRejectReason("");
        return;
      }
      if (typing) return;

      if (e.key === "ArrowLeft") goToAdjacent(-1);
      if (e.key === "ArrowRight") goToAdjacent(1);

      if (!showRejectForm && selectedVideo.status === "PENDING" && !submitting) {
        if (e.key === "a" || e.key === "A") handleApprove(selectedVideo._id);
        if (e.key === "r" || e.key === "R") setShowRejectForm(true);
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVideo, showRejectForm, submitting, goToAdjacent]);

  /* ---- Derived ------------------------------------------------ */
  const statusCounts = useMemo(() => {
    const counts = { ALL: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 };
    for (const v of videos) {
      counts.ALL += 1;
      if (v.status === "PENDING") counts.PENDING += 1;
      else if (v.status === "APPROVED") counts.APPROVED += 1;
      else if (v.status === "REJECTED") counts.REJECTED += 1;
    }
    return counts;
  }, [videos]);

  const filteredVideos = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = videos;

    if (filter !== "ALL") {
      rows = rows.filter((v) => v.status === filter);
    }

    if (q) {
      rows = rows.filter((v) => {
        const p = getParticipantObject(v.participantId);
        const u = p?.user;
        return (
          (u?.name ?? "").toLowerCase().includes(q) ||
          (u?.username ?? "").toLowerCase().includes(q) ||
          (u?.codeforcesUsername ?? "").toLowerCase().includes(q) ||
          (p?.group ?? "").toLowerCase().includes(q)
        );
      });
    }

    const sorted = [...rows].sort((a, b) => {
      if (sortKey === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortKey === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortKey === "pending-first") {
        const rank = (s: string) => (s === "PENDING" ? 0 : s === "APPROVED" ? 1 : 2);
        return rank(a.status) - rank(b.status);
      }
      return getDisplayName(a).localeCompare(getDisplayName(b));
    });

    return sorted;
  }, [videos, filter, search, sortKey]);

  /* ---- Early returns ------------------------------------------ */
  if (!selectedTournament) {
    return <ErrorState error="No tournament selected." />;
  }
  if (loading) return <LoadingState label="Loading contests..." />;

  const currentContest = contests.find((ct) => ct._id === selectedContestId);

  const filterButtons: {
    value: FilterStatus;
    label: string;
    count: number;
    color: string;
  }[] = [
    { value: "ALL", label: "All", count: statusCounts.ALL, color: c.accent.blue },
    {
      value: "PENDING",
      label: "Pending",
      count: statusCounts.PENDING,
      color: c.accent.gold,
    },
    {
      value: "APPROVED",
      label: "Approved",
      count: statusCounts.APPROVED,
      color: c.accent.green,
    },
    {
      value: "REJECTED",
      label: "Rejected",
      count: statusCounts.REJECTED,
      color: c.accent.red,
    },
  ];

  const selectedPending = Array.from(selectedIds).filter((id) => {
    const v = videos.find((x) => x._id === id);
    return v?.status === "PENDING";
  }).length;

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */
  return (
    <div style={{ padding: "24px 0" }}>
      {/* ============ HEADER ============ */}
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
              <Video size={24} />
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
                Video Review
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
                Video Submissions
              </h1>
              <div
                style={{
                  fontSize: "13px",
                  color: c.text.muted,
                  marginTop: "2px",
                }}
              >
                {currentContest?.name ||
                  currentContest?.stage?.replace(/_/g, " ") ||
                  "Select a contest"}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => setShowShortcutPanel((v) => !v)}
              aria-label="Keyboard shortcuts"
              style={secondaryBtn}
              title="Keyboard shortcuts"
            >
              <Keyboard size={14} />
            </button>

            <button
              type="button"
              onClick={loadVideos}
              disabled={loadingVideos}
              style={secondaryBtn}
            >
              <RefreshCw
                size={14}
                style={{
                  animation: loadingVideos ? "spin 0.9s linear infinite" : "none",
                }}
              />
              {loadingVideos ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

        {showShortcutPanel && (
          <div
            style={{
              marginTop: "20px",
              paddingTop: "18px",
              borderTop: `1px solid ${c.border.subtle}`,
              display: "flex",
              gap: "20px",
              flexWrap: "wrap",
              fontSize: "12px",
              color: c.text.muted,
              position: "relative",
              zIndex: 1,
            }}
          >
            <Shortcut label="Approve" keycap="A" />
            <Shortcut label="Reject" keycap="R" />
            <Shortcut label="Previous" keycap="←" />
            <Shortcut label="Next" keycap="→" />
            <Shortcut label="Close" keycap="Esc" />
          </div>
        )}
      </div>

      {/* ============ ALERTS ============ */}
      {error && <Alert tone="error" icon={<AlertCircle size={18} />} text={error} />}
      {notice && <Alert tone="success" icon={<CheckCircle size={18} />} text={notice} />}

      {/* ============ CONTROLS ============ */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: "center",
          padding: "14px 18px",
          marginBottom: "20px",
          background: c.bg.card,
          border: `1px solid ${c.border.subtle}`,
          borderRadius: c.radius.md,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Filter size={14} color={c.text.muted} />
          <select
            value={selectedContestId}
            onChange={(e) => handleContestChange(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: c.radius.sm,
              background: c.bg.input,
              border: `1px solid ${c.border.input}`,
              color: "white",
              fontSize: "13px",
              outline: "none",
              minWidth: "220px",
              fontFamily: "inherit",
            }}
          >
            <option value="" style={{ background: "#1a1f35" }}>
              Select a contest...
            </option>
            {contests.map((ct) => (
              <option key={ct._id} value={ct._id} style={{ background: "#1a1f35" }}>
                {ct.name || ct.stage?.replace(/_/g, " ") || "Untitled Contest"}
                {ct.status ? ` · ${ct.status}` : ""}
                {ct.group ? ` · Group ${ct.group}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "7px 14px",
            borderRadius: c.radius.sm,
            background: c.bg.input,
            border: `1px solid ${c.border.input}`,
            flex: "1 1 200px",
            minWidth: "180px",
          }}
        >
          <Search size={14} color={c.text.muted} />
          <input
            type="text"
            placeholder="Search participant…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: c.text.primary,
              fontSize: "13px",
              fontFamily: "inherit",
              minWidth: 0,
            }}
          />
        </div>

        <button
          type="button"
          onClick={() => {
            const order: SortKey[] = ["newest", "oldest", "pending-first", "participant"];
            const idx = order.indexOf(sortKey);
            setSortKey(order[(idx + 1) % order.length]);
          }}
          style={{ ...secondaryBtn, fontSize: "12px", padding: "8px 12px" }}
          title="Click to change sort"
        >
          {sortKey === "oldest" ? <SortAsc size={13} /> : <SortDesc size={13} />}
          {sortKey === "newest"
            ? "Newest"
            : sortKey === "oldest"
              ? "Oldest"
              : sortKey === "pending-first"
                ? "Pending first"
                : "Participant"}
        </button>
      </div>

      {/* ============ FILTER CHIPS ============ */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          marginBottom: "16px",
          alignItems: "center",
        }}
      >
        {filterButtons.map((fb) => {
          const isActive = filter === fb.value;
          return (
            <button
              key={fb.value}
              type="button"
              onClick={() => setFilter(fb.value)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                borderRadius: "999px",
                background: isActive ? `${fb.color}1a` : "rgba(255,255,255,0.03)",
                border: isActive ? `1px solid ${fb.color}40` : `1px solid ${c.border.subtle}`,
                color: isActive ? fb.color : c.text.muted,
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {fb.label}
              <span
                style={{
                  padding: "1px 7px",
                  borderRadius: "999px",
                  background: isActive ? `${fb.color}25` : "rgba(255,255,255,0.05)",
                  fontSize: "10px",
                  fontWeight: 700,
                }}
              >
                {fb.count}
              </span>
            </button>
          );
        })}
        <span style={{ marginLeft: "auto", fontSize: "12px", color: c.text.muted }}>
          {filteredVideos.length} shown
        </span>
      </div>

      {/* ============ BULK BAR ============ */}
      {selectedIds.size > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            padding: "12px 18px",
            marginBottom: "16px",
            borderRadius: c.radius.md,
            background: "rgba(41,121,255,0.08)",
            border: "1px solid rgba(41,121,255,0.28)",
            fontSize: "13px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <ListChecks size={16} color={c.accent.blue} />
            <span>
              <strong>{selectedIds.size}</strong> selected
              {selectedPending !== selectedIds.size && (
                <span style={{ color: c.text.muted, marginLeft: 6 }}>
                  ({selectedPending} pending)
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={selectAllVisiblePending}
              style={{ ...smallBtn, padding: "5px 10px" }}
            >
              Select all pending
            </button>
            <button
              type="button"
              onClick={clearSelection}
              style={{ ...smallBtn, padding: "5px 10px" }}
            >
              Clear
            </button>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={handleBulkApprove}
              disabled={bulkBusy || selectedPending === 0}
              style={{
                ...smallBtn,
                background: "rgba(76,175,80,0.15)",
                borderColor: "rgba(76,175,80,0.3)",
                color: c.accent.green,
                opacity: bulkBusy || selectedPending === 0 ? 0.5 : 1,
              }}
            >
              <CheckCircle size={13} />
              Approve {selectedPending || ""}
            </button>
            <button
              type="button"
              onClick={handleBulkReject}
              disabled={bulkBusy || selectedPending === 0}
              style={{
                ...smallBtn,
                background: "rgba(239,83,80,0.12)",
                borderColor: "rgba(239,83,80,0.3)",
                color: c.accent.red,
                opacity: bulkBusy || selectedPending === 0 ? 0.5 : 1,
              }}
            >
              <XCircle size={13} />
              Reject {selectedPending || ""}
            </button>
          </div>
        </div>
      )}

      {/* ============ LIST ============ */}
      {loadingVideos ? (
        <LoadingState label="Loading video submissions..." />
      ) : !selectedContestId ? (
        <EmptyState label="Select a contest to view its video submissions." />
      ) : filteredVideos.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 24px",
            gap: "16px",
            textAlign: "center",
            background: c.bg.card,
            borderRadius: c.radius.lg,
            border: `1px dashed ${c.border.input}`,
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "24px",
              background: "rgba(41, 121, 255, 0.06)",
              border: "1px solid rgba(41, 121, 255, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: c.accent.blue,
              marginBottom: "8px",
            }}
          >
            <Video size={40} />
          </div>
          <h3
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: c.text.secondary,
              margin: 0,
            }}
          >
            {search || filter !== "ALL" ? "No matching submissions" : "No submissions yet"}
          </h3>
          <p
            style={{
              fontSize: "14px",
              color: c.text.muted,
              margin: 0,
              maxWidth: "400px",
              lineHeight: 1.6,
            }}
          >
            {search || filter !== "ALL"
              ? "Try clearing the search or switching filter."
              : "Participants haven't submitted videos for this contest."}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "14px",
          }}
        >
          {filteredVideos.map((v) => (
            <VideoCard
              key={v._id}
              video={v}
              selected={selectedIds.has(v._id)}
              onToggleSelect={() => toggleSelect(v._id)}
              onOpen={() => {
                setSelectedVideo(v);
                setShowRejectForm(false);
                setRejectReason("");
              }}
              onCopyUrl={handleCopyUrl}
            />
          ))}
        </div>
      )}

      {/* ============ MODAL ============ */}
      {selectedVideo && (
        <ReviewModal
          video={selectedVideo}
          submitting={submitting}
          showRejectForm={showRejectForm}
          rejectReason={rejectReason}
          copied={copied}
          modalRef={modalRef}
          onSetRejectReason={setRejectReason}
          onShowRejectForm={setShowRejectForm}
          onClose={() => {
            setSelectedVideo(null);
            setShowRejectForm(false);
            setRejectReason("");
          }}
          onApprove={() => handleApprove(selectedVideo._id)}
          onReject={() => handleReject(selectedVideo._id)}
          onCopyUrl={handleCopyUrl}
          onPrev={() => goToAdjacent(-1)}
          onNext={() => goToAdjacent(1)}
        />
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

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

interface VideoCardProps {
  video: VideoWithDetails;
  selected: boolean;
  onToggleSelect: () => void;
  onOpen: () => void;
  onCopyUrl: (url: string) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({
  video,
  selected,
  onToggleSelect,
  onOpen,
  onCopyUrl,
}) => {
  const participant = getParticipantObject(video.participantId);
  const user = participant?.user;
  const tone = getStatusTone(video.status);
  const name = user?.name || user?.username || "Unknown";
  const initial = name.charAt(0).toUpperCase();
  const ytId = getYouTubeId(video.videoUrl);

  return (
    <article
      style={{
        position: "relative",
        padding: "16px 18px",
        background: selected ? "rgba(41,121,255,0.05)" : c.bg.card,
        border: `1px solid ${selected ? "rgba(41,121,255,0.4)" : c.border.subtle}`,
        borderRadius: "14px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        transition: "transform 0.2s ease, border-color 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        if (!selected) {
          e.currentTarget.style.borderColor = `${tone.color}40`;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        if (!selected) {
          e.currentTarget.style.borderColor = c.border.subtle;
        }
      }}
    >
      {ytId && (
        <button
          type="button"
          onClick={onOpen}
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "16 / 9",
            borderRadius: "10px",
            overflow: "hidden",
            background: "#000",
            border: `1px solid ${c.border.subtle}`,
            cursor: "pointer",
            padding: 0,
          }}
          aria-label="Preview video"
        >
          <img
            src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.85,
            }}
          />
          <span
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.35)",
              color: "#fff",
            }}
          >
            <PlayCircle size={42} />
          </span>
        </button>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
        }}
      >
        <button
          type="button"
          onClick={onToggleSelect}
          aria-label={selected ? "Deselect" : "Select"}
          style={{
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
            color: selected ? c.accent.blue : c.text.faint,
            marginTop: "2px",
            flexShrink: 0,
          }}
        >
          {selected ? <CheckCircle size={16} /> : <CircleDashedIcon size={16} />}
        </button>

        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #2979FF, #EAB308)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 800,
            fontSize: "14px",
            flexShrink: 0,
          }}
        >
          {initial}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: c.text.primary,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {name}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: c.text.muted,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginTop: "2px",
              flexWrap: "wrap",
            }}
          >
            <span>@{user?.username || "unknown"}</span>
            {participant?.group && (
              <>
                <span style={{ opacity: 0.4 }}>·</span>
                <span>Group {participant.group}</span>
              </>
            )}
          </div>
        </div>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "3px 10px",
            borderRadius: "999px",
            background: tone.bg,
            border: `1px solid ${tone.border}`,
            color: tone.color,
            fontSize: "10px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            flexShrink: 0,
          }}
        >
          {tone.icon}
          {video.status}
        </span>
      </div>

      {video.note && (
        <p
          style={{
            margin: 0,
            fontSize: "12px",
            color: c.text.muted,
            lineHeight: 1.55,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {video.note}
        </p>
      )}

      <a
        href={video.videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "8px 12px",
          borderRadius: c.radius.sm,
          background: "rgba(41, 121, 255, 0.08)",
          border: "1px solid rgba(41, 121, 255, 0.2)",
          color: c.accent.blue,
          fontSize: "12px",
          fontWeight: 600,
          textDecoration: "none",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        <Play size={12} />
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {video.videoUrl}
        </span>
      </a>

      <div style={{ display: "flex", gap: "6px", marginTop: "auto" }}>
        <button
          type="button"
          onClick={onOpen}
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: "10px",
            background:
              video.status === "PENDING"
                ? "linear-gradient(135deg, #2979FF, #1565C0)"
                : "rgba(255,255,255,0.04)",
            border: video.status === "PENDING" ? "none" : `1px solid ${c.border.input}`,
            color: video.status === "PENDING" ? "#fff" : c.text.secondary,
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {video.status === "PENDING" ? "Review Submission" : "View Details"}
        </button>
        <button
          type="button"
          onClick={() => onCopyUrl(video.videoUrl)}
          aria-label="Copy URL"
          style={{
            padding: "10px 12px",
            borderRadius: "10px",
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${c.border.input}`,
            color: c.text.muted,
            cursor: "pointer",
          }}
        >
          <Copy size={13} />
        </button>
      </div>
    </article>
  );
};

/* ------------------------------------------------------------------ */
/* Review Modal                                                        */
/* ------------------------------------------------------------------ */

interface ReviewModalProps {
  video: VideoWithDetails;
  submitting: boolean;
  showRejectForm: boolean;
  rejectReason: string;
  copied: boolean;
  // ✅ Fix #2: nullable RefObject matches React 18/19 useRef typing
  modalRef: React.RefObject<HTMLDivElement | null>;
  onSetRejectReason: (v: string) => void;
  onShowRejectForm: (v: boolean) => void;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onCopyUrl: (url: string) => void;
  onPrev: () => void;
  onNext: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  video,
  submitting,
  showRejectForm,
  rejectReason,
  copied,
  modalRef,
  onSetRejectReason,
  onShowRejectForm,
  onClose,
  onApprove,
  onReject,
  onCopyUrl,
  onPrev,
  onNext,
}) => {
  const participant = getParticipantObject(video.participantId);
  const user = participant?.user;
  const ytId = getYouTubeId(video.videoUrl);
  const streamableId = getStreamableId(video.videoUrl);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Review video submission"
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
      onClick={onClose}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "620px",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#0F1420",
          borderRadius: "18px",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 24px",
            borderBottom: `1px solid ${c.border.subtle}`,
            position: "sticky",
            top: 0,
            background: "#0F1420",
            zIndex: 1,
          }}
        >
          <div>
            <div
              style={{
                fontSize: "10px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                color: "rgba(100, 181, 246, 0.85)",
                marginBottom: "2px",
              }}
            >
              Review Submission
            </div>
            <h2 style={{ margin: 0, fontSize: "18px", color: "#fff" }}>Video Details</h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              type="button"
              onClick={onPrev}
              aria-label="Previous"
              style={iconBtn}
              title="Previous (←)"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={onNext}
              aria-label="Next"
              style={iconBtn}
              title="Next (→)"
            >
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={iconBtn}
              title="Close (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {ytId && (
            <div
              style={{
                marginBottom: "16px",
                borderRadius: "12px",
                overflow: "hidden",
                aspectRatio: "16 / 9",
                background: "#000",
                border: `1px solid ${c.border.input}`,
              }}
            >
              <iframe
                src={`https://www.youtube.com/embed/${ytId}`}
                title="Video submission"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ width: "100%", height: "100%", border: 0 }}
              />
            </div>
          )}
          {streamableId && !ytId && (
            <div
              style={{
                marginBottom: "16px",
                borderRadius: "12px",
                overflow: "hidden",
                aspectRatio: "16 / 9",
                background: "#000",
                border: `1px solid ${c.border.input}`,
              }}
            >
              <iframe
                src={`https://streamable.com/e/${streamableId}`}
                title="Video submission"
                allowFullScreen
                style={{ width: "100%", height: "100%", border: 0 }}
              />
            </div>
          )}

          <div
            style={{
              padding: "14px 16px",
              borderRadius: c.radius.md,
              background: c.bg.card,
              border: `1px solid ${c.border.subtle}`,
              marginBottom: "14px",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "1px",
                color: c.text.muted,
                marginBottom: "8px",
              }}
            >
              Participant
            </div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#fff" }}>
              {user?.name || user?.username || "Unknown"}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: c.text.muted,
                marginTop: "2px",
              }}
            >
              @{user?.username || "—"}
              {user?.codeforcesUsername && (
                <span style={{ marginLeft: 8 }}>· CF: {user.codeforcesUsername}</span>
              )}
              {participant?.group && (
                <span style={{ marginLeft: 8 }}>· Group {participant.group}</span>
              )}
            </div>
          </div>

          <div style={{ marginBottom: "14px" }}>
            <div
              style={{
                fontSize: "10px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "1px",
                color: c.text.muted,
                marginBottom: "6px",
              }}
            >
              Video URL
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <a
                href={video.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  background: "rgba(41,121,255,0.06)",
                  border: "1px solid rgba(41,121,255,0.15)",
                  borderRadius: "10px",
                  color: c.accent.blue,
                  fontSize: "12px",
                  textDecoration: "none",
                  wordBreak: "break-all",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <ExternalLink size={12} />
                {video.videoUrl}
              </a>
              <button
                type="button"
                onClick={() => onCopyUrl(video.videoUrl)}
                aria-label="Copy URL"
                style={{
                  padding: "0 12px",
                  borderRadius: "10px",
                  background: copied ? "rgba(76, 175, 80, 0.15)" : c.bg.input,
                  border: copied
                    ? "1px solid rgba(76, 175, 80, 0.3)"
                    : `1px solid ${c.border.input}`,
                  color: copied ? c.accent.green : c.text.muted,
                  cursor: "pointer",
                }}
              >
                {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {video.note && (
            <div style={{ marginBottom: "14px" }}>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  color: c.text.muted,
                  marginBottom: "6px",
                }}
              >
                Participant Note
              </div>
              <p
                style={{
                  margin: 0,
                  padding: "10px 12px",
                  background: c.bg.card,
                  border: `1px solid ${c.border.subtle}`,
                  borderRadius: "10px",
                  fontSize: "13px",
                  color: c.text.secondary,
                  lineHeight: 1.6,
                }}
              >
                {video.note}
              </p>
            </div>
          )}

          {video.status === "REJECTED" && video.rejectionReason && (
            <div style={{ marginBottom: "14px" }}>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  color: c.accent.red,
                  marginBottom: "6px",
                }}
              >
                Rejection Reason
              </div>
              <p
                style={{
                  margin: 0,
                  padding: "10px 12px",
                  background: "rgba(239, 83, 80, 0.06)",
                  border: "1px solid rgba(239, 83, 80, 0.2)",
                  borderRadius: "10px",
                  fontSize: "13px",
                  color: c.accent.red,
                }}
              >
                {video.rejectionReason}
              </p>
            </div>
          )}

          {showRejectForm ? (
            <div style={{ marginTop: "8px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  color: c.text.muted,
                  marginBottom: "6px",
                }}
              >
                Rejection Reason
              </label>

              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  flexWrap: "wrap",
                  marginBottom: "8px",
                }}
              >
                {REJECT_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => onSetRejectReason(preset)}
                    style={{
                      padding: "5px 10px",
                      borderRadius: "999px",
                      background: rejectReason === preset ? "rgba(239,83,80,0.15)" : c.bg.input,
                      border:
                        rejectReason === preset
                          ? "1px solid rgba(239,83,80,0.4)"
                          : `1px solid ${c.border.subtle}`,
                      color: rejectReason === preset ? c.accent.red : c.text.muted,
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <textarea
                value={rejectReason}
                onChange={(e) => onSetRejectReason(e.target.value)}
                rows={3}
                placeholder="Or write a custom reason…"
                autoFocus
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  background: c.bg.input,
                  border: `1px solid ${c.border.input}`,
                  color: "white",
                  fontSize: "13px",
                  outline: "none",
                  resize: "vertical",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />

              <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={onReject}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: "11px 16px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #F44336, #C62828)",
                    border: "none",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting ? 0.6 : 1,
                    fontFamily: "inherit",
                  }}
                >
                  {submitting ? "Rejecting…" : "Confirm Rejection"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onShowRejectForm(false);
                    onSetRejectReason("");
                  }}
                  style={{
                    flex: 1,
                    padding: "11px 16px",
                    borderRadius: "10px",
                    background: c.bg.input,
                    border: `1px solid ${c.border.input}`,
                    color: c.text.secondary,
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : video.status === "PENDING" ? (
            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={onApprove}
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: "11px 16px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #22C55E, #2E7D32)",
                  border: "none",
                  color: "white",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.6 : 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  fontFamily: "inherit",
                }}
              >
                <CheckCircle size={16} />
                {submitting ? "Approving…" : "Approve"}
                <Kbd>A</Kbd>
              </button>
              <button
                type="button"
                onClick={() => onShowRejectForm(true)}
                style={{
                  flex: 1,
                  padding: "11px 16px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #F44336, #C62828)",
                  border: "none",
                  color: "white",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  fontFamily: "inherit",
                }}
              >
                <XCircle size={16} />
                Reject
                <Kbd>R</Kbd>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onClose}
              style={{
                marginTop: "8px",
                width: "100%",
                padding: "11px 16px",
                borderRadius: "10px",
                background: c.bg.input,
                border: `1px solid ${c.border.input}`,
                color: c.text.secondary,
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Small UI atoms                                                      */
/* ------------------------------------------------------------------ */

const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd
    style={{
      fontSize: "10px",
      padding: "1px 5px",
      borderRadius: "4px",
      background: "rgba(0,0,0,0.3)",
      marginLeft: "4px",
    }}
  >
    {children}
  </kbd>
);

const Shortcut: React.FC<{ label: string; keycap: string }> = ({ label, keycap }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
    <kbd
      style={{
        padding: "3px 8px",
        borderRadius: "6px",
        background: c.bg.input,
        border: `1px solid ${c.border.input}`,
        fontSize: "11px",
        fontWeight: 700,
        color: c.text.primary,
      }}
    >
      {keycap}
    </kbd>
    <span>{label}</span>
  </span>
);

interface AlertProps {
  tone: "error" | "success";
  icon: React.ReactNode;
  text: string;
}

const Alert: React.FC<AlertProps> = ({ tone, icon, text }) => {
  const color = tone === "error" ? c.accent.red : c.accent.green;
  const bg = tone === "error" ? "rgba(239, 83, 80, 0.1)" : "rgba(76, 175, 80, 0.1)";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "14px 18px",
        borderRadius: c.radius.md,
        background: bg,
        border: `1px solid ${color}40`,
        color,
        marginBottom: "16px",
        fontSize: "13px",
      }}
    >
      {icon}
      {text}
    </div>
  );
};

const CircleDashedIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" strokeDasharray="3 3" />
  </svg>
);

/* ------------------------------------------------------------------ */
/* Button styles                                                       */
/* ------------------------------------------------------------------ */

const secondaryBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  padding: "10px 18px",
  borderRadius: c.radius.md,
  background: c.bg.input,
  border: `1px solid ${c.border.mid}`,
  color: "#fff",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
};

const smallBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  padding: "7px 12px",
  borderRadius: c.radius.sm,
  background: "rgba(255,255,255,0.05)",
  border: `1px solid ${c.border.input}`,
  color: c.text.secondary,
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
};

const iconBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "32px",
  height: "32px",
  borderRadius: c.radius.sm,
  background: c.bg.input,
  border: `1px solid ${c.border.subtle}`,
  color: c.text.muted,
  cursor: "pointer",
};

export default AdminVideos;
