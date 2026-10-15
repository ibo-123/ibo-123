import React, { useState } from "react";
import { Card, CardContent } from "../ui/card";
import {
  ArrowUp,
  ArrowDown,
  Minus,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Clock,
} from "lucide-react";

// Color mapping based on card type
const COLOR_SCHEMES = {
  blue: {
    bg: "from-blue-500/10 to-blue-600/5",
    border: "border-blue-500/20",
    iconBg: "from-blue-500/20 to-blue-600/10",
    iconColor: "text-blue-400",
    text: "text-blue-400",
    gradient: "from-blue-500 to-blue-400",
  },
  purple: {
    bg: "from-purple-500/10 to-purple-600/5",
    border: "border-purple-500/20",
    iconBg: "from-purple-500/20 to-purple-600/10",
    iconColor: "text-purple-400",
    text: "text-purple-400",
    gradient: "from-purple-500 to-purple-400",
  },
  emerald: {
    bg: "from-emerald-500/10 to-emerald-600/5",
    border: "border-emerald-500/20",
    iconBg: "from-emerald-500/20 to-emerald-600/10",
    iconColor: "text-emerald-400",
    text: "text-emerald-400",
    gradient: "from-emerald-500 to-emerald-400",
  },
  amber: {
    bg: "from-amber-500/10 to-amber-600/5",
    border: "border-amber-500/20",
    iconBg: "from-amber-500/20 to-amber-600/10",
    iconColor: "text-amber-400",
    text: "text-amber-400",
    gradient: "from-amber-500 to-amber-400",
  },
  rose: {
    bg: "from-rose-500/10 to-rose-600/5",
    border: "border-rose-500/20",
    iconBg: "from-rose-500/20 to-rose-600/10",
    iconColor: "text-rose-400",
    text: "text-rose-400",
    gradient: "from-rose-500 to-rose-400",
  },
  slate: {
    bg: "from-slate-500/10 to-slate-600/5",
    border: "border-slate-500/20",
    iconBg: "from-slate-500/20 to-slate-600/10",
    iconColor: "text-slate-400",
    text: "text-slate-400",
    gradient: "from-slate-500 to-slate-400",
  },
};

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  trendValue,
  color = "blue",
  size = "default",
  isLoading = false,
  onClick,
  className = "",
  subtitle,
  footer,
  badge,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const colorScheme = COLOR_SCHEMES[color] || COLOR_SCHEMES.blue;

  // Determine trend icon and color
  const getTrendInfo = () => {
    if (!trend) return null;
    if (trend === "up") {
      return {
        icon: ArrowUp,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
      };
    } else if (trend === "down") {
      return {
        icon: ArrowDown,
        color: "text-rose-400",
        bg: "bg-rose-500/10",
        border: "border-rose-500/20",
      };
    } else {
      return {
        icon: Minus,
        color: "text-slate-400",
        bg: "bg-slate-500/10",
        border: "border-slate-500/20",
      };
    }
  };

  const trendInfo = getTrendInfo();
  const TrendIcon = trendInfo?.icon;

  // Format value if it's a number
  const formattedValue = typeof value === "number" && value > 9999
    ? value.toLocaleString()
    : value;

  // Loading state
  if (isLoading) {
    return (
      <Card className={`overflow-hidden border-white/5 bg-gradient-to-br from-slate-900 to-slate-800 ${className}`}>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="flex items-start justify-between">
              <div className="space-y-3 flex-1">
                <div className="h-4 bg-slate-700/50 rounded w-24" />
                <div className="h-8 bg-slate-700/50 rounded w-32" />
                <div className="h-3 bg-slate-700/50 rounded w-20" />
              </div>
              <div className="h-12 w-12 bg-slate-700/50 rounded-xl" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Card sizes
  const sizeClasses = {
    sm: "p-4",
    default: "p-6",
    lg: "p-8",
  };

  const valueSize = {
    sm: "text-2xl",
    default: "text-3xl",
    lg: "text-4xl",
  };

  return (
    <Card
      className={`
        overflow-hidden transition-all duration-300
        bg-gradient-to-br ${colorScheme.bg}
        border ${colorScheme.border}
        hover:scale-[1.02] hover:shadow-xl
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
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

      <CardContent className={`relative ${sizeClasses[size]}`}>
        <div className="flex items-start justify-between gap-4">
          {/* Left content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium text-slate-400 truncate">
                {title}
              </p>
              {badge && (
                <span className={`
                  text-[10px] font-medium px-2 py-0.5 rounded-full
                  bg-gradient-to-r ${colorScheme.gradient}
                  text-white/90
                `}>
                  {badge}
                </span>
              )}
            </div>

            <h2 className={`${valueSize[size]} font-bold text-white tracking-tight`}>
              {formattedValue}
            </h2>

            {(description || subtitle) && (
              <p className="text-xs text-slate-500 mt-1.5">
                {description}
                {subtitle && (
                  <>
                    <span className="mx-1.5 text-slate-600">•</span>
                    <span className="text-slate-400">{subtitle}</span>
                  </>
                )}
              </p>
            )}

            {/* Trend indicator */}
            {trend && trendValue && (
              <div className="flex items-center gap-2 mt-2">
                <div className={`
                  flex items-center gap-1 px-2 py-0.5 rounded-full
                  ${trendInfo.bg} border ${trendInfo.border}
                `}>
                  <TrendIcon className={`w-3 h-3 ${trendInfo.color}`} />
                  <span className={`text-xs font-medium ${trendInfo.color}`}>
                    {trendValue}
                  </span>
                </div>
                {trend === "up" && (
                  <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
                )}
              </div>
            )}
          </div>

          {/* Icon */}
          {Icon && (
            <div className={`
              flex-shrink-0 p-3 rounded-xl
              bg-gradient-to-br ${colorScheme.iconBg}
              border ${colorScheme.border}
              transition-all duration-300
              ${isHovered ? "scale-110 rotate-3" : ""}
            `}>
              <Icon className={`w-6 h-6 ${colorScheme.iconColor}`} />
            </div>
          )}
        </div>

        {/* Footer content */}
        {footer && (
          <div className="mt-4 pt-3 border-t border-white/5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              {footer}
            </div>
          </div>
        )}

        {/* Progress bar (optional) */}
        {trend === "up" && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
        )}
        {trend === "down" && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />
        )}
      </CardContent>
    </Card>
  );
}

export default StatCard;