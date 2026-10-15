import React, { useState, useMemo } from "react";
import { Card, CardContent } from "../ui/card";
import {
  Activity,
  Target,
  Flame,
  Trophy,
  Award,
  TrendingUp,
  Medal,
  Layers,
  ArrowUpRight,
  Sparkles,
  Star,
  Code2,
} from "lucide-react";

// Activity type visual config
const ACTIVITY_TYPES = {
  problem: {
    icon: Target,
    color: "blue",
    bgGradient: "from-blue-500/10 to-blue-600/5",
    borderColor: "border-blue-500/20",
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-400",
  },
  streak: {
    icon: Flame,
    color: "amber",
    bgGradient: "from-amber-500/10 to-amber-600/5",
    borderColor: "border-amber-500/20",
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-400",
  },
  contest: {
    icon: Trophy,
    color: "purple",
    bgGradient: "from-purple-500/10 to-purple-600/5",
    borderColor: "border-purple-500/20",
    iconBg: "bg-purple-500/20",
    iconColor: "text-purple-400",
  },
  achievement: {
    icon: Award,
    color: "emerald",
    bgGradient: "from-emerald-500/10 to-emerald-600/5",
    borderColor: "border-emerald-500/20",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
  },
  rating: {
    icon: TrendingUp,
    color: "rose",
    bgGradient: "from-rose-500/10 to-rose-600/5",
    borderColor: "border-rose-500/20",
    iconBg: "bg-rose-500/20",
    iconColor: "text-rose-400",
  },
};

function ActivityCard({
  data: propData,
  title = "Activity Overview",
  showProgress = true,
  className = "",
  onActivityClick,
}) {
  const [hoveredItem, setHoveredItem] = useState(null);

  // ── Guard: render empty state if no data ──────────────────────────────
  if (!propData) {
    return (
      <Card className={`overflow-hidden border-white/5 bg-gradient-to-br from-slate-900 to-slate-800 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/5">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{title}</h3>
              <p className="text-xs text-slate-400">Sync Codeforces to see your stats</p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="p-4 rounded-full bg-slate-800/50 border border-white/5 mb-3">
              <Code2 className="w-6 h-6 text-slate-600" />
            </div>
            <p className="text-slate-400 text-sm">No activity data yet</p>
            <p className="text-slate-500 text-xs mt-1">
              Connect and sync your Codeforces account to get started
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const {
    problemsThisWeek = 0,
    problemsThisMonth = 0,
    currentStreak = 0,
    longestStreak = 0,
    contestsParticipated = 0,
    achievements = 0,
    weeklyGoal = 25,
    totalSolved = 0,
  } = propData;

  // Activity grid items
  const activityItems = [
    {
      type: "problem",
      label: "Problems This Week",
      value: problemsThisWeek,
      subtitle: `of ${weeklyGoal} weekly goal`,
      percentage: Math.min(100, Math.round((problemsThisWeek / weeklyGoal) * 100)),
      icon: Target,
    },
    {
      type: "problem",
      label: "Problems This Month",
      value: problemsThisMonth,
      subtitle: "solved this month",
      icon: Layers,
    },
    {
      type: "streak",
      label: "Current Streak",
      value: currentStreak > 0 ? `${currentStreak} days` : "—",
      subtitle: currentStreak >= 7 ? "🔥 On fire!" : "Keep going!",
      icon: Flame,
      isStreak: true,
    },
    {
      type: "streak",
      label: "Longest Streak",
      value: longestStreak > 0 ? `${longestStreak} days` : "—",
      subtitle: "Personal best",
      icon: Medal,
    },
    {
      type: "contest",
      label: "Contests Entered",
      value: contestsParticipated,
      subtitle: "Total contests",
      icon: Trophy,
    },
    {
      type: "achievement",
      label: "Achievements",
      value: achievements,
      subtitle: achievements >= 5 ? "🌟 Outstanding" : "Keep earning!",
      icon: Award,
    },
  ];

  const handleItemClick = (item) => {
    if (onActivityClick) onActivityClick(item);
  };

  const progressPct = Math.min(100, Math.round((problemsThisWeek / weeklyGoal) * 100));

  return (
    <Card className={`overflow-hidden border-white/5 bg-gradient-to-br from-slate-900 to-slate-800 hover:border-white/10 transition-all duration-300 ${className}`}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/5">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{title}</h3>
              <p className="text-xs text-slate-400">Your performance at a glance</p>
            </div>
          </div>
          {problemsThisMonth > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-medium text-emerald-400">Active</span>
            </div>
          )}
        </div>

        {/* 2×2 stat grid */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {activityItems.slice(0, 4).map((item, index) => {
            const Icon = item.icon;
            const cfg = ACTIVITY_TYPES[item.type];
            const isHovered = hoveredItem === index;

            return (
              <div
                key={index}
                className={`group relative rounded-xl p-3.5 cursor-pointer bg-gradient-to-br ${cfg.bgGradient} border ${cfg.borderColor} transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
                onMouseEnter={() => setHoveredItem(index)}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleItemClick(item)}
              >
                <div className="flex items-start justify-between relative">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-400 truncate">{item.label}</p>
                    <p className="text-lg font-bold text-white mt-0.5">{item.value}</p>
                    {item.subtitle && (
                      <p className="text-[10px] text-slate-500 truncate">{item.subtitle}</p>
                    )}
                  </div>
                  <div className={`p-1.5 rounded-lg ${cfg.iconBg} border ${cfg.borderColor}`}>
                    <Icon className={`w-4 h-4 ${cfg.iconColor}`} />
                  </div>
                </div>
                {item.percentage !== undefined && showProgress && item.type === "problem" && (
                  <div className="mt-2 w-full h-1 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-${cfg.color}-500 to-${cfg.color}-400`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-2 gap-3">
          {activityItems.slice(4).map((item, index) => {
            const Icon = item.icon;
            const cfg = ACTIVITY_TYPES[item.type];

            return (
              <div
                key={index + 4}
                className={`group relative rounded-xl p-3 cursor-pointer bg-gradient-to-br ${cfg.bgGradient} border ${cfg.borderColor} transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
                onMouseEnter={() => setHoveredItem(index + 4)}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleItemClick(item)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`p-1.5 rounded-lg ${cfg.iconBg} border ${cfg.borderColor}`}>
                      <Icon className={`w-3.5 h-3.5 ${cfg.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-slate-400 truncate">{item.label}</p>
                      <p className="text-sm font-bold text-white">{item.value}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Weekly progress */}
        {showProgress && weeklyGoal > 0 && (
          <div className="mt-3 pt-3 border-t border-white/5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <Target className="w-3 h-3" />
                <span>Weekly goal: {problemsThisWeek}/{weeklyGoal}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-500">{progressPct}%</span>
                <div className="w-16 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Achievement sparkle */}
        {achievements >= 3 && (
          <div className="mt-4 p-2.5 rounded-lg bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-slate-300">
                {achievements >= 7
                  ? "🏆 Elite Achiever — you're on fire!"
                  : achievements >= 5
                  ? "🌟 Outstanding progress!"
                  : "💪 Great start — keep going!"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(3, achievements) }).map((_, i) => (
                <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ActivityCard;