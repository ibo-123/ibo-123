import { useEffect, useState, useCallback } from "react";
import {
  Code2,
  Trophy,
  Flame,
  RefreshCw,
  AlertCircle,
  Loader2,
  TrendingUp,
  Target,
  Clock,
  Zap,
  BarChart3,
  Calendar,
  Sparkles,
  Crown,
  Medal,
} from "lucide-react";
import { getDashboard } from "../services/dashboardService";
import { getRatingHistory } from "../services/codeforcesService";
import { getRecentSubmissions } from "../services/submissionService";
import { getProblemDistribution } from "../services/analyticsService";
import RecentActivity from "../components/dashboard/RecentActivity";
import ProgressCard from "../components/dashboard/ProgressCard";
import RatingChart from "../components/dashboard/RatingChart";
import { toast } from "sonner";

// ── Static color maps so Tailwind can detect classes ──────────────────────
const KPI_COLORS = {
  blue: {
    bg: "from-blue-500/10 via-blue-500/5 to-transparent dark:from-blue-500/15 dark:via-blue-500/5",
    border: "border-blue-300/60 dark:border-blue-500/30",
    iconBg: "bg-blue-500/15 dark:bg-blue-500/20 ring-1 ring-blue-400/30",
    iconText: "text-blue-600 dark:text-blue-300",
    glow: "bg-blue-500/10 dark:bg-blue-500/20",
  },
  purple: {
    bg: "from-purple-500/10 via-purple-500/5 to-transparent dark:from-purple-500/15 dark:via-purple-500/5",
    border: "border-purple-300/60 dark:border-purple-500/30",
    iconBg: "bg-purple-500/15 dark:bg-purple-500/20 ring-1 ring-purple-400/30",
    iconText: "text-purple-600 dark:text-purple-300",
    glow: "bg-purple-500/10 dark:bg-purple-500/20",
  },
  emerald: {
    bg: "from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-500/15 dark:via-emerald-500/5",
    border: "border-emerald-300/60 dark:border-emerald-500/30",
    iconBg: "bg-emerald-500/15 dark:bg-emerald-500/20 ring-1 ring-emerald-400/30",
    iconText: "text-emerald-600 dark:text-emerald-300",
    glow: "bg-emerald-500/10 dark:bg-emerald-500/20",
  },
  amber: {
    bg: "from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/15 dark:via-amber-500/5",
    border: "border-amber-300/60 dark:border-amber-500/30",
    iconBg: "bg-amber-500/15 dark:bg-amber-500/20 ring-1 ring-amber-400/30",
    iconText: "text-amber-600 dark:text-amber-300",
    glow: "bg-amber-500/10 dark:bg-amber-500/20",
  },
};

const getRatingColor = (r) => {
  if (typeof r !== "number") return "text-slate-500 dark:text-slate-400";
  if (r >= 2400) return "text-red-500 dark:text-red-400";
  if (r >= 2100) return "text-orange-500 dark:text-orange-400";
  if (r >= 1900) return "text-fuchsia-500 dark:text-fuchsia-400";
  if (r >= 1600) return "text-blue-500 dark:text-blue-400";
  if (r >= 1400) return "text-cyan-500 dark:text-cyan-400";
  if (r >= 1200) return "text-emerald-500 dark:text-emerald-400";
  return "text-slate-500 dark:text-slate-400";
};

const getRatingGlow = (r) => {
  if (typeof r !== "number") return "shadow-slate-500/10";
  if (r >= 2400) return "shadow-red-500/20 dark:shadow-red-500/30";
  if (r >= 2100) return "shadow-orange-500/20 dark:shadow-orange-500/30";
  if (r >= 1900) return "shadow-fuchsia-500/20 dark:shadow-fuchsia-500/30";
  if (r >= 1600) return "shadow-blue-500/20 dark:shadow-blue-500/30";
  if (r >= 1400) return "shadow-cyan-500/20 dark:shadow-cyan-500/30";
  if (r >= 1200) return "shadow-emerald-500/20 dark:shadow-emerald-500/30";
  return "shadow-slate-500/10";
};

