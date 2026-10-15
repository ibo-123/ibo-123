import { useEffect, useState, useCallback } from "react";
import {
  BarChart3,
  Trophy,
  Target,
  Calendar,
  Clock,
  Crown,
  Activity,
  LineChart,
  BarChart,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { getAnalytics, getHeatmap, getProblemDistribution } from "../services/analyticsService";
import AnalyticsStats from "../components/analytics/AnalyticsStats";
import RatingChart from "../components/dashboard/RatingChart";
import ActivityCard from "../components/analytics/ActivityCard";
import ContestTable from "../components/analytics/ContestTable";
import { toast } from "sonner";

const KPI_COLORS = {
  purple: {
    bg: "from-purple-500/10 to-purple-600/5 dark:from-purple-500/15 dark:to-purple-600/5",
    border: "border-purple-300/60 dark:border-purple-500/30",
    iconBg: "bg-purple-500/15 dark:bg-purple-500/20",
    iconText: "text-purple-600 dark:text-purple-400",
    glow: "bg-purple-500/10 dark:bg-purple-500/20",
  },
  amber: {
    bg: "from-amber-500/10 to-amber-600/5 dark:from-amber-500/15 dark:to-amber-600/5",
    border: "border-amber-300/60 dark:border-amber-500/30",
    iconBg: "bg-amber-500/15 dark:bg-amber-500/20",
    iconText: "text-amber-600 dark:text-amber-400",
    glow: "bg-amber-500/10 dark:bg-amber-500/20",
  },
  blue: {
    bg: "from-blue-500/10 to-blue-600/5 dark:from-blue-500/15 dark:to-blue-600/5",
    border: "border-blue-300/60 dark:border-blue-500/30",
    iconBg: "bg-blue-500/15 dark:bg-blue-500/20",
    iconText: "text-blue-600 dark:text-blue-400",
    glow: "bg-blue-500/10 dark:bg-blue-500/20",
  },
  emerald: {
    bg: "from-emerald-500/10 to-emerald-600/5 dark:from-emerald-500/15 dark:to-emerald-600/5",
    border: "border-emerald-300/60 dark:border-emerald-500/30",
    iconBg: "bg-emerald-500/15 dark:bg-emerald-500/20",
    iconText: "text-emerald-600 dark:text-emerald-400",
    glow: "bg-emerald-500/10 dark:bg-emerald-500/20",
  },
};

const deriveActivityCounts = (heatmap = []) => {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 30);

  let thisWeek = 0;
  let thisMonth = 0;
  heatmap.forEach(({ date, accepted = 0 }) => {
    const d = new Date(date);
    if (d >= weekAgo) thisWeek += accepted;
    if (d >= monthAgo) thisMonth += accepted;
  });
  return { thisWeek, thisMonth };
};

