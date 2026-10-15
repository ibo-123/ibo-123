import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Area,
  ComposedChart,
} from "recharts";
import { Card, CardContent } from "../ui/card";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  Award,
  Star,
  Calendar,
  Clock,
  ArrowUp,
  ArrowDown,
  Zap,
  Target,
  Sparkles,
} from "lucide-react";

function RatingHistoryChart({
  history = [],
  title = "Rating History",
  height = 380,
  showStats = true,
  showReferenceLines = true,
  className = "",
  onDataPointClick,
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Process data for the chart
  const chartData = useMemo(() => {
    if (!history || history.length === 0) return [];

    return history.map((item, index) => ({
      contest: item.contestName.length > 20
        ? item.contestName.slice(0, 20) + "…"
        : item.contestName,
      fullName: item.contestName,
      rating: item.newRating,
      oldRating: item.oldRating || item.newRating,
      rank: item.rank || "—",
      change: item.newRating - (item.oldRating || item.newRating),
      date: item.ratingUpdateTimeSeconds
        ? new Date(item.ratingUpdateTimeSeconds * 1000)
        : null,
      index: index,
      isPeak: false,
      isLowest: false,
    }));
  }, [history]);

  // Calculate statistics and add peak/lowest markers
  const processedData = useMemo(() => {
    if (chartData.length === 0) return [];

    const ratings = chartData.map(d => d.rating);
    const peak = Math.max(...ratings);
    const lowest = Math.min(...ratings);

    return chartData.map(d => ({
      ...d,
      isPeak: d.rating === peak,
      isLowest: d.rating === lowest,
    }));
  }, [chartData]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return {
        current: null,
        peak: null,
        lowest: null,
        average: null,
        totalContests: 0,
        totalChange: 0,
        bestGain: null,
        worstLoss: null,
        trend: "neutral",
      };
    }

    const ratings = chartData.map(d => d.rating);
    const current = ratings[ratings.length - 1];
    const peak = Math.max(...ratings);
    const lowest = Math.min(...ratings);
    const average = Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length);
    const totalContests = chartData.length;
    const totalChange = current - ratings[0];

    // Calculate trend
    const changes = chartData
      .filter(d => d.change !== 0)
      .map(d => d.change);
    const positiveChanges = changes.filter(c => c > 0).length;
    const trend =
      positiveChanges > changes.length / 2
        ? "up"
        : positiveChanges < changes.length / 2
        ? "down"
        : "neutral";

    // Best gain and worst loss
    const bestGain = chartData.reduce(
      (best, curr) => {
        if (curr.change > best.change) return curr;
        return best;
      },
      { change: -Infinity, contest: null }
    );

    const worstLoss = chartData.reduce(
      (worst, curr) => {
        if (curr.change < worst.change) return curr;
        return worst;
      },
      { change: Infinity, contest: null }
    );

    return {
      current,
      peak,
      lowest,
      average,
      totalContests,
      totalChange,
      bestGain: bestGain.change > -Infinity ? bestGain : null,
      worstLoss: worstLoss.change < Infinity ? worstLoss : null,
      trend,
    };
  }, [chartData]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0].payload;
    const change = data.change;
    const changeColor =
      change > 0 ? "text-emerald-400" : change < 0 ? "text-rose-400" : "text-slate-400";
    const changeIcon =
      change > 0 ? (
        <ArrowUp className="w-3 h-3" />
      ) : change < 0 ? (
        <ArrowDown className="w-3 h-3" />
      ) : (
        <Minus className="w-3 h-3" />
      );

    return (
      <div className="bg-slate-900/95 backdrop-blur-sm border border-white/10 rounded-xl p-4 shadow-2xl min-w-[220px]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400 font-medium">
            {data.fullName || data.contest}
          </span>
          {data.date && (
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {data.date.toLocaleDateString()}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-white">{data.rating}</p>
            {data.oldRating && (
              <p className="text-xs text-slate-500">
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
          <div className="mt-1 text-xs text-slate-400 flex items-center gap-1">
            <Trophy className="w-3 h-3" />
            Rank: #{data.rank}
          </div>
        )}
        {data.isPeak && (
          <div className="mt-1 text-xs text-emerald-400 flex items-center gap-1">
            <Star className="w-3 h-3 fill-emerald-400" />
            Peak Rating!
          </div>
        )}
        {data.isLowest && (
          <div className="mt-1 text-xs text-rose-400 flex items-center gap-1">
            <TrendingDown className="w-3 h-3" />
            Lowest Rating
          </div>
        )}
      </div>
    );
  };

  // Custom dot renderer
  const renderDot = (props) => {
    const { cx, cy, payload } = props;
    const isPeak = payload.isPeak;
    const isLowest = payload.isLowest;
    const isHovered = hoveredPoint === payload.index;

    if (isPeak) {
      return (
        <circle
          cx={cx}
          cy={cy}
          r={isHovered ? 8 : 5}
          fill="#10b981"
          stroke="#1e293b"
          strokeWidth={2}
          className="transition-all duration-200"
        />
      );
    }

    if (isLowest) {
      return (
        <circle
          cx={cx}
          cy={cy}
          r={isHovered ? 8 : 5}
          fill="#ef4444"
          stroke="#1e293b"
          strokeWidth={2}
          className="transition-all duration-200"
        />
      );
    }

    return (
      <circle
        cx={cx}
        cy={cy}
        r={isHovered ? 6 : 3.5}
        fill="#3b82f6"
        stroke="#1e293b"
        strokeWidth={1.5}
        className="transition-all duration-200"
      />
    );
  };

  // Get rating color
  const getRatingColor = (rating) => {
    if (rating >= 2400) return "#FF0000";
    if (rating >= 2100) return "#FF8C00";
    if (rating >= 1900) return "#AA00AA";
    if (rating >= 1600) return "#0000FF";
    if (rating >= 1400) return "#008000";
    if (rating >= 1200) return "#008000";
    return "#808080";
  };

  const currentRating = stats.current || chartData[chartData.length - 1]?.rating || 0;
  const lineColor = getRatingColor(currentRating);

  if (!history || history.length === 0) {
    return (
      <Card className={`overflow-hidden border-white/5 bg-gradient-to-br from-slate-900 to-slate-800 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/20 border border-white/5">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <p className="text-xs text-slate-400">Track your rating progress</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-12">
            <div className="p-4 rounded-full bg-slate-800/50 border border-white/5 mb-4">
              <TrendingUp className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-400 text-sm">No rating history available</p>
            <p className="text-slate-500 text-xs mt-1">Participate in contests to see your progress</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`overflow-hidden border-white/5 bg-gradient-to-br from-slate-900 to-slate-800 ${className}`}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/5">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{title}</h3>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <span>{stats.totalContests} contests</span>
                {stats.totalContests > 0 && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-slate-600" />
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Last: {chartData[chartData.length - 1]?.date?.toLocaleDateString() || "N/A"}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Quick stats */}
          {showStats && stats.current !== null && (
            <div className="flex flex-wrap items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-slate-400">Current</p>
                <p className="text-xl font-bold text-white">{stats.current}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Peak</p>
                <p className="text-lg font-bold text-emerald-400">{stats.peak}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Avg</p>
                <p className="text-lg font-bold text-slate-300">{stats.average}</p>
              </div>
              {stats.trend === "up" && (
                <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                  <ArrowUp className="w-3 h-3 text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-400">Improving</span>
                </div>
              )}
              {stats.trend === "down" && (
                <div className="flex items-center gap-1 px-2 py-1 bg-rose-500/10 rounded-full border border-rose-500/20">
                  <ArrowDown className="w-3 h-3 text-rose-400" />
                  <span className="text-xs font-medium text-rose-400">Declining</span>
                </div>
              )}
              {stats.totalChange !== 0 && (
                <div className={`flex items-center gap-0.5 text-xs font-medium ${stats.totalChange > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {stats.totalChange > 0 ? '+' : ''}{stats.totalChange}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chart */}
        <div style={{ width: "100%", height: height }}>
          <ResponsiveContainer>
            <ComposedChart
              data={processedData}
              margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
              onMouseMove={(e) => {
                if (e.activePayload) {
                  setHoveredPoint(e.activePayload[0]?.payload?.index);
                }
              }}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <defs>
                <linearGradient id="ratingGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.6} />
                  <stop offset="50%" stopColor="#8b5cf6" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="areaGradientPeak" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              <CartesianGrid
                strokeDasharray="4 4"
                stroke="rgba(255,255,255,0.03)"
                vertical={false}
              />

              <XAxis
                dataKey="contest"
                tick={{
                  fill: "#475569",
                  fontSize: 10,
                  fontWeight: 500,
                }}
                tickLine={false}
                axisLine={{ stroke: "rgba(255,255,255,0.04)" }}
                interval="preserveStartEnd"
                minTickGap={20}
              />

              <YAxis
                tick={{
                  fill: "#475569",
                  fontSize: 10,
                  fontWeight: 500,
                }}
                tickLine={false}
                axisLine={{ stroke: "rgba(255,255,255,0.04)" }}
                domain={['auto', 'auto']}
                width={40}
              />

              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.05)" }} />

              {/* Area under the line */}
              <Area
                type="monotone"
                dataKey="rating"
                stroke="none"
                fill="url(#areaGradient)"
                activeDot={false}
              />

              {/* Main line */}
              <Line
                type="monotone"
                dataKey="rating"
                stroke="url(#ratingGradient)"
                strokeWidth={3}
                dot={renderDot}
                activeDot={{
                  r: 7,
                  fill: "#60a5fa",
                  stroke: "#0b0f19",
                  strokeWidth: 2,
                }}
              />

              {/* Reference line for current rating */}
              {showReferenceLines && stats.current && stats.current !== stats.peak && (
                <ReferenceLine
                  y={stats.current}
                  stroke="rgba(255,255,255,0.05)"
                  strokeDasharray="4 4"
                  label={{
                    value: "Current",
                    fill: "#475569",
                    fontSize: 9,
                    position: "right",
                  }}
                />
              )}

              {/* Reference line for peak rating */}
              {showReferenceLines && stats.peak && stats.peak !== stats.current && (
                <ReferenceLine
                  y={stats.peak}
                  stroke="rgba(16, 185, 129, 0.15)"
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

        {/* Stats footer */}
        <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Trophy className="w-3 h-3 text-emerald-400" />
              Peak: <span className="text-white font-medium">{stats.peak}</span>
            </span>
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3 text-blue-400" />
              Avg: <span className="text-white font-medium">{stats.average}</span>
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              Total: <span className="text-white font-medium">{stats.totalContests}</span>
            </span>
          </div>

          {stats.bestGain && stats.bestGain.change > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-emerald-400">
              <ArrowUp className="w-3 h-3" />
              Best: +{stats.bestGain.change}
              <span className="text-slate-500">
                ({stats.bestGain.contest?.contest || "N/A"})
              </span>
            </div>
          )}

          {stats.worstLoss && stats.worstLoss.change < 0 && (
            <div className="flex items-center gap-1 text-[10px] text-rose-400">
              <ArrowDown className="w-3 h-3" />
              Worst: {stats.worstLoss.change}
              <span className="text-slate-500">
                ({stats.worstLoss.contest?.contest || "N/A"})
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default RatingHistoryChart;