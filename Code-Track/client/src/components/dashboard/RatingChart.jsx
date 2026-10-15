import { useMemo } from "react";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from "recharts";
import {
  TrendingUp,
  Trophy,
  Award,
  Clock,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { useTheme } from "../../context/ThemeContext";

function RatingChart({
  history = [],
  title = "Rating History",
  height = 340,
  showStats = true,
  className = "",
}) {
  const { isDark } = useTheme();

  const chartData = useMemo(() => {
    if (!history || history.length === 0) return [];
    return history.map((contest, index) => ({
      contest:
        contest.contestName.length > 20
          ? contest.contestName.slice(0, 20) + "…"
          : contest.contestName,
      rating: contest.newRating,
      fullName: contest.contestName,
      rank: contest.rank || "—",
      oldRating: contest.oldRating || contest.newRating,
      date: contest.ratingUpdateTimeSeconds
        ? new Date(contest.ratingUpdateTimeSeconds * 1000)
        : null,
      change: contest.newRating - (contest.oldRating || contest.newRating),
      index: index,
    }));
  }, [history]);

  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return {
        current: null,
        peak: null,
        average: null,
        lowest: null,
        totalContests: 0,
        bestImprovement: null,
        worstDecline: null,
        trend: "neutral",
      };
    }
    const ratings = chartData.map((d) => d.rating);
    const current = ratings[ratings.length - 1];
    const peak = Math.max(...ratings);
    const lowest = Math.min(...ratings);
    const average = Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length);
    const totalContests = chartData.length;

    const changes = chartData.filter((d) => d.change !== 0).map((d) => d.change);
    const positiveChanges = changes.filter((c) => c > 0).length;
    const trend =
      positiveChanges > changes.length / 2
        ? "up"
        : positiveChanges < changes.length / 2
        ? "down"
        : "neutral";

    const bestImprovement = chartData.reduce(
      (best, curr) => (curr.change > best.change ? curr : best),
      { change: -Infinity, contest: null }
    );
    const worstDecline = chartData.reduce(
      (worst, curr) => (curr.change < worst.change ? curr : worst),
      { change: Infinity, contest: null }
    );

    return {
      current,
      peak,
      average,
      lowest,
      totalContests,
      bestImprovement:
        bestImprovement.change > -Infinity ? bestImprovement : null,
      worstDecline: worstDecline.change < Infinity ? worstDecline : null,
      trend,
    };
  }, [chartData]);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) return null;
    const data = payload[0].payload;
    const change = data.change;
    const changeColor =
      change > 0
        ? "text-emerald-600 dark:text-emerald-400"
        : change < 0
        ? "text-rose-600 dark:text-rose-400"
        : "text-slate-500 dark:text-slate-400";
    const changeIcon =
      change > 0 ? (
        <ArrowUp className="w-3 h-3" />
      ) : change < 0 ? (
        <ArrowDown className="w-3 h-3" />
      ) : (
        <Minus className="w-3 h-3" />
      );

    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-xl p-4 shadow-2xl min-w-[200px]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {data.fullName || data.contest}
          </span>
          {data.date && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {data.date.toLocaleDateString()}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {data.rating}
            </p>
            {data.oldRating && (
              <p className="text-xs text-slate-500 dark:text-slate-500">
                Previous: {data.oldRating}
              </p>
            )}
          </div>
          <div className={`flex items-center gap-1 ${changeColor}`}>
            {changeIcon}
            <span className="font-semibold">
              {change > 0 ? "+" : ""}
              {change}
            </span>
          </div>
        </div>
        {data.rank && data.rank !== "—" && (
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Rank: #{data.rank}
          </div>
        )}
      </div>
    );
  };

  if (!history || history.length === 0) {
    return (
      <Card
        className={`overflow-hidden border border-slate-200 dark:border-white/5 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 shadow-lg ${className}`}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 border border-slate-200 dark:border-white/5">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {title}
              </h3>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-12">
            <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 mb-4">
              <Trophy className="w-8 h-8 text-slate-400 dark:text-slate-600" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              No rating data available
            </p>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
              Participate in contests to track your progress
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentRating =
    stats.current || chartData[chartData.length - 1]?.rating || 0;
  const gridColor = isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.06)";
  const tickColor = isDark ? "#64748b" : "#64748b";
  const areaGradientStart = isDark
    ? "rgba(59,130,246,0.15)"
    : "rgba(59,130,246,0.12)";

  return (
    <Card
      className={`overflow-hidden border border-slate-200 dark:border-white/5 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 shadow-lg ${className}`}
    >
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/15 to-blue-500/15 dark:from-purple-500/20 dark:to-blue-500/20 border border-slate-200 dark:border-white/5">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span>{stats.totalContests} contests</span>
                {stats.totalContests > 0 && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-600" />
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Last:{" "}
                      {chartData[chartData.length - 1]?.date?.toLocaleDateString() ||
                        "N/A"}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          {showStats && stats.current !== null && (
            <div className="flex items-center gap-4 flex-wrap">
              <div className="text-right">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Current
                </p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {stats.current}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 dark:text-slate-400">Peak</p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {stats.peak}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 dark:text-slate-400">Avg</p>
                <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
                  {stats.average}
                </p>
              </div>
              {stats.trend === "up" && (
                <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                  <ArrowUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    Improving
                  </span>
                </div>
              )}
              {stats.trend === "down" && (
                <div className="flex items-center gap-1 px-2 py-1 bg-rose-500/10 rounded-full border border-rose-500/20">
                  <ArrowDown className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                  <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
                    Declining
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ width: "100%", height }}>
          <ResponsiveContainer>
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
            >
              <defs>
                <linearGradient
                  id="ratingGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="50%" stopColor="#8b5cf6" stopOpacity={1} />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.8} />
                </linearGradient>
                <linearGradient
                  id="areaGradient"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    stopColor="#3b82f6"
                    stopOpacity={isDark ? 0.25 : 0.15}
                  />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="4 4"
                stroke={gridColor}
                vertical={false}
              />

              <XAxis
                dataKey="contest"
                tick={{
                  fill: tickColor,
                  fontSize: 10,
                  fontWeight: 500,
                }}
                tickLine={false}
                axisLine={{ stroke: gridColor }}
                interval="preserveStartEnd"
                minTickGap={20}
              />

              <YAxis
                tick={{
                  fill: tickColor,
                  fontSize: 10,
                  fontWeight: 500,
                }}
                tickLine={false}
                axisLine={{ stroke: gridColor }}
                domain={["auto", "auto"]}
                width={40}
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: gridColor }}
              />

              <Area
                type="monotone"
                dataKey="rating"
                stroke="none"
                fill="url(#areaGradient)"
                activeDot={false}
              />

              <Line
                type="monotone"
                dataKey="rating"
                stroke="url(#ratingGradient)"
                strokeWidth={3}
                dot={{
                  r: 3.5,
                  fill: isDark ? "#1e293b" : "#ffffff",
                  stroke: "#3b82f6",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                  fill: "#60a5fa",
                  stroke: isDark ? "#0b0f19" : "#ffffff",
                  strokeWidth: 2,
                }}
              />

              {stats.current && stats.current !== stats.peak && (
                <ReferenceLine
                  y={stats.current}
                  stroke={gridColor}
                  strokeDasharray="4 4"
                  label={{
                    value: "Current",
                    fill: tickColor,
                    fontSize: 9,
                    position: "right",
                  }}
                />
              )}

              {stats.peak && stats.peak !== stats.current && (
                <ReferenceLine
                  y={stats.peak}
                  stroke="rgba(16, 185, 129, 0.3)"
                  strokeDasharray="4 4"
                  label={{
                    value: "Peak",
                    fill: "#10b981",
                    fontSize: 9,
                    position: "right",
                  }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-500">
            <span className="flex items-center gap-1">
              <Trophy className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
              Peak:{" "}
              <span className="text-slate-900 dark:text-white font-medium">
                {stats.peak}
              </span>
            </span>
            <span className="flex items-center gap-1">
              <Award className="w-3 h-3 text-blue-500 dark:text-blue-400" />
              Avg:{" "}
              <span className="text-slate-900 dark:text-white font-medium">
                {stats.average}
              </span>
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500 dark:text-amber-400" />
              Total:{" "}
              <span className="text-slate-900 dark:text-white font-medium">
                {stats.totalContests}
              </span>
            </span>
          </div>

          {stats.bestImprovement && stats.bestImprovement.change > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
              <ArrowUp className="w-3 h-3" />
              Best: +{stats.bestImprovement.change}
              <span className="text-slate-500 dark:text-slate-500">
                ({stats.bestImprovement.contest?.contest || "N/A"})
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default RatingChart;