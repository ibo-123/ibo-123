import React, { useState, useEffect, useMemo } from "react";
import {
  Code2,
  Trophy,
  TrendingUp,
  Award,
  Target,
  Flame,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent } from "../ui/card";

const ACTIVITY_TYPES = {
  PROBLEM_SOLVED: {
    icon: Code2,
    bgColor: "from-blue-500/15 to-blue-600/5 dark:from-blue-500/20 dark:to-blue-600/10",
    borderColor: "border-blue-300/60 dark:border-blue-500/20",
    textColor: "text-blue-600 dark:text-blue-400",
    label: "Problem Solved",
  },
  CONTEST_PARTICIPATED: {
    icon: Trophy,
    bgColor: "from-purple-500/15 to-purple-600/5 dark:from-purple-500/20 dark:to-purple-600/10",
    borderColor: "border-purple-300/60 dark:border-purple-500/20",
    textColor: "text-purple-600 dark:text-purple-400",
    label: "Contest",
  },
  RATING_INCREASED: {
    icon: TrendingUp,
    bgColor: "from-emerald-500/15 to-emerald-600/5 dark:from-emerald-500/20 dark:to-emerald-600/10",
    borderColor: "border-emerald-300/60 dark:border-emerald-500/20",
    textColor: "text-emerald-600 dark:text-emerald-400",
    label: "Rating Change",
  },
  STREAK_MILESTONE: {
    icon: Flame,
    bgColor: "from-amber-500/15 to-amber-600/5 dark:from-amber-500/20 dark:to-amber-600/10",
    borderColor: "border-amber-300/60 dark:border-amber-500/20",
    textColor: "text-amber-600 dark:text-amber-400",
    label: "Streak Milestone",
  },
  ACHIEVEMENT: {
    icon: Award,
    bgColor: "from-yellow-500/15 to-yellow-600/5 dark:from-yellow-500/20 dark:to-yellow-600/10",
    borderColor: "border-yellow-300/60 dark:border-yellow-500/20",
    textColor: "text-yellow-600 dark:text-yellow-400",
    label: "Achievement",
  },
  PROBLEM_REVIEW: {
    icon: Target,
    bgColor: "from-rose-500/15 to-rose-600/5 dark:from-rose-500/20 dark:to-rose-600/10",
    borderColor: "border-rose-300/60 dark:border-rose-500/20",
    textColor: "text-rose-600 dark:text-rose-400",
    label: "Review",
  },
};

const ANIMATION_STYLES = `
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-slideIn { animation: slideIn 0.4s ease-out forwards; }
`;

function RecentActivity({
  activities: propActivities = [],
  title = "Recent Activity",
  maxItems = 5,
  showViewAll = true,
  className = "",
  onActivityClick,
}) {
  const [activities, setActivities] = useState([]);
  const [hoveredId, setHoveredId] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (propActivities && propActivities.length > 0) {
      const mapped = propActivities.map((item, index) => {
        const type = item.type || "PROBLEM_SOLVED";
        return {
          ...item,
          id: item.id || `activity-${index}`,
          type: type,
          icon: item.icon || ACTIVITY_TYPES[type]?.icon || Code2,
          bgColor:
            item.bgColor ||
            ACTIVITY_TYPES[type]?.bgColor ||
            ACTIVITY_TYPES.PROBLEM_SOLVED.bgColor,
          borderColor:
            item.borderColor ||
            ACTIVITY_TYPES[type]?.borderColor ||
            ACTIVITY_TYPES.PROBLEM_SOLVED.borderColor,
          textColor:
            item.textColor ||
            ACTIVITY_TYPES[type]?.textColor ||
            ACTIVITY_TYPES.PROBLEM_SOLVED.textColor,
          label: item.label || ACTIVITY_TYPES[type]?.label || "Activity",
        };
      });
      setActivities(mapped);
    } else {
      setActivities([]);
    }
  }, [propActivities]);

  const displayedActivities = useMemo(() => {
    return expanded ? activities : activities.slice(0, maxItems);
  }, [activities, expanded, maxItems]);

  const handleActivityClick = (activity) => {
    if (onActivityClick) onActivityClick(activity);
  };

  const stats = useMemo(() => {
    if (activities.length === 0) return null;
    const todayActivities = activities.filter((a) => {
      if (
        a.time === "Just now" ||
        a.time === "2 hours ago" ||
        a.time === "Yesterday"
      ) {
        return true;
      }
      return (
        a.time.includes("hour") ||
        (a.time.includes("day") && !a.time.includes("week"))
      );
    });
    return {
      total: activities.length,
      today: todayActivities.length,
    };
  }, [activities]);

  return (
    <>
      <style>{ANIMATION_STYLES}</style>
      <Card
        className={`overflow-hidden border border-slate-200 dark:border-white/5 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 shadow-lg ${className}`}
      >
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/15 to-purple-500/15 dark:from-blue-500/20 dark:to-purple-500/20 border border-slate-200 dark:border-white/5">
                <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {title}
                </h3>
                {stats && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {stats.today} activities today • {stats.total} total
                  </p>
                )}
              </div>
            </div>
            {stats && stats.today > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                  Live
                </span>
              </div>
            )}
          </div>

          {/* Activity List */}
          <div className="space-y-3">
            {displayedActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 mb-3">
                  <Activity className="w-6 h-6 text-slate-400 dark:text-slate-600" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  No activities yet
                </p>
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
                  Start solving problems to see your progress
                </p>
              </div>
            ) : (
              displayedActivities.map((activity, index) => {
                const Icon = activity.icon;
                const isHovered = hoveredId === activity.id;

                return (
                  <div
                    key={activity.id || index}
                    className={`
                      group relative flex items-center gap-4 p-3 rounded-xl
                      transition-all duration-300 cursor-pointer
                      bg-gradient-to-r ${activity.bgColor}
                      border ${activity.borderColor}
                      hover:scale-[1.02] hover:shadow-lg
                      ${activity.isNew ? "animate-slideIn" : ""}
                    `}
                    onMouseEnter={() => setHoveredId(activity.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => handleActivityClick(activity)}
                  >
                    {isHovered && (
                      <div
                        className={`absolute inset-0 bg-gradient-to-r ${activity.bgColor} opacity-50 blur-xl transition-opacity duration-300 -z-10`}
                      />
                    )}

                    {activity.isNew && (
                      <div className="absolute -top-1 -right-1">
                        <span className="flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                      </div>
                    )}

                    <div className="flex-shrink-0 p-2.5 rounded-lg bg-slate-100/80 dark:bg-white/5 border border-slate-200 dark:border-white/5 transition-all duration-300 group-hover:scale-110">
                      <Icon className={`w-4 h-4 ${activity.textColor}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {activity.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {activity.time}
                        </span>
                        {activity.label && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-600" />
                            <span className="text-[10px] text-slate-500 dark:text-slate-500">
                              {activity.label}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div
                      className={`flex-shrink-0 transition-all duration-300 ${
                        isHovered
                          ? "opacity-100 translate-x-0"
                          : "opacity-0 -translate-x-2"
                      }`}
                    >
                      <ArrowUpRight className={`w-4 h-4 ${activity.textColor}`} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {activities.length > maxItems && (
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/5 flex items-center justify-between">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-200 flex items-center gap-1"
              >
                {expanded ? "Show less" : `View all (${activities.length})`}
                <ArrowUpRight
                  className={`w-3 h-3 transition-transform duration-300 ${
                    expanded ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showViewAll && !expanded && (
                <button className="text-xs px-3 py-1 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all duration-200">
                  View all
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

export default RecentActivity;