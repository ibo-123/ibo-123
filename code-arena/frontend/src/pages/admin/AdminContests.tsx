import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Trophy,
  Plus,
  RefreshCw,
  Edit3,
  Trash2,
  Send,
  Calendar,
  Clock,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Users,
  X,
  Sparkles,
  Info,
  FileText,
  PlayCircle,
  ClipboardList,
  Search,
  Copy,
  Filter,
  Layers,
  List,
  CheckSquare,
  Square,
  ArrowUpDown,
  Timer,
  TrendingUp,
  CircleDashed,
  CheckCheck,
} from "lucide-react";
import { ErrorState, LoadingState } from "../../components/ui";
import { adminApi, type AdminContest, type ContestPayload } from "../../services/adminApi";
import { useAdmin } from "../../context/AdminContext";

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const STAGE_OPTIONS: Array<{
  value: ContestPayload["stage"];
  label: string;
}> = [
  { value: "QUALIFICATION", label: "Qualification Round" },
  { value: "GROUP_STAGE", label: "Group Stage" },
  { value: "QUARTER_FINAL", label: "Quarter Final" },
  { value: "SEMI_FINAL", label: "Semi Final" },
  { value: "FINAL", label: "Final" },
];

const KNOCKOUT_STAGES: ContestPayload["stage"][] = ["QUARTER_FINAL", "SEMI_FINAL", "FINAL"];

const SUGGESTED_MATCH_COUNT: Partial<Record<ContestPayload["stage"], number>> = {
  QUARTER_FINAL: 4,
  SEMI_FINAL: 2,
  FINAL: 1,
};

const STAGE_ORDER: ContestPayload["stage"][] = [
  "QUALIFICATION",
  "GROUP_STAGE",
  "QUARTER_FINAL",
  "SEMI_FINAL",
  "FINAL",
];

type StatusFilter = "ALL" | "DRAFT" | "PUBLISHED" | "LIVE" | "FINISHED";
type SortKey = "startTime" | "name" | "status" | "stage";
type SortDir = "asc" | "desc";
type ViewLayout = "grid" | "grouped";

const DRAFT_STORAGE_KEY = "code-arena.contest-draft";

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */

const c = {
  bg: {
    card: "rgba(255, 255, 255, 0.02)",
    cardHover: "rgba(255, 255, 255, 0.03)",
    header: "rgba(255, 255, 255, 0.04)",
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

interface ContestFormState {
  name: string;
  invitationUrl: string;
  stage: ContestPayload["stage"];
  group: string;
  matchNumbers: string;
  startTime: string;
  durationMinutes: number;
  description: string;
}

const emptyForm = (): ContestFormState => ({
  name: "",
  invitationUrl: "",
  stage: "GROUP_STAGE",
  group: "",
  matchNumbers: "",
  startTime: "",
  durationMinutes: 180,
  description: "",
});

/** Always returns a string — "" for missing / invalid dates. */
const formatDateTimeLocal = (iso?: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
};

const isValidCodeforcesUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return /(^|\.)codeforces\.com$/i.test(parsed.hostname);
  } catch {
    return false;
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case "LIVE":
      return c.accent.red;
    case "FINISHED":
      return c.accent.green;
    case "PUBLISHED":
    case "UPCOMING":
      return c.accent.blue;
    default:
      return c.text.muted;
  }
};

const canEnterResults = (contest: AdminContest): boolean =>
  contest.published && (contest.status === "FINISHED" || contest.status === "LIVE");

const parseMatchNumbers = (raw: string): number[] =>
  raw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);

const formatMatchNumbers = (nums?: number[] | null): string =>
  Array.isArray(nums) && nums.length ? nums.join(", ") : "";

const getTimeUntil = (target: string): string => {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return "passed";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff / 3600000) % 24);
  const m = Math.floor((diff / 60000) % 60);
  if (d > 0) return `in ${d}d ${h}h`;
  if (h > 0) return `in ${h}h ${m}m`;
  return `in ${m}m`;
};

