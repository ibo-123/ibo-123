import React, { useState, useMemo } from "react";
import { Card, CardContent } from "../ui/card";
import {
  Trophy,
  Star,
  Code2,
  Medal,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Minus,
  Sparkles,
  Crown,
  Target,
  Zap,
  Award,
  Clock,
  Calendar,
  Users,
  GitBranch,
  Activity,
} from "lucide-react";

// Color schemes for different stat types
const COLOR_SCHEMES = {
  blue: {
    bg: "from-blue-500/10 to-blue-600/5",
    border: "border-blue-500/20",
    iconBg: "from-blue-500/20 to-blue-600/10",
    iconColor: "text-blue-400",
    text: "text-blue-400",
    gradient: "from-blue-500 to-blue-400",
    glow: "rgba(59, 130, 246, 0.15)",
  },
  purple: {
    bg: "from-purple-500/10 to-purple-600/5",
    border: "border-purple-500/20",
    iconBg: "from-purple-500/20 to-purple-600/10",
    iconColor: "text-purple-400",
    text: "text-purple-400",
    gradient: "from-purple-500 to-purple-400",
    glow: "rgba(139, 92, 246, 0.15)",
  },
  emerald: {
    bg: "from-emerald-500/10 to-emerald-600/5",
    border: "border-emerald-500/20",
    iconBg: "from-emerald-500/20 to-emerald-600/10",
    iconColor: "text-emerald-400",
    text: "text-emerald-400",
    gradient: "from-emerald-500 to-emerald-400",
    glow: "rgba(16, 185, 129, 0.15)",
  },
  amber: {
    bg: "from-amber-500/10 to-amber-600/5",
    border: "border-amber-500/20",
    iconBg: "from-amber-500/20 to-amber-600/10",
    iconColor: "text-amber-400",
    text: "text-amber-400",
    gradient: "from-amber-500 to-amber-400",
    glow: "rgba(245, 158, 11, 0.15)",
  },
  rose: {
    bg: "from-rose-500/10 to-rose-600/5",
    border: "border-rose-500/20",
    iconBg: "from-rose-500/20 to-rose-600/10",
    iconColor: "text-rose-400",
    text: "text-rose-400",
    gradient: "from-rose-500 to-rose-400",
    glow: "rgba(244, 63, 94, 0.15)",
  },
  cyan: {
    bg: "from-cyan-500/10 to-cyan-600/5",
    border: "border-cyan-500/20",
    iconBg: "from-cyan-500/20 to-cyan-600/10",
    iconColor: "text-cyan-400",
    text: "text-cyan-400",
    gradient: "from-cyan-500 to-cyan-400",
    glow: "rgba(6, 182, 212, 0.15)",
  },
};

