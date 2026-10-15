import React, { useState, useMemo } from "react";
import { Card, CardContent } from "../ui/card";
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Medal,
  Award,
  Star,
  Calendar,
  Clock,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  ChevronUp,
  ChevronDown,
  Eye,
  ExternalLink,
} from "lucide-react";

function ContestTable({ 
  history = [], 
  maxItems = 10, 
  showAll = false,
  className = "",
  onContestClick,
}) {
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  // Process and sort data
  const processedData = useMemo(() => {
    if (!history || history.length === 0) return [];

    let data = [...history];

    // Apply search filter
    if (searchTerm) {
      data = data.filter(contest =>
        contest.contestName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType === "positive") {
      data = data.filter(contest => contest.newRating > contest.oldRating);
    } else if (filterType === "negative") {
      data = data.filter(contest => contest.newRating < contest.oldRating);
    } else if (filterType === "neutral") {
      data = data.filter(contest => contest.newRating === contest.oldRating);
    }

    // Apply sorting
    if (sortField) {
      data.sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];
        
        if (sortField === "change") {
          aVal = a.newRating - a.oldRating;
          bVal = b.newRating - b.oldRating;
        }
        
        if (typeof aVal === "string") {
          return sortDirection === "asc" 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      });
    }

    // Limit items
    if (!showAll && maxItems > 0) {
      data = data.slice(0, maxItems);
    }

    return data;
  }, [history, searchTerm, filterType, sortField, sortDirection, showAll, maxItems]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!history || history.length === 0) return null;
    
    const changes = history.map(c => c.newRating - c.oldRating);
    const positive = changes.filter(c => c > 0).length;
    const negative = changes.filter(c => c < 0).length;
    const neutral = changes.filter(c => c === 0).length;
    const totalChange = changes.reduce((a, b) => a + b, 0);
    const avgChange = Math.round(totalChange / changes.length);
    const bestGain = Math.max(...changes);
    const worstLoss = Math.min(...changes);
    
    return {
      total: history.length,
      positive,
      negative,
      neutral,
      totalChange,
      avgChange,
      bestGain,
      worstLoss,
    };
  }, [history]);

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Get sort icon
  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-3 h-3" />
    ) : (
      <ChevronDown className="w-3 h-3" />
    );
  };

  // Get rating change color and icon
  const getChangeInfo = (change) => {
    if (change > 0) {
      return {
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        icon: ArrowUp,
        label: `+${change}`,
      };
    } else if (change < 0) {
      return {
        color: "text-rose-400",
        bg: "bg-rose-500/10",
        border: "border-rose-500/20",
        icon: ArrowDown,
        label: `${change}`,
      };
    } else {
      return {
        color: "text-slate-400",
        bg: "bg-slate-500/10",
        border: "border-slate-500/20",
        icon: Minus,
        label: "0",
      };
    }
  };

  // Get rank badge color
  const getRankColor = (rank) => {
    if (rank <= 10) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    if (rank <= 50) return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    if (rank <= 100) return "text-purple-400 bg-purple-500/10 border-purple-500/20";
    if (rank <= 500) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    return "text-slate-400 bg-slate-500/10 border-slate-500/20";
  };

  if (!history || history.length === 0) {
    return (
      <Card className={`overflow-hidden border-white/5 bg-gradient-to-br from-slate-900 to-slate-800 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/20 border border-white/5">
                <Trophy className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Recent Contests</h3>
                <p className="text-xs text-slate-400">Your contest history</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-12">
            <div className="p-4 rounded-full bg-slate-800/50 border border-white/5 mb-4">
              <Trophy className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-400 text-sm">No contest history available</p>
            <p className="text-slate-500 text-xs mt-1">Participate in contests to track your performance</p>
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
            <div className="p-2 rounded-xl bg-purple-500/20 border border-white/5">
              <Trophy className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Recent Contests</h3>
              <p className="text-xs text-slate-400">
                {history.length} contests • {stats?.totalChange > 0 ? '+' : ''}{stats?.totalChange || 0} total rating change
              </p>
            </div>
          </div>

          {/* Stats summary */}
          {stats && (
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                <ArrowUp className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-medium">{stats.positive}</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-rose-500/10 rounded-full border border-rose-500/20">
                <ArrowDown className="w-3 h-3 text-rose-400" />
                <span className="text-rose-400 font-medium">{stats.negative}</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-slate-500/10 rounded-full border border-slate-500/20">
                <Minus className="w-3 h-3 text-slate-400" />
                <span className="text-slate-400 font-medium">{stats.neutral}</span>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search contests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800/50 border border-white/5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/30 transition-colors"
            />
          </div>
          <div className="flex gap-2">
            {["all", "positive", "negative", "neutral"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                  ${filterType === type
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/20'
                    : 'bg-slate-800/30 text-slate-400 border border-white/5 hover:bg-slate-700/30'
                  }
                `}
              >
                {type === "all" ? "All" : type === "positive" ? "📈" : type === "negative" ? "📉" : "➖"}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th 
                  className="text-left py-3 text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-300 transition-colors"
                  onClick={() => handleSort("contestName")}
                >
                  <div className="flex items-center gap-1">
                    Contest
                    {getSortIcon("contestName")}
                  </div>
                </th>
                <th 
                  className="text-left py-3 text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-300 transition-colors"
                  onClick={() => handleSort("rank")}
                >
                  <div className="flex items-center gap-1">
                    Rank
                    {getSortIcon("rank")}
                  </div>
                </th>
                <th 
                  className="text-left py-3 text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-300 transition-colors"
                  onClick={() => handleSort("change")}
                >
                  <div className="flex items-center gap-1">
                    Change
                    {getSortIcon("change")}
                  </div>
                </th>
                <th className="text-left py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Rating
                </th>
                <th className="text-right py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {processedData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-500 text-sm">
                    No contests match your filters
                  </td>
                </tr>
              ) : (
                processedData.map((contest, index) => {
                  const change = contest.newRating - contest.oldRating;
                  const changeInfo = getChangeInfo(change);
                  const ChangeIcon = changeInfo.icon;
                  const rankColor = getRankColor(contest.rank);
                  const isTopRank = contest.rank <= 10;

                  return (
                    <tr
                      key={contest.contestId || index}
                      className={`
                        border-b border-white/5 hover:bg-white/5 transition-colors duration-200
                        ${index === 0 ? 'bg-white/5' : ''}
                      `}
                    >
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          {index === 0 && (
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          )}
                          <span className="text-sm font-medium text-white">
                            {contest.contestName}
                          </span>
                        </div>
                        {contest.date && (
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {new Date(contest.date).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5">
                        <div className={`
                          inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                          ${rankColor} border text-xs font-medium
                        `}>
                          {isTopRank && <Medal className="w-3 h-3" />}
                          #{contest.rank}
                        </div>
                      </td>
                      <td className="py-3.5">
                        <div className={`
                          inline-flex items-center gap-1 px-2.5 py-1 rounded-full
                          ${changeInfo.bg} border ${changeInfo.border}
                        `}>
                          <ChangeIcon className={`w-3 h-3 ${changeInfo.color}`} />
                          <span className={`text-sm font-semibold ${changeInfo.color}`}>
                            {changeInfo.label}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">
                            {contest.newRating}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            ({contest.oldRating})
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => onContestClick?.(contest)}
                          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
                          title="View contest details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!showAll && history.length > maxItems && (
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Showing {Math.min(processedData.length, maxItems)} of {history.length} contests
            </p>
            <button 
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
              onClick={() => window.location.href = '/contests'}
            >
              View all
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ContestTable;