const mapSubmissionToActivity = (sub) => ({
  id: sub._id || sub.submissionId,
  type: sub.verdict === "OK" ? "PROBLEM_SOLVED" : "PROBLEM_SOLVED",
  title:
    sub.verdict === "OK"
      ? `Solved ${sub.problemIndex} — ${sub.problemName}`
      : `Attempted ${sub.problemIndex} — ${sub.problemName}`,
  time: sub.creationTimeSeconds
    ? new Date(sub.creationTimeSeconds * 1000).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "—",
  label: sub.verdict === "OK" ? "Accepted" : sub.verdict || "Attempted",
  verdict: sub.verdict,
  rating: sub.rating ?? null,
  language: sub.language ?? null,
});

const mapTagsToProgress = (tagDist) => {
  if (!tagDist || Object.keys(tagDist).length === 0) return [];
  const COLORS = ["blue", "purple", "emerald", "amber", "rose", "sky", "cyan", "indigo"];
  return Object.entries(tagDist)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([tag, count], i) => ({
      name: tag.charAt(0).toUpperCase() + tag.slice(1),
      value: count,
      rawCount: count,
      color: COLORS[i % COLORS.length],
    }));
};

function Dashboard({
  userId,
  autoRefresh = false,
  refreshInterval = 300000,
  onError,
  onLoad,
  className = "",
}) {
  const [dashboard, setDashboard] = useState(null);
  const [history, setHistory] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [tagProgress, setTagProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const loadDashboard = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");

      try {
        const dashboardData = await getDashboard(userId);
        setDashboard(dashboardData);
        setLastUpdated(new Date());
        onLoad?.(dashboardData);

        if (dashboardData?.user?.codeforcesHandle) {
          const [ratingResult, submissionsResult, distributionResult] =
            await Promise.allSettled([
              getRatingHistory(dashboardData.user.codeforcesHandle),
              getRecentSubmissions(15),
              getProblemDistribution(),
            ]);

          if (ratingResult.status === "fulfilled") {
            setHistory(ratingResult.value?.history || []);
          }

          if (
            submissionsResult.status === "fulfilled" &&
            Array.isArray(submissionsResult.value) &&
            submissionsResult.value.length > 0
          ) {
            setRecentActivities(submissionsResult.value.map(mapSubmissionToActivity));
          } else {
            setRecentActivities([]);
          }

          if (
            distributionResult.status === "fulfilled" &&
            distributionResult.value?.tags
          ) {
            setTagProgress(mapTagsToProgress(distributionResult.value.tags));
          } else {
            setTagProgress([]);
          }
        }

        setRetryCount(0);
      } catch (err) {
        console.error("Dashboard Error:", err);
        const errorMessage =
          err.response?.status === 401
            ? "Your session has expired. Please log in again."
            : err.response?.status === 404
            ? "Dashboard data not found."
            : err.response?.status === 429
            ? "Too many requests. Please try again later."
            : err.message || "Unable to load dashboard.";
        setError(errorMessage);
        setRetryCount((prev) => prev + 1);
        onError?.(err);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId, onError, onLoad]
  );

  useEffect(() => {
    loadDashboard();
    if (autoRefresh && refreshInterval > 0) {
      const id = setInterval(() => loadDashboard(true), refreshInterval);
      return () => clearInterval(id);
    }
  }, [loadDashboard, autoRefresh, refreshInterval]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "r") {
        e.preventDefault();
        handleRefresh();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleRefresh = () => {
    loadDashboard(true);
    toast.info("Refreshing dashboard…");
  };

  const handleRetry = () => {
    if (retryCount >= 3) {
      toast.error("Please wait a moment before trying again.");
      return;
    }
    loadDashboard();
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`flex flex-col justify-center items-center min-h-[400px] ${className}`}>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-blue-500/30 blur-3xl rounded-full animate-pulse" />
          <Loader2 className="w-16 h-16 text-purple-500 dark:text-purple-400 animate-spin relative" />
        </div>
        <div className="mt-6 text-center">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
            Loading Dashboard
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 animate-pulse">
            Fetching your latest data…
          </p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className={`flex justify-center items-center min-h-[400px] ${className}`}>
        <div className="text-center max-w-md">
          <div className="p-5 bg-red-500/10 rounded-2xl inline-block mb-5 ring-1 ring-red-500/30">
            <AlertCircle className="w-14 h-14 text-red-500 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-red-500 dark:text-red-400">{error}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            {retryCount >= 3
              ? "Multiple retry attempts failed. Please try again later."
              : "Please try reloading the page or contact support if the issue persists."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={handleRetry}
              disabled={retryCount >= 3}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {retryCount >= 3 ? "Too Many Attempts" : "Retry"}
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-all duration-300"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── No data ──────────────────────────────────────────────────────────────
  if (!dashboard) {
    return (
      <div className={`flex justify-center items-center min-h-[400px] ${className}`}>
        <div className="text-center">
          <div className="p-5 bg-slate-100 dark:bg-slate-800/50 rounded-2xl inline-block mb-5 ring-1 ring-slate-200 dark:ring-white/5">
            <BarChart3 className="w-14 h-14 text-slate-400 dark:text-slate-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300">
            No Dashboard Data Available
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
            Connect your Codeforces account to start tracking your progress.
          </p>
          <button className="mt-5 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300">
            Connect Account
          </button>
        </div>
      </div>
    );
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const problemsSolved = dashboard?.problemsSolved ?? 0;
  const easySolved = dashboard?.easySolved ?? 0;
  const mediumSolved = dashboard?.mediumSolved ?? 0;
  const hardSolved = dashboard?.hardSolved ?? 0;
  const currentStreak = dashboard?.currentStreak ?? 0;
  const longestStreak = dashboard?.longestStreak ?? 0;
  const lastSyncedAt = dashboard?.lastSyncedAt ?? null;

  const rating = dashboard?.codeforces?.rating ?? "N/A";
  const maxRating = dashboard?.codeforces?.maxRating ?? null;
  const rank = dashboard?.codeforces?.rank ?? "N/A";
  const contribution = dashboard?.codeforces?.contribution ?? 0;
  const handle = dashboard?.user?.codeforcesHandle ?? "";

  const difficultyProgress =
    easySolved + mediumSolved + hardSolved > 0
      ? [
          { name: "Easy (≤ 1200)", value: easySolved, rawCount: easySolved, color: "emerald" },
          { name: "Medium (1201–1800)", value: mediumSolved, rawCount: mediumSolved, color: "amber" },
          { name: "Hard (> 1800)", value: hardSolved, rawCount: hardSolved, color: "rose" },
        ]
      : [];

  const progressData = tagProgress.length > 0 ? tagProgress : difficultyProgress;

  const kpiStats = [
    {
      icon: Target,
      label: "Problems",
      value: problemsSolved,
      sub:
        easySolved + mediumSolved + hardSolved > 0
          ? `${easySolved}E · ${mediumSolved}M · ${hardSolved}H`
          : "Codeforces",
      color: "blue",
    },
    {
      icon: Crown,
      label: "Rating",
      value: typeof rating === "number" ? rating : "—",
      sub: maxRating ? `Max ${maxRating}` : rank,
      color: "purple",
    },
    {
      icon: Medal,
      label: "Rank",
      value: rank !== "N/A" ? rank : "—",
      sub: "Codeforces",
      color: "emerald",
    },
    {
      icon: Zap,
      label: "Streak",
      value: `${currentStreak}d`,
      sub: longestStreak > 0 ? `Best ${longestStreak}d` : "Start solving!",
      color: "amber",
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-purple-500/20 bg-gradient-to-br from-white via-purple-50 to-white dark:from-slate-900 dark:via-[#1a1035] dark:to-slate-900 shadow-xl shadow-purple-500/5 dark:shadow-2xl dark:shadow-purple-950/30">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-purple-400/20 dark:bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-400/15 dark:bg-blue-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-fuchsia-400/10 dark:bg-fuchsia-500/10 rounded-full blur-3xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                Welcome back, {dashboard?.user?.name || "User"}
              </h1>
              <span className="text-3xl animate-bounce-slow">👋</span>
            </div>

            <div className="flex items-center gap-2.5 mt-3 flex-wrap">
              {handle && (
                <span className="font-mono text-xs text-orange-600 dark:text-orange-300 bg-orange-500/10 border border-orange-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
                  <Code2 className="w-3.5 h-3.5" />
                  {handle}
                </span>
              )}
              {rank !== "N/A" && (
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-sm ${getRatingColor(
                    rating
                  )}`}
                >
                  {rank}
                </span>
              )}
              {typeof rating === "number" && (
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-sm ${getRatingColor(
                    rating
                  )}`}
                >
                  {rating} rating
                </span>
              )}
            </div>

            {currentStreak > 0 && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-full border border-orange-500/30 backdrop-blur-sm">
                <Flame className="w-4 h-4 text-orange-500 dark:text-orange-400 animate-pulse" />
                <span className="text-sm font-medium text-orange-700 dark:text-orange-200">
                  {currentStreak}-day streak 🔥
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all duration-300 disabled:opacity-50 backdrop-blur-sm border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10"
              title="Refresh dashboard (Ctrl+R)"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            {lastSyncedAt && (
              <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2.5 py-1.5 rounded-full flex items-center gap-1 backdrop-blur-sm">
                <Clock className="w-3 h-3" />
                Synced {new Date(lastSyncedAt).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick KPI row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiStats.map((stat, index) => {
          const scheme = KPI_COLORS[stat.color] || KPI_COLORS.blue;
          return (
            <div
              key={index}
              className={`group relative overflow-hidden rounded-xl bg-white dark:bg-slate-900/80 bg-gradient-to-br ${scheme.bg} border ${scheme.border} p-4 hover:scale-[1.02] hover:shadow-lg transition-all duration-300 cursor-default backdrop-blur-sm`}
            >
              <div
                className={`absolute -top-10 -right-10 w-24 h-24 ${scheme.glow} rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`}
              />
              <div className="relative flex items-center gap-3">
                <div className={`p-2 rounded-lg ${scheme.iconBg} flex-shrink-0`}>
                  <stat.icon className={`w-5 h-5 ${scheme.iconText}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                    {stat.label}
                  </p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white truncate leading-tight">
                    {stat.value}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-500 truncate">
                    {stat.sub}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Main stat cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Problems Solved */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 border border-slate-200 dark:border-purple-500/20 p-6 hover:border-purple-400 dark:hover:border-purple-500/40 hover:shadow-2xl hover:shadow-purple-500/10 dark:hover:shadow-purple-950/40 transition-all duration-500">
          <div className="absolute -top-16 -right-16 w-40 h-40 bg-purple-500/15 rounded-full blur-3xl group-hover:bg-purple-500/25 transition-all duration-500" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-purple-500/20 ring-1 ring-purple-400/30">
                <Code2 className="w-6 h-6 text-purple-600 dark:text-purple-300" />
              </div>
              {easySolved + mediumSolved + hardSolved > 0 && (
                <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-white/5 px-2 py-1 rounded-full font-mono">
                  <span className="text-emerald-600 dark:text-emerald-400">{easySolved}E</span>
                  <span className="mx-1 text-slate-400 dark:text-slate-600">·</span>
                  <span className="text-amber-600 dark:text-amber-400">{mediumSolved}M</span>
                  <span className="mx-1 text-slate-400 dark:text-slate-600">·</span>
                  <span className="text-rose-600 dark:text-rose-400">{hardSolved}H</span>
                </span>
              )}
            </div>
            <h3 className="text-xs text-slate-500 dark:text-slate-400 mt-4 uppercase tracking-wider font-medium">
              Problems Solved
            </h3>
            <p className="text-4xl font-bold text-slate-900 dark:text-white mt-1 tracking-tight">
              {problemsSolved}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
              Codeforces accepted
            </p>
          </div>
        </div>

        {/* Rating */}
        <div
          className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 border p-6 hover:shadow-2xl transition-all duration-500 border-slate-200 dark:border-blue-500/20 hover:border-blue-400 dark:hover:border-blue-500/40 ${getRatingGlow(
            rating
          )}`}
        >
          <div className="absolute -top-16 -right-16 w-40 h-40 bg-blue-500/15 rounded-full blur-3xl group-hover:bg-blue-500/25 transition-all duration-500" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-blue-500/20 ring-1 ring-blue-400/30">
                <Trophy className="w-6 h-6 text-blue-600 dark:text-blue-300" />
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-white/5 px-2 py-1 rounded-full font-mono max-w-[120px] truncate">
                {handle || "Not connected"}
              </span>
            </div>
            <h3 className="text-xs text-slate-500 dark:text-slate-400 mt-4 uppercase tracking-wider font-medium">
              Codeforces Rating
            </h3>
            <p className={`text-4xl font-bold mt-1 tracking-tight ${getRatingColor(rating)}`}>
              {typeof rating === "number" ? rating : "—"}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {maxRating && (
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  Max <span className="text-slate-700 dark:text-slate-300 font-medium">{maxRating}</span>
                </p>
              )}
              {rank !== "N/A" && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-600" />
                  <p className={`text-xs font-medium ${getRatingColor(rating)}`}>{rank}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Streak */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 border border-slate-200 dark:border-amber-500/20 p-6 hover:border-amber-400 dark:hover:border-amber-500/40 hover:shadow-2xl hover:shadow-amber-500/10 dark:hover:shadow-amber-950/40 transition-all duration-500">
          <div className="absolute -top-16 -right-16 w-40 h-40 bg-amber-500/15 rounded-full blur-3xl group-hover:bg-amber-500/25 transition-all duration-500" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-amber-500/20 ring-1 ring-amber-400/30">
                <Flame className="w-6 h-6 text-amber-600 dark:text-amber-300" />
              </div>
              {currentStreak > 0 && (
                <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400 animate-pulse" />
              )}
            </div>
            <h3 className="text-xs text-slate-500 dark:text-slate-400 mt-4 uppercase tracking-wider font-medium">
              Current Streak
            </h3>
            <p className="text-4xl font-bold text-slate-900 dark:text-white mt-1 tracking-tight">
              {currentStreak > 0 ? `${currentStreak}` : "0"}
              <span className="text-lg text-slate-500 dark:text-slate-400 font-medium ml-1">
                days
              </span>
            </p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-slate-500 dark:text-slate-500">
                Best{" "}
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {longestStreak > 0 ? `${longestStreak} days` : "—"}
                </span>
              </p>
              {contribution > 0 && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-600" />
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    +{contribution} contribution
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Rating Chart ──────────────────────────────────────────────── */}
      {history.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 border border-slate-200 dark:border-purple-500/20 p-6 shadow-lg shadow-purple-500/5 dark:shadow-2xl dark:shadow-purple-950/20">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-purple-500/10 dark:bg-purple-600/10 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20 ring-1 ring-purple-400/30">
                  <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Rating History
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Your competitive journey
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {history.length} contests
                </span>
                <span className="w-px h-4 bg-slate-300 dark:bg-slate-700" />
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Last{" "}
                  {new Date(
                    history[history.length - 1]?.ratingUpdateTimeSeconds * 1000
                  ).toLocaleDateString()}
                </span>
              </div>
            </div>
            <RatingChart history={history} />
          </div>
        </div>
      )}

      {/* ── Bottom row: Progress + Activity ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <ProgressCard
            data={progressData}
            title={tagProgress.length > 0 ? "Problem Tags" : "Difficulty Breakdown"}
          />
        </div>
        <RecentActivity activities={recentActivities} />
      </div>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <div className="text-center text-xs text-slate-500 dark:text-slate-600 border-t border-slate-200 dark:border-white/5 pt-4">
        <p className="flex items-center justify-center gap-2 flex-wrap">
          <span>Dashboard data provided by Codeforces API</span>
          {handle && (
            <>
              <span className="w-px h-3 bg-slate-300 dark:bg-slate-700" />
              <span className="text-slate-500 dark:text-slate-500">Connected as @{handle}</span>
            </>
          )}
          {lastUpdated && (
            <>
              <span className="w-px h-3 bg-slate-300 dark:bg-slate-700" />
              <span className="text-slate-500 dark:text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {lastUpdated.toLocaleTimeString()}
              </span>
            </>
          )}
        </p>
        {autoRefresh && (
          <p className="mt-1 text-slate-400 dark:text-slate-700">
            Auto-refreshes every {Math.floor(refreshInterval / 60000)} minutes
          </p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;