function AnalyticsStats({
  stats,
  className = "",
  onStatClick,
  showTrends = true,
  showProgress = true,
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Calculate trends and additional metrics
  const cards = useMemo(() => {
    const baseCards = [
      {
        id: "current-rating",
        title: "Current Rating",
        value: stats?.currentRating || 0,
        icon: Trophy,
        color: "blue",
        description: stats?.ratingChange
          ? `${stats.ratingChange > 0 ? '+' : ''}${stats.ratingChange} from last contest`
          : "Current rating",
        change: stats?.ratingChange || 0,
        trend: stats?.ratingChange > 0 ? "up" : stats?.ratingChange < 0 ? "down" : "neutral",
        suffix: "",
        category: "rating",
        badge: stats?.rank || "Unrated",
      },
      {
        id: "max-rating",
        title: "Max Rating",
        value: stats?.maxRating || 0,
        icon: Star,
        color: "amber",
        description: "Your peak performance",
        change: stats?.maxRating - stats?.currentRating || 0,
        trend: stats?.maxRating > stats?.currentRating ? "up" : "neutral",
        suffix: "",
        category: "rating",
        badge: "🏆 Peak",
      },
      {
        id: "problems-solved",
        title: "Problems Solved",
        value: stats?.problemsSolved || 0,
        icon: Code2,
        color: "emerald",
        description: stats?.problemsThisMonth
          ? `${stats.problemsThisMonth} this month`
          : "Total solved",
        change: stats?.problemsThisMonth || 0,
        trend: stats?.problemsThisMonth > 0 ? "up" : "neutral",
        suffix: "problems",
        category: "problems",
        badge: stats?.problemsSolved > 100 ? "💪 Pro" : "📚 Learning",
      },
      {
        id: "contests",
        title: "Contests",
        value: stats?.contestCount || 0,
        icon: Medal,
        color: "purple",
        description: stats?.contestsThisYear
          ? `${stats.contestsThisYear} this year`
          : "Total contests",
        change: stats?.contestsThisMonth || 0,
        trend: stats?.contestsThisMonth > 0 ? "up" : "neutral",
        suffix: "contests",
        category: "contests",
        badge: stats?.contestCount > 10 ? "🎯 Regular" : "🌱 Beginner",
      },
    ];

    // Add optional cards if data is available
    if (stats?.maxRank) {
      baseCards.push({
        id: "best-rank",
        title: "Best Rank",
        value: `#${stats.maxRank}`,
        icon: Crown,
        color: "cyan",
        description: "Your best contest rank",
        change: 0,
        trend: "neutral",
        suffix: "",
        category: "rank",
        badge: "⭐ Elite",
      });
    }

    if (stats?.averageRating) {
      baseCards.push({
        id: "avg-rating",
        title: "Avg Rating",
        value: stats.averageRating,
        icon: Target,
        color: "rose",
        description: "Average contest rating",
        change: stats.averageRating - stats?.currentRating || 0,
        trend: stats.averageRating > stats?.currentRating ? "down" : "neutral",
        suffix: "",
        category: "rating",
        badge: "📊 Average",
      });
    }

    return baseCards;
  }, [stats]);

  // Get trend icon and color
  const getTrendInfo = (trend) => {
    if (trend === "up") {
      return {
        icon: ArrowUp,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        label: "Improving",
      };
    } else if (trend === "down") {
      return {
        icon: ArrowDown,
        color: "text-rose-400",
        bg: "bg-rose-500/10",
        border: "border-rose-500/20",
        label: "Declining",
      };
    } else {
      return {
        icon: Minus,
        color: "text-slate-400",
        bg: "bg-slate-500/10",
        border: "border-slate-500/20",
        label: "Stable",
      };
    }
  };

  // Format value with suffix
  const formatValue = (value, suffix) => {
    if (typeof value === "number" && value > 999) {
      return value.toLocaleString();
    }
    return value;
  };

  // Get rating color based on value
  const getRatingColor = (value, category) => {
    if (category !== "rating") return null;
    if (typeof value !== "number") return null;
    if (value >= 2400) return "text-red-500";
    if (value >= 2100) return "text-orange-500";
    if (value >= 1900) return "text-purple-500";
    if (value >= 1600) return "text-blue-500";
    if (value >= 1400) return "text-cyan-500";
    if (value >= 1200) return "text-emerald-500";
    return "text-slate-400";
  };

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="overflow-hidden border-white/5 bg-gradient-to-br from-slate-900 to-slate-800">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-slate-700/50 rounded w-24" />
                <div className="h-8 bg-slate-700/50 rounded w-32" />
                <div className="h-3 bg-slate-700/50 rounded w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 ${className}`}>
      {cards.map((item, index) => {
        const Icon = item.icon;
        const colorScheme = COLOR_SCHEMES[item.color] || COLOR_SCHEMES.blue;
        const trendInfo = getTrendInfo(item.trend);
        const TrendIcon = trendInfo.icon;
        const isHovered = hoveredIndex === index;
        const ratingColor = getRatingColor(item.value, item.category);

        return (
          <Card
            key={item.id || index}
            className={`
              overflow-hidden transition-all duration-300
              bg-gradient-to-br ${colorScheme.bg}
              border ${colorScheme.border}
              hover:scale-[1.02] hover:shadow-xl
              ${onStatClick ? "cursor-pointer" : ""}
            `}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => onStatClick && onStatClick(item)}
          >
            {/* Glow effect on hover */}
            {isHovered && (
              <div
                className={`
                  absolute inset-0 bg-gradient-to-r ${colorScheme.bg}
                  opacity-50 blur-xl transition-opacity duration-300 -z-10
                `}
              />
            )}

            <CardContent className="relative p-6">
              {/* Top section with icon and badge */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-400 truncate">
                      {item.title}
                    </p>
                    {item.badge && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-white/5 border border-white/5 text-slate-400 truncate">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </div>
                <div className={`
                  flex-shrink-0 p-2 rounded-xl
                  bg-gradient-to-br ${colorScheme.iconBg}
                  border ${colorScheme.border}
                  transition-all duration-300
                  ${isHovered ? "scale-110 rotate-3" : ""}
                `}>
                  <Icon className={`w-5 h-5 ${ratingColor || colorScheme.iconColor}`} />
                </div>
              </div>

              {/* Value */}
              <div className="mt-2 flex items-end gap-2">
                <h2 className={`text-3xl font-bold ${ratingColor || "text-white"} tracking-tight`}>
                  {formatValue(item.value, item.suffix)}
                </h2>
                {item.suffix && (
                  <span className="text-sm text-slate-500 mb-0.5">
                    {item.suffix}
                  </span>
                )}
              </div>

              {/* Description */}
              {item.description && (
                <p className="text-xs text-slate-500 mt-1">
                  {item.description}
                </p>
              )}

              {/* Trend indicator */}
              {showTrends && item.change !== undefined && item.change !== 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <div className={`
                    flex items-center gap-1 px-2 py-0.5 rounded-full
                    ${trendInfo.bg} border ${trendInfo.border}
                  `}>
                    <TrendIcon className={`w-3 h-3 ${trendInfo.color}`} />
                    <span className={`text-xs font-medium ${trendInfo.color}`}>
                      {item.change > 0 ? "+" : ""}
                      {typeof item.change === "number" && item.change > 0 ? item.change : item.change}
                      {item.suffix ? ` ${item.suffix}` : ""}
                    </span>
                  </div>
                  {item.trend === "up" && (
                    <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
                  )}
                </div>
              )}

              {/* Progress indicator for problems solved */}
              {showProgress && item.category === "problems" && stats?.target && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Progress</span>
                    <span>{Math.round((item.value / stats.target) * 100)}%</span>
                  </div>
                  <div className="mt-0.5 w-full h-1 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-1000"
                      style={{ width: `${Math.min(100, (item.value / stats.target) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Rating change indicator */}
              {item.category === "rating" && stats?.ratingChange && (
                <div className="mt-3 flex items-center gap-1 text-[10px]">
                  <span className="text-slate-500">Last contest:</span>
                  <span className={`font-medium ${stats.ratingChange > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {stats.ratingChange > 0 ? "+" : ""}
                    {stats.ratingChange}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default AnalyticsStats;