const getPhase = (contest: AdminContest): "running" | "upcoming" | "finished" => {
  if (contest.status === "LIVE") return "running";
  if (contest.status === "FINISHED") return "finished";
  return "upcoming";
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export const AdminContests = () => {
  const { selectedTournament } = useAdmin();
  const [searchParams, setSearchParams] = useSearchParams();

  const [contests, setContests] = useState<AdminContest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingContest, setEditingContest] = useState<AdminContest | null>(null);
  const [form, setForm] = useState<ContestFormState>(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("startTime");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [layout, setLayout] = useState<ViewLayout>("grid");

  const [selected, setSelected] = useState<Set<string>>(new Set());

  const tournamentId = selectedTournament?._id;

  /* ---- Load ---------------------------------------------------- */
  const loadContests = useCallback(async () => {
    if (!tournamentId) {
      setContests([]);
      setLoading(false);
      return;
    }
    try {
      setError("");
      const res = await adminApi.getContests(tournamentId);
      setContests(res.contests || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contests");
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    setLoading(true);
    loadContests();
  }, [loadContests]);

  /* ---- ?edit=<id> query param ---------------------------------- */
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (!editId || contests.length === 0) return;
    const found = contests.find((x) => x._id === editId);
    if (found) openEditForm(found);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, contests]);

  /* ---- Draft autosave ----------------------------------------- */
  useEffect(() => {
    if (!showForm || editingContest) return;
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(form));
    } catch {
      /* ignore */
    }
  }, [form, showForm, editingContest]);

  /* ---- Handlers ------------------------------------------------ */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadContests();
    setRefreshing(false);
  };

  const openCreateForm = (fromDraft = false) => {
    setEditingContest(null);
    if (fromDraft) {
      try {
        const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (raw) {
          setForm({ ...emptyForm(), ...JSON.parse(raw) });
        } else {
          setForm(emptyForm());
        }
      } catch {
        setForm(emptyForm());
      }
    } else {
      setForm(emptyForm());
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (contest: AdminContest) => {
    setEditingContest(contest);
    setForm({
      name: contest.name,
      invitationUrl: contest.invitationUrl,
      stage: contest.stage as ContestPayload["stage"],
      group: contest.group || "",
      matchNumbers: formatMatchNumbers(contest.matchNumbers),
      startTime: formatDateTimeLocal(contest.startTime), // now string
      durationMinutes: contest.durationSeconds ? Math.round(contest.durationSeconds / 60) : 180,
      description: contest.description || "",
    });
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingContest(null);
    setForm(emptyForm());
    setFormError("");
    if (searchParams.get("edit")) {
      searchParams.delete("edit");
      setSearchParams(searchParams);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tournamentId) return;
    setFormError("");

    if (!form.name.trim()) return setFormError("Contest name is required");
    if (!form.invitationUrl.trim()) return setFormError("Invitation URL is required");
    if (!isValidCodeforcesUrl(form.invitationUrl))
      return setFormError(
        "Invitation URL must be a valid Codeforces link (https://codeforces.com/...)",
      );
    if (!form.startTime) return setFormError("Start time is required");
    if (form.stage === "GROUP_STAGE" && !form.group.trim())
      return setFormError("Group is required for GROUP_STAGE contests");

    const isKnockout = KNOCKOUT_STAGES.includes(form.stage);
    const parsedMatchNumbers = isKnockout ? parseMatchNumbers(form.matchNumbers) : [];

    if (isKnockout && parsedMatchNumbers.length === 0) {
      return setFormError(
        "Enter at least one match number for knockout rounds (e.g. 1,2,3,4 for Quarter Finals)",
      );
    }

    setSubmitting(true);
    try {
      const payload: ContestPayload = {
        name: form.name.trim(),
        invitationUrl: form.invitationUrl.trim(),
        stage: form.stage,
        group: form.stage === "GROUP_STAGE" ? form.group.trim().toUpperCase() : undefined,
        matchNumbers: isKnockout ? parsedMatchNumbers : undefined,
        startTime: new Date(form.startTime).toISOString(),
        durationMinutes: Number(form.durationMinutes) || 180,
        description: form.description.trim() || undefined,
      };

      if (editingContest) {
        await adminApi.updateContest(tournamentId, editingContest._id, payload);
        setNotice("Contest updated successfully");
      } else {
        await adminApi.createContest(tournamentId, payload);
        setNotice("Contest created as draft");
      }

      localStorage.removeItem(DRAFT_STORAGE_KEY);
      closeForm();
      await loadContests();
      window.setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      const axiosErr = err as {
        response?: { data?: { message?: string; errors?: any[] } };
      };
      const msg =
        axiosErr.response?.data?.message ||
        (err instanceof Error ? err.message : "Failed to save contest");
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (contest: AdminContest) => {
    if (!tournamentId) return;
    if (!confirm(`Publish "${contest.name}"? Participants will see the invitation.`)) return;

    setPublishingId(contest._id);
    try {
      await adminApi.publishContest(tournamentId, contest._id);
      setNotice(`Contest "${contest.name}" published`);
      await loadContests();
      window.setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish contest");
    } finally {
      setPublishingId(null);
    }
  };

  const handleDelete = async (contest: AdminContest) => {
    if (!tournamentId) return;
    if (contest.published) {
      alert("Published contests cannot be deleted.");
      return;
    }
    if (!confirm(`Delete draft "${contest.name}"?`)) return;

    setDeletingId(contest._id);
    try {
      await adminApi.deleteContest(tournamentId, contest._id);
      setNotice("Draft deleted");
      await loadContests();
      window.setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete contest");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDuplicate = async (contest: AdminContest) => {
    if (!tournamentId) return;
    if (!confirm(`Duplicate "${contest.name}" as a new draft?`)) return;

    try {
      const payload: ContestPayload = {
        name: `${contest.name} (Copy)`,
        invitationUrl: contest.invitationUrl,
        stage: contest.stage as ContestPayload["stage"],
        group: contest.group || undefined,
        matchNumbers: contest.matchNumbers || undefined,
        startTime: contest.startTime,
        durationMinutes: contest.durationSeconds ? Math.round(contest.durationSeconds / 60) : 180,
        description: contest.description || undefined,
      };
      await adminApi.createContest(tournamentId, payload);
      setNotice("Contest duplicated");
      await loadContests();
      window.setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to duplicate");
    }
  };

  /* ---- Bulk actions ------------------------------------------- */
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const selectAllVisible = () => {
    setSelected(new Set(filteredContests.map((x) => x._id)));
  };

  const handleBulkPublish = async () => {
    if (!tournamentId || selected.size === 0) return;
    if (!confirm(`Publish ${selected.size} contest(s)?`)) return;
    try {
      await Promise.all(
        Array.from(selected).map((id) => adminApi.publishContest(tournamentId, id)),
      );
      setNotice(`${selected.size} contest(s) published`);
      clearSelection();
      await loadContests();
      window.setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk publish failed");
    }
  };

  const handleBulkDelete = async () => {
    if (!tournamentId || selected.size === 0) return;
    const drafts = Array.from(selected).filter((id) => {
      const ct = contests.find((x) => x._id === id);
      return ct && !ct.published;
    });
    if (drafts.length === 0) {
      alert("Only draft contests can be deleted.");
      return;
    }
    if (!confirm(`Delete ${drafts.length} draft(s)?`)) return;
    try {
      await Promise.all(drafts.map((id) => adminApi.deleteContest(tournamentId, id)));
      setNotice(`${drafts.length} draft(s) deleted`);
      clearSelection();
      await loadContests();
      window.setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk delete failed");
    }
  };

  /* ---- Sorting ------------------------------------------------- */
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  /* ---- Derived ------------------------------------------------- */
  const filteredContests = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = contests;

    if (statusFilter !== "ALL") {
      if (statusFilter === "DRAFT") rows = rows.filter((x) => !x.published);
      else if (statusFilter === "PUBLISHED") rows = rows.filter((x) => x.published);
      else rows = rows.filter((x) => x.status === statusFilter);
    }

    if (q) {
      rows = rows.filter(
        (x) =>
          x.name.toLowerCase().includes(q) ||
          x.stage.toLowerCase().includes(q) ||
          (x.group ?? "").toLowerCase().includes(q),
      );
    }

    const sorted = [...rows].sort((a, b) => {
      let av: any = a[sortKey as keyof AdminContest];
      let bv: any = b[sortKey as keyof AdminContest];
      if (sortKey === "startTime") {
        av = a.startTime ? new Date(a.startTime).getTime() : 0;
        bv = b.startTime ? new Date(b.startTime).getTime() : 0;
      }
      if (sortKey === "stage") {
        av = STAGE_ORDER.indexOf(a.stage as ContestPayload["stage"]);
        bv = STAGE_ORDER.indexOf(b.stage as ContestPayload["stage"]);
      }
      const cmp = String(av).localeCompare(String(bv), undefined, {
        numeric: true,
      });
      return sortDir === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [contests, search, statusFilter, sortKey, sortDir]);

  const groupedContests = useMemo(() => {
    const map = new Map<ContestPayload["stage"], AdminContest[]>();
    STAGE_ORDER.forEach((stage) => map.set(stage, []));
    filteredContests.forEach((ct) => {
      const key = (ct.stage as ContestPayload["stage"]) || "GROUP_STAGE";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ct);
    });
    return Array.from(map.entries()).filter(([, list]) => list.length > 0);
  }, [filteredContests]);

  const stats = useMemo(() => {
    const total = contests.length;
    const published = contests.filter((x) => x.published).length;
    const drafts = contests.filter((x) => !x.published).length;
    const live = contests.filter((x) => x.status === "LIVE").length;
    return { total, published, drafts, live };
  }, [contests]);

  const hasDraft = useMemo(() => {
    if (showForm && !editingContest) return false;
    try {
      return !!localStorage.getItem(DRAFT_STORAGE_KEY);
    } catch {
      return false;
    }
  }, [showForm, editingContest]);

  /* ---- Early return ------------------------------------------- */
  if (!selectedTournament) {
    return (
      <ErrorState error="No tournament selected. Please pick a tournament from the sidebar." />
    );
  }

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
                background: "linear-gradient(135deg, #2979FF, #1565C0)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                boxShadow: "0 12px 32px rgba(41, 121, 255, 0.35)",
                flexShrink: 0,
              }}
            >
              <Trophy size={24} />
            </div>
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "4px",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "1.2px",
                    color: "rgba(100, 181, 246, 0.85)",
                  }}
                >
                  Manual Invitation Management
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "2px 8px",
                    borderRadius: "999px",
                    background: "rgba(41, 121, 255, 0.12)",
                    border: "1px solid rgba(41, 121, 255, 0.25)",
                    color: c.accent.blue,
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  <Sparkles size={10} />
                  No CF API
                </span>
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
                Contest Management
              </h1>
              <div
                style={{
                  fontSize: "13px",
                  color: c.text.muted,
                  marginTop: "2px",
                }}
              >
                {selectedTournament.name} · {stats.total} contest
                {stats.total !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              style={secondaryButton}
            >
              <RefreshCw
                size={14}
                style={{
                  animation: refreshing ? "spin 0.9s linear infinite" : "none",
                }}
              />
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
            <button type="button" onClick={() => openCreateForm(false)} style={primaryButton}>
              <Plus size={16} />
              Add Contest
            </button>
          </div>
        </div>
      </div>

      {/* ============ STATS ============ */}
      {!loading && contests.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <StatCard
            icon={<Trophy size={18} />}
            label="Total"
            value={stats.total}
            color={c.accent.blue}
          />
          <StatCard
            icon={<Send size={18} />}
            label="Published"
            value={stats.published}
            color={c.accent.green}
          />
          <StatCard
            icon={<FileText size={18} />}
            label="Drafts"
            value={stats.drafts}
            color={c.accent.orange}
          />
          <StatCard
            icon={<PlayCircle size={18} />}
            label="Live"
            value={stats.live}
            color={c.accent.red}
          />
        </div>
      )}

      {/* ============ DRAFT BANNER ============ */}
      {hasDraft && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            padding: "12px 18px",
            marginBottom: "16px",
            borderRadius: c.radius.md,
            background: "rgba(255,152,0,0.08)",
            border: "1px solid rgba(255,152,0,0.25)",
            color: c.accent.orange,
            fontSize: "13px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Info size={16} />
            <span>You have an unsaved draft.</span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={() => openCreateForm(true)}
              style={{
                ...smallButton,
                background: "rgba(255,152,0,0.15)",
                borderColor: "rgba(255,152,0,0.3)",
                color: c.accent.orange,
              }}
            >
              Resume draft
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(DRAFT_STORAGE_KEY);
                setSearch("");
              }}
              style={smallButton}
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* ============ ALERTS ============ */}
      {error && (
        <div style={alertStyle(c.accent.red, "rgba(239, 83, 80, 0.1)")}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}
      {notice && (
        <div style={alertStyle(c.accent.green, "rgba(76, 175, 80, 0.1)")}>
          <CheckCircle size={18} />
          {notice}
        </div>
      )}

      {/* ============ FILTER BAR ============ */}
      {contests.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            padding: "12px 16px",
            marginBottom: "20px",
            borderRadius: c.radius.md,
            background: c.bg.card,
            border: `1px solid ${c.border.subtle}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 14px",
              borderRadius: c.radius.md,
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${c.border.subtle}`,
              flex: "1 1 240px",
              minWidth: "220px",
            }}
          >
            <Search size={14} color={c.text.muted} />
            <input
              type="text"
              placeholder="Search contests…"
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

          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {(["ALL", "DRAFT", "PUBLISHED", "LIVE", "FINISHED"] as StatusFilter[]).map((s) => (
              <FilterChip
                key={s}
                label={s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                active={statusFilter === s}
                color={
                  s === "LIVE"
                    ? c.accent.red
                    : s === "FINISHED"
                      ? c.accent.green
                      : s === "PUBLISHED"
                        ? c.accent.blue
                        : s === "DRAFT"
                          ? c.accent.orange
                          : c.accent.blue
                }
                onClick={() => setStatusFilter(s)}
              />
            ))}
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 12px",
              borderRadius: c.radius.md,
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${c.border.subtle}`,
              fontSize: "12px",
              color: c.text.muted,
            }}
          >
            <ArrowUpDown size={13} />
            <select
              value={sortKey}
              onChange={(e) => handleSort(e.target.value as SortKey)}
              style={{
                background: "transparent",
                border: "none",
                color: c.text.primary,
                fontSize: "12px",
                fontFamily: "inherit",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="startTime" style={{ background: "#0F1420" }}>
                Start time
              </option>
              <option value="name" style={{ background: "#0F1420" }}>
                Name
              </option>
              <option value="stage" style={{ background: "#0F1420" }}>
                Stage
              </option>
              <option value="status" style={{ background: "#0F1420" }}>
                Status
              </option>
            </select>
          </div>

          <div
            style={{
              display: "inline-flex",
              padding: "3px",
              borderRadius: c.radius.md,
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${c.border.subtle}`,
            }}
          >
            <ToggleBtn
              active={layout === "grid"}
              onClick={() => setLayout("grid")}
              icon={<List size={13} />}
            />
            <ToggleBtn
              active={layout === "grouped"}
              onClick={() => setLayout("grouped")}
              icon={<Layers size={13} />}
            />
          </div>
        </div>
      )}

      {/* ============ BULK ACTIONS BAR ============ */}
      {selected.size > 0 && (
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
            color: c.text.primary,
            fontSize: "13px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <CheckCheck size={16} color={c.accent.blue} />
            <span>
              <strong>{selected.size}</strong> contest
              {selected.size !== 1 ? "s" : ""} selected
            </span>
            <button
              type="button"
              onClick={selectAllVisible}
              style={{ ...smallButton, padding: "5px 10px" }}
            >
              Select all visible
            </button>
            <button
              type="button"
              onClick={clearSelection}
              style={{ ...smallButton, padding: "5px 10px" }}
            >
              Clear
            </button>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={handleBulkPublish}
              style={{
                ...smallButton,
                background: "rgba(76,175,80,0.15)",
                borderColor: "rgba(76,175,80,0.3)",
                color: c.accent.green,
              }}
            >
              <Send size={13} />
              Publish selected
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              style={{
                ...smallButton,
                background: "rgba(239,83,80,0.12)",
                borderColor: "rgba(239,83,80,0.3)",
                color: c.accent.red,
              }}
            >
              <Trash2 size={13} />
              Delete drafts
            </button>
          </div>
        </div>
      )}

      {/* ============ LIST ============ */}
      {loading ? (
        <LoadingState label="Loading contests..." />
      ) : contests.length === 0 ? (
        <EmptyContests onCreate={() => openCreateForm(false)} />
      ) : filteredContests.length === 0 ? (
        <div
          style={{
            padding: "60px 24px",
            textAlign: "center",
            background: c.bg.card,
            borderRadius: c.radius.lg,
            border: `1px dashed ${c.border.mid}`,
          }}
        >
          <Filter size={32} color={c.text.faint} style={{ marginBottom: "12px" }} />
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: c.text.secondary,
              margin: "0 0 6px",
            }}
          >
            No contests match your filters
          </h3>
          <p style={{ fontSize: "13px", color: c.text.muted, margin: 0 }}>
            Try clearing the search or status filter.
          </p>
        </div>
      ) : layout === "grouped" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {groupedContests.map(([stage, list]) => (
            <div key={stage}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "12px",
                  fontSize: "11px",
                  fontWeight: 800,
                  color: c.text.muted,
                  textTransform: "uppercase",
                  letterSpacing: "1.2px",
                }}
              >
                <span>{stage.replace(/_/g, " ")}</span>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.05)",
                    fontSize: "10px",
                  }}
                >
                  {list.length}
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                  gap: "16px",
                }}
              >
                {list.map((contest) => (
                  <ContestCard
                    key={contest._id}
                    contest={contest}
                    publishing={publishingId === contest._id}
                    deleting={deletingId === contest._id}
                    selected={selected.has(contest._id)}
                    onToggleSelect={() => toggleSelect(contest._id)}
                    onEdit={() => openEditForm(contest)}
                    onPublish={() => handlePublish(contest)}
                    onDelete={() => handleDelete(contest)}
                    onDuplicate={() => handleDuplicate(contest)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "16px",
          }}
        >
          {filteredContests.map((contest) => (
            <ContestCard
              key={contest._id}
              contest={contest}
              publishing={publishingId === contest._id}
              deleting={deletingId === contest._id}
              selected={selected.has(contest._id)}
              onToggleSelect={() => toggleSelect(contest._id)}
              onEdit={() => openEditForm(contest)}
              onPublish={() => handlePublish(contest)}
              onDelete={() => handleDelete(contest)}
              onDuplicate={() => handleDuplicate(contest)}
            />
          ))}
        </div>
      )}

      {/* ============ FORM MODAL ============ */}
      {showForm && (
        <ContestFormModal
          form={form}
          setForm={setForm}
          editingContest={editingContest}
          formError={formError}
          submitting={submitting}
          onClose={closeForm}
          onSubmit={handleSubmit}
        />
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes contestPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.25); }
        }
        input:focus, select:focus, textarea:focus {
          border-color: #2979FF !important;
          box-shadow: 0 0 0 3px rgba(41,121,255,0.15) !important;
        }
        input:hover:not(:disabled), select:hover, textarea:hover {
          border-color: rgba(255,255,255,0.16) !important;
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Contest Card                                                        */
/* ------------------------------------------------------------------ */

interface ContestCardProps {
  contest: AdminContest;
  publishing: boolean;
  deleting: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onPublish: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const ContestCard: React.FC<ContestCardProps> = ({
  contest,
  publishing,
  deleting,
  selected,
  onToggleSelect,
  onEdit,
  onPublish,
  onDelete,
  onDuplicate,
}) => {
  const statusColor = getStatusColor(contest.status);
  const isLive = contest.status === "LIVE";
  const showResults = canEnterResults(contest);
  const phase = getPhase(contest);

  const matchNumbers = Array.isArray(contest.matchNumbers) ? contest.matchNumbers : [];
  const matchCount = matchNumbers.length;

  return (
    <article
      style={{
        position: "relative",
        padding: "18px 20px",
        background: selected ? "rgba(41,121,255,0.05)" : c.bg.card,
        border: `1px solid ${
          selected ? "rgba(41,121,255,0.4)" : isLive ? `${c.accent.red}40` : c.border.subtle
        }`,
        borderRadius: c.radius.lg,
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        transition: "transform 0.2s ease, border-color 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        if (!isLive && !selected) {
          e.currentTarget.style.borderColor = `${c.accent.blue}40`;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        if (!isLive && !selected) {
          e.currentTarget.style.borderColor = c.border.subtle;
        }
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "8px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            minWidth: 0,
            flex: 1,
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
            {selected ? <CheckSquare size={16} /> : <Square size={16} />}
          </button>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                display: "flex",
                gap: "6px",
                marginBottom: "8px",
                flexWrap: "wrap",
              }}
            >
              <Chip label={contest.stage.replace(/_/g, " ")} color={c.accent.purple} />
              {contest.group && (
                <Chip
                  label={`Group ${contest.group}`}
                  color={c.accent.blue}
                  icon={<Users size={10} />}
                />
              )}
              {!contest.group && matchCount > 0 && (
                <Chip
                  label={
                    matchCount > 1
                      ? `${matchCount} matches · ${formatMatchNumbers(matchNumbers)}`
                      : `Match ${matchNumbers[0]}`
                  }
                  color={c.accent.orange}
                />
              )}
              {phase === "upcoming" && contest.startTime && (
                <Chip
                  label={getTimeUntil(contest.startTime)}
                  color={c.accent.blue}
                  icon={<Timer size={10} />}
                />
              )}
            </div>
            <h3
              style={{
                margin: 0,
                fontSize: "15px",
                fontWeight: 700,
                color: c.text.primary,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {contest.name}
            </h3>
          </div>
        </div>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 10px",
            borderRadius: "999px",
            background: `${statusColor}1a`,
            border: `1px solid ${statusColor}40`,
            color: statusColor,
            fontSize: "10px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            flexShrink: 0,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: statusColor,
              boxShadow: isLive ? `0 0 6px ${statusColor}` : "none",
              animation: isLive ? "contestPulse 1.5s infinite" : "none",
            }}
          />
          {contest.status}
        </span>
      </div>

      {contest.description && (
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
          {contest.description}
        </p>
      )}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          fontSize: "12px",
          color: c.text.muted,
        }}
      >
        {contest.startTime && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Calendar size={12} />
            {new Date(contest.startTime).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
        {contest.durationSeconds ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Clock size={12} />
            {Math.round(contest.durationSeconds / 60)} min
          </span>
        ) : null}
      </div>

      <a
        href={contest.invitationUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "12px",
          color: c.accent.blue,
          textDecoration: "none",
          padding: "8px 10px",
          borderRadius: c.radius.sm,
          background: "rgba(41,121,255,0.06)",
          border: "1px solid rgba(41,121,255,0.15)",
          overflow: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        <ExternalLink size={12} style={{ flexShrink: 0 }} />
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {contest.invitationUrl}
        </span>
      </a>

      {showResults && (
        <Link
          to={`/admin/contests/${contest._id}/results`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            padding: "10px 14px",
            borderRadius: c.radius.sm,
            background: "linear-gradient(135deg, rgba(255,215,0,0.12), rgba(255,160,0,0.06))",
            border: "1px solid rgba(255,215,0,0.3)",
            color: c.accent.gold,
            fontSize: "12px",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          <ClipboardList size={14} />
          Enter Results
        </Link>
      )}

      <div
        style={{
          display: "flex",
          gap: "8px",
          marginTop: "auto",
          paddingTop: "10px",
          borderTop: `1px solid ${c.border.subtle}`,
        }}
      >
        <button type="button" onClick={onEdit} style={{ ...smallButton, flex: 1 }}>
          <Edit3 size={14} />
          Edit
        </button>

        <button
          type="button"
          onClick={onDuplicate}
          aria-label="Duplicate"
          style={{ ...smallButton, padding: "6px 10px" }}
          title="Duplicate as new draft"
        >
          <Copy size={14} />
        </button>

        {!contest.published && (
          <>
            <button
              type="button"
              onClick={onPublish}
              disabled={publishing}
              style={{
                ...smallButton,
                flex: 1,
                background: "rgba(76,175,80,0.15)",
                borderColor: "rgba(76,175,80,0.3)",
                color: c.accent.green,
                opacity: publishing ? 0.6 : 1,
              }}
            >
              <Send size={14} />
              {publishing ? "Publishing…" : "Publish"}
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              aria-label="Delete draft"
              style={{
                ...smallButton,
                background: "rgba(244,67,54,0.1)",
                borderColor: "rgba(244,67,54,0.2)",
                color: c.accent.red,
                opacity: deleting ? 0.6 : 1,
                padding: "6px 10px",
              }}
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>
    </article>
  );
};

/* ------------------------------------------------------------------ */
/* Contest Form Modal                                                  */
/* ------------------------------------------------------------------ */

interface ContestFormModalProps {
  form: ContestFormState;
  setForm: React.Dispatch<React.SetStateAction<ContestFormState>>;
  editingContest: AdminContest | null;
  formError: string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

const ContestFormModal: React.FC<ContestFormModalProps> = ({
  form,
  setForm,
  editingContest,
  formError,
  submitting,
  onClose,
  onSubmit,
}) => {
  const urlValid = isValidCodeforcesUrl(form.invitationUrl);
  const urlTouched = form.invitationUrl.length > 0;

  return (
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
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "580px",
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
              {editingContest ? "Edit Contest" : "New Contest"}
            </div>
            <h2 style={{ margin: 0, fontSize: "18px", color: "#fff" }}>
              {editingContest ? editingContest.name : "Add Contest"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${c.border.subtle}`,
              borderRadius: "8px",
              color: c.text.muted,
              cursor: "pointer",
              padding: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ padding: "20px 24px" }}>
          {formError && (
            <div
              style={{
                ...alertStyle(c.accent.red, "rgba(239, 83, 80, 0.1)"),
                padding: "10px 14px",
                fontSize: "12px",
              }}
            >
              <AlertCircle size={14} />
              {formError}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <Field label="Contest Name *" htmlFor="contest-name">
              <input
                id="contest-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Quarter Finals — All Matches"
                style={inputBase}
                required
              />
            </Field>

            <Field label="Codeforces Invitation URL *" htmlFor="contest-invitation-url">
              <div style={{ position: "relative" }}>
                <input
                  id="contest-invitation-url"
                  type="url"
                  value={form.invitationUrl}
                  onChange={(e) => setForm({ ...form, invitationUrl: e.target.value })}
                  placeholder="https://codeforces.com/group/.../contest/..."
                  style={{
                    ...inputBase,
                    paddingRight: "42px",
                    borderColor: urlTouched
                      ? urlValid
                        ? "rgba(76,175,80,0.5)"
                        : "rgba(239,83,80,0.5)"
                      : c.border.input,
                  }}
                  required
                />
                {urlTouched && (
                  <span
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: urlValid ? c.accent.green : c.accent.red,
                      display: "flex",
                    }}
                  >
                    {urlValid ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: c.text.faint,
                  marginTop: "4px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Info size={10} />
                {urlTouched && !urlValid
                  ? "Must be a valid codeforces.com URL"
                  : "No Codeforces API validation — basic URL check only"}
              </div>
            </Field>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <Field label="Stage *" htmlFor="contest-stage">
                <select
                  id="contest-stage"
                  value={form.stage}
                  onChange={(e) => {
                    const nextStage = e.target.value as ContestPayload["stage"];
                    const isKnockout = KNOCKOUT_STAGES.includes(nextStage);
                    const suggested = SUGGESTED_MATCH_COUNT[nextStage];

                    setForm((prev) => ({
                      ...prev,
                      stage: nextStage,
                      group: nextStage === "GROUP_STAGE" ? prev.group : "",
                      matchNumbers:
                        isKnockout && !prev.matchNumbers.trim() && suggested
                          ? Array.from({ length: suggested }, (_, i) => i + 1).join(",")
                          : isKnockout
                            ? prev.matchNumbers
                            : "",
                    }));
                  }}
                  style={inputBase}
                >
                  {STAGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} style={{ background: "#0F1420" }}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Field>

              {form.stage === "GROUP_STAGE" ? (
                <Field label="Group *" htmlFor="contest-group">
                  <input
                    id="contest-group"
                    type="text"
                    value={form.group}
                    onChange={(e) => setForm({ ...form, group: e.target.value })}
                    placeholder="e.g., A or 1"
                    style={inputBase}
                  />
                </Field>
              ) : KNOCKOUT_STAGES.includes(form.stage) ? (
                <Field label="Match Numbers *" htmlFor="contest-matches">
                  <input
                    id="contest-matches"
                    type="text"
                    value={form.matchNumbers}
                    onChange={(e) => setForm({ ...form, matchNumbers: e.target.value })}
                    placeholder="e.g., 1,2,3,4"
                    style={inputBase}
                  />
                  <div
                    style={{
                      fontSize: "11px",
                      color: c.text.faint,
                      marginTop: "4px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Info size={10} />
                    One contest per round
                    {SUGGESTED_MATCH_COUNT[form.stage]
                      ? ` (suggested: ${SUGGESTED_MATCH_COUNT[form.stage]})`
                      : ""}
                  </div>
                </Field>
              ) : (
                <div />
              )}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <Field label="Start Date/Time *" htmlFor="contest-start-time">
                <input
                  id="contest-start-time"
                  type="datetime-local"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  style={{ ...inputBase, colorScheme: "dark" }}
                  required
                />
              </Field>
              <Field label="Duration (min) *" htmlFor="contest-duration">
                <input
                  id="contest-duration"
                  type="number"
                  min={1}
                  value={form.durationMinutes}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      durationMinutes: Number(e.target.value),
                    })
                  }
                  style={inputBase}
                  required
                />
              </Field>
            </div>

            <Field label="Description (optional)" htmlFor="contest-description">
              <textarea
                id="contest-description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Any additional info participants should know..."
                style={{
                  ...inputBase,
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
            </Field>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              marginTop: "20px",
              paddingTop: "16px",
              borderTop: `1px solid ${c.border.subtle}`,
            }}
          >
            <button type="button" onClick={onClose} disabled={submitting} style={secondaryButton}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                ...primaryButton,
                opacity: submitting ? 0.6 : 1,
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Saving…" : editingContest ? "Save Changes" : "Create Contest"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */

interface EmptyContestsProps {
  onCreate: () => void;
}

const EmptyContests: React.FC<EmptyContestsProps> = ({ onCreate }) => (
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
      border: `1px dashed ${c.border.mid}`,
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
      <Trophy size={40} />
    </div>
    <h3
      style={{
        fontSize: "20px",
        fontWeight: 700,
        color: c.text.secondary,
        margin: 0,
      }}
    >
      No contests yet
    </h3>
    <p
      style={{
        fontSize: "14px",
        color: c.text.muted,
        margin: 0,
        maxWidth: "440px",
        lineHeight: 1.6,
      }}
    >
      Create your first contest invitation to get started. You can add multiple contests per stage
      and publish them when ready.
    </p>
    <div
      style={{
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
        justifyContent: "center",
        marginTop: "6px",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 12px",
          borderRadius: "999px",
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${c.border.subtle}`,
          fontSize: "12px",
          color: c.text.muted,
        }}
      >
        <Layers size={12} /> Group stage
      </span>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 12px",
          borderRadius: "999px",
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${c.border.subtle}`,
          fontSize: "12px",
          color: c.text.muted,
        }}
      >
        <TrendingUp size={12} /> Knockout rounds
      </span>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 12px",
          borderRadius: "999px",
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${c.border.subtle}`,
          fontSize: "12px",
          color: c.text.muted,
        }}
      >
        <CircleDashed size={12} /> Draft & publish
      </span>
    </div>
    <button type="button" onClick={onCreate} style={{ ...primaryButton, marginTop: "8px" }}>
      <Plus size={16} />
      Create Contest
    </button>
  </div>
);

/* ------------------------------------------------------------------ */
/* Small components                                                    */
/* ------------------------------------------------------------------ */

interface ChipProps {
  label: string;
  color: string;
  icon?: React.ReactNode;
}

const Chip: React.FC<ChipProps> = ({ label, color, icon }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      padding: "3px 9px",
      borderRadius: "6px",
      background: `${color}1a`,
      border: `1px solid ${color}30`,
      color,
      fontSize: "10px",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.4px",
      whiteSpace: "nowrap",
    }}
  >
    {icon}
    {label}
  </span>
);

interface FilterChipProps {
  label: string;
  active: boolean;
  color: string;
  onClick: () => void;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, active, color, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      padding: "6px 14px",
      borderRadius: "999px",
      border: `1px solid ${active ? color : "rgba(255,255,255,0.08)"}`,
      background: active ? `${color}1a` : "rgba(255,255,255,0.03)",
      color: active ? color : "rgba(255,255,255,0.6)",
      fontSize: "12px",
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: "inherit",
    }}
  >
    {label}
  </button>
);

