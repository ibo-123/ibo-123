import React, { useMemo } from "react";
import {
  Trophy,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  Users,
  Award,
  ArrowUpRight,
  Medal,
  Target,
} from "lucide-react";
import { Card, CardContent } from "../ui/card";

const getRatingColor = (rating) => {
  if (typeof rating !== "number") return "text-slate-400";
  if (rating >= 2400) return "text-red-400";
  if (rating >= 2100) return "text-orange-400";
  if (rating >= 1900) return "text-purple-400";
  if (rating >= 1600) return "text-blue-400";
  if (rating >= 1400) return "text-cyan-400";
  if (rating >= 1200) return "text-emerald-400";
  return "text-slate-400";
};

const getRankBadge = (rank) => {
  if (!rank || rank === "—") return null;
  const r = parseInt(rank, 10);
  if (isNaN(r)) return null;
  if (r === 1)
    return {
      icon: Trophy,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10 border-yellow-500/20",
    };
  if (r <= 10)
    return {
      icon: Medal,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
    };
  if (r <= 100)
    return {
      icon: Award,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    };
  return {
    icon: Target,
    color: "text-slate-400",
    bg: "bg-slate-500/10 border-slate-500/20",
  };
};

function RecentContest({
  contests = [],
  title = "Recent Contests",
  maxItems = 5,
  className = "",
  onContestClick,
}) {
  const displayed = useMemo(
    () => contests.slice(0, maxItems),
    [contests, maxItems]
  );

  const stats = useMemo(() => {
    if (!contests.length) return null;
    const changes = contests
      .map((c) => (c.newRating ?? 0) - (c.oldRating ?? 0))
      .filter((c) => c !== 0);
    const positive = changes.filter((c) => c > 0).length;
    const best = Math.max(...changes, 0);
    return {
      total: contests.length,
      positive,
      best,
      trend:
        positive > changes.length / 2
          ? "up"
          : positive < changes.length / 2
          ? "down"
          : "neutral",
    };
  }, [contests]);

  // Empty state
  if (displayed.length === 0) {
    return (
      <Card
        className={`overflow-hidden border-white/5 bg-gradient-to-br from-slate-900 to-slate-800 ${className}`}
      >
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-white/5">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{title}</h3>
              <p className="text-xs text-slate-400">No contests yet</p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-10">
            <div className="p-4 rounded-full bg-slate-800/50 border border-white/5 mb-3">
              <Trophy className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-400 text-sm">No contest history</p>
            <p className="text-slate-500 text-xs mt-1">
              Participate in a contest to see your results here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`overflow-hidden border-white/5 bg-gradient-to-br from-slate-900 to-slate-800 ${className}`}
    >
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-white/5">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{title}</h3>
              {stats && (
                <p className="text-xs text-slate-400">
                  {stats.total} contests · {stats.positive} positive
                </p>
              )}
            </div>
          </div>

          {stats?.trend === "up" && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] font-medium text-emerald-400">
                Improving
              </span>
            </div>
          )}
        </div>

        {/* Contest list */}
        <div className="space-y-3">
          {displayed.map((contest, index) => {
            const change =
              (contest.newRating ?? 0) - (contest.oldRating ?? 0);
            const changePositive = change > 0;
            const changeNegative = change < 0;
            const rankBadge = getRankBadge(contest.rank);
            const RankIcon = rankBadge?.icon;

            return (
              <div
                key={contest.contestId || index}
                onClick={() => onContestClick?.(contest)}
                className={`
                  group relative flex items-center gap-4 p-3 rounded-xl
                  bg-white/[0.02] border border-white/5
                  hover:bg-white/[0.04] hover:border-white/10
                  transition-all duration-300 cursor-pointer
                  hover:scale-[1.01]
                `}
              >
                {/* Rank badge */}
                <div
                  className={`
                    flex-shrink-0 w-10 h-10 rounded-lg
                    flex items-center justify-center
                    ${
                      rankBadge
                        ? rankBadge.bg + " border"
                        : "bg-white/5 border border-white/5"
                    }
                  `}
                >
                  {RankIcon ? (
                    <RankIcon
                      className={`w-4 h-4 ${rankBadge.color}`}
                    />
                  ) : (
                    <Trophy className="w-4 h-4 text-slate-500" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {contest.contestName || "Contest"}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {contest.ratingUpdateTimeSeconds && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        {new Date(
                          contest.ratingUpdateTimeSeconds * 1000
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    )}
                    {contest.rank && contest.rank !== "—" && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-slate-600" />
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Users className="w-2.5 h-2.5" />
                          Rank #{contest.rank}
                        </span>
                      </>
                    )}
                    {contest.problemsSolved != null && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-slate-600" />
                        <span className="text-[10px] text-slate-400">
                          {contest.problemsSolved} solved
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Rating change */}
                <div className="flex-shrink-0 text-right">
                  <p
                    className={`text-sm font-bold ${getRatingColor(
                      contest.newRating
                    )}`}
                  >
                    {contest.newRating ?? "—"}
                  </p>
                  {change !== 0 && (
                    <p
                      className={`text-[10px] font-medium flex items-center justify-end gap-0.5 ${
                        changePositive
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      {changePositive ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {changePositive ? "+" : ""}
                      {change}
                    </p>
                  )}
                </div>

                {/* Hover arrow */}
                <div
                  className={`
                    flex-shrink-0 transition-all duration-300
                    opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0
                  `}
                >
                  <ArrowUpRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {contests.length > maxItems && (
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
            <button className="text-xs text-slate-400 hover:text-white transition-colors duration-200 flex items-center gap-1">
              View all ({contests.length})
              <ArrowUpRight className="w-3 h-3" />
            </button>
            {stats?.best > 0 && (
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Best: +{stats.best}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RecentContest;