function Analytics({
  userId,
  autoRefresh = false,
  refreshInterval = 300000,
  onError,
  onLoad,
  className = "",
}) {
  const [analytics, setAnalytics] = useState(null);
  const [activityData, setActivityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const loadAnalytics = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");

      try {
        const data = await getAnalytics(userId);
        setAnalytics(data);
        setLastUpdated(new Date());
        onLoad?.(data);
        setRetryCount(0);

        const [heatmapResult] = await Promise.allSettled([
          getHeatmap(),
          getProblemDistribution(),
        ]);

        if (
          heatmapResult.status === "fulfilled" &&
          Array.isArray(heatmapResult.value)
        ) {
          const heatmap = heatmapResult.value;
          const { thisWeek, thisMonth } = deriveActivityCounts(heatmap);
          setActivityData({
            problemsThisWeek: thisWeek,
            problemsThisMonth: thisMonth,
            currentStreak: data?.currentStreak ?? 0,
            longestStreak: data?.longestStreak ?? 0,
            contestsParticipated:
              data?.contestCount ?? (data?.history?.length ?? 0),
            achievements: 0,
            weeklyGoal: 25,
            totalSolved: data?.problemsSolved ?? 0,
          });
        }
      } catch (err) {
        console.error("Analytics Error:", err);
        const errorMessage =
          err.response?.status === 401
            ? "Your session has expired. Please log in again."
            : err.response?.status === 404
            ? "Analytics data not found."
            : err.response?.status === 429
            ? "Too many requests. Please try again later."
            : err.message || "Unable to load analytics.";
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
    loadAnalytics();
    if (autoRefresh && refreshInterval > 0) {
      const id = setInterval(() => loadAnalytics(true), refreshInterval);
      return () => clearInterval(id);
    }
  }, [loadAnalytics, autoRefresh, refreshInterval]);

  const handleRefresh = () => {
    loadAnalytics(true);
    toast.info("Refreshing analytics…");
  };

  const handleRetry = () => {
    if (retryCount >= 3) {
      toast.error("Please wait a moment before trying again.");
      return;
    }
    loadAnalytics();
  };

  if (loading) {
    return (
      <div
        className={`flex flex-col justify-center items-center min-h-[400px] ${className}`}
      >
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 blur-3xl rounded-full animate-pulse" />
          <Loader2 className="w-16 h-16 text-emerald-500 dark:text-emerald-400 animate-spin relative" />
        </div>
        <div className="mt-6 text-center">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400 bg-clip-text text-transparent">
            Loading Analytics
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 animate-pulse">
            Analysing your performance data…
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex justify-center items-center min-h-[400px] ${className}`}
      >
        <div className="text-center max-w-md">
          <div className="p-5 bg-red-500/10 rounded-2xl inline-block mb-5 ring-1 ring-red-500/30">
            <AlertCircle className="w-14 h-14 text-red-500 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-red-500 dark:text-red-400">
            {error}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            {retryCount >= 3
              ? "Multiple retry attempts failed. Please try again later."
              : "Please try reloading the page or contact support if the issue persists."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={handleRetry}
              disabled={retryCount >= 3}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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

  if (!analytics) {
    return (
      <div
        className={`flex justify-center items-center min-h-[400px] ${className}`}
      >
        <div className="text-center">
          <div className="p-5 bg-slate-100 dark:bg-slate-800/50 rounded-2xl inline-block mb-5 ring-1 ring-slate-200 dark:ring-white/5">
            <BarChart3 className="w-14 h-14 text-slate-400 dark:text-slate-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300">
            No Analytics Data Available
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
            Participate in contests to unlock detailed analytics.
          </p>
        </div>
      </div>
    );
  }

  const totalContests = analytics?.history?.length ?? 0;
  const averageRating =
    totalContests > 0
      ? Math.round(
          analytics.history.reduce((acc, c) => acc + c.newRating, 0) /
            totalContests
        )
      : 0;
  const peakRating =
    totalContests > 0
      ? Math.max(...analytics.history.map((h) => h.newRating))
      : 0;
  const bestRank =
    totalContests > 0
      ? Math.min(...analytics.history.map((h) => h.rank || Infinity))
      : null;

  const enrichedStats = {
    ...analytics,
    averageRating,
    ratingChange:
      totalContests >= 2
        ? analytics.history[totalContests - 1].newRating -
          analytics.history[totalContests - 2].newRating
        : null,
  };

  const kpis = [
    { icon: Trophy, label: "Total Contests", value: totalContests, color: "purple" },
    { icon: Target, label: "Peak Rating", value: peakRating, color: "amber" },
    { icon: Crown, label: "Avg Rating", value: averageRating, color: "blue" },
    {
      icon: Trophy,
      label: "Best Rank",
      value: bestRank && isFinite(bestRank) ? `#${bestRank}` : "N/A",
      color: "emerald",
    },
  ];

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-emerald-500/20 bg-gradient-to-br from-white via-emerald-50 to-white dark:from-slate-900 dark:via-emerald-950/20 dark:to-slate-900 shadow-xl shadow-emerald-500/5 dark:shadow-2xl dark:shadow-emerald-950/30">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-400/20 dark:bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-blue-400/15 dark:bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
                Analytics Dashboard
              </h1>
              <span className="text-3xl">📊</span>
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Analyse your competitive programming performance
              </p>
              {lastUpdated && (
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-full">
                  <Clock className="w-3 h-3" />
                  Updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all duration-300 disabled:opacity-50 border border-slate-200 dark:border-white/5"
              title="Refresh analytics"
            >
              <RefreshCw
                className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((stat, index) => {
          const scheme = KPI_COLORS[stat.color] || KPI_COLORS.blue;
          return (
            <div
              key={index}
              className={`group relative overflow-hidden rounded-xl bg-white dark:bg-slate-900/80 bg-gradient-to-br ${scheme.bg} border ${scheme.border} p-4 hover:scale-[1.02] transition-all duration-300 cursor-default`}
            >
              <div
                className={`absolute -top-10 -right-10 w-20 h-20 ${scheme.glow} rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`}
              />
              <div className="relative flex items-center gap-3">
                <div className={`p-2 rounded-lg ${scheme.iconBg}`}>
                  <stat.icon className={`w-5 h-5 ${scheme.iconText}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                    {stat.label}
                  </p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white truncate">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics stats cards */}
      <AnalyticsStats stats={enrichedStats} />

      {/* Rating chart */}
      {analytics?.history?.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-white/5 p-6 shadow-lg">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <LineChart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Rating Trend
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    Your performance over time
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {analytics.history.length} contests
                </span>
              </div>
            </div>
            <RatingChart history={analytics.history} />
          </div>
        </div>
      )}

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ActivityCard data={activityData} />
        </div>
        <div className="lg:col-span-2">
          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-white/5 p-6 shadow-lg">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <BarChart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      Contest History
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      Detailed contest performance
                    </p>
                  </div>
                </div>
                {totalContests > 0 && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-3 py-1 rounded-full">
                    {totalContests} entries
                  </span>
                )}
              </div>
              <ContestTable history={analytics.history || []} />
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-slate-500 dark:text-slate-600 border-t border-slate-200 dark:border-white/5 pt-4">
        <p className="flex items-center justify-center gap-2">
          <span>Analytics powered by Codeforces API</span>
          <span className="w-px h-3 bg-slate-300 dark:bg-slate-700" />
          <span className="text-slate-500">Real-time performance tracking</span>
        </p>
      </div>
    </div>
  );
}

export default Analytics;