interface ToggleBtnProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}

const ToggleBtn: React.FC<ToggleBtnProps> = ({ active, onClick, icon }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "30px",
      height: "26px",
      borderRadius: c.radius.sm,
      background: active ? "rgba(41,121,255,0.15)" : "transparent",
      border: "none",
      color: active ? c.accent.blue : c.text.muted,
      cursor: "pointer",
    }}
  >
    {icon}
  </button>
);

interface FieldProps {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, htmlFor, children }) => (
  <div>
    <label
      htmlFor={htmlFor}
      style={{
        display: "block",
        fontSize: "12px",
        fontWeight: 600,
        color: c.text.secondary,
        marginBottom: "6px",
      }}
    >
      {label}
    </label>
    {children}
  </div>
);

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => (
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

/* ------------------------------------------------------------------ */
/* Style constants                                                     */
/* ------------------------------------------------------------------ */

const inputBase: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: c.radius.sm,
  background: c.bg.input,
  border: `1px solid ${c.border.input}`,
  color: c.text.primary,
  fontSize: "14px",
  outline: "none",
  transition: "background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const primaryButton: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "10px 18px",
  borderRadius: c.radius.md,
  background: "linear-gradient(135deg, #2979FF, #1565C0)",
  border: "none",
  color: "#fff",
  fontWeight: 700,
  fontSize: "13px",
  cursor: "pointer",
};

const secondaryButton: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  padding: "10px 18px",
  borderRadius: c.radius.md,
  background: "rgba(255, 255, 255, 0.04)",
  border: `1px solid ${c.border.mid}`,
  color: c.text.primary,
  fontWeight: 600,
  fontSize: "13px",
  cursor: "pointer",
};

const smallButton: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "5px",
  padding: "7px 12px",
  borderRadius: c.radius.sm,
  background: "rgba(255,255,255,0.05)",
  border: `1px solid ${c.border.input}`,
  color: c.text.secondary,
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
};

const alertStyle = (color: string, bg: string): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "14px 18px",
  borderRadius: c.radius.md,
  background: bg,
  border: `1px solid ${color}40`,
  color,
  fontSize: "13px",
  marginBottom: "16px",
});

export default AdminContests;
