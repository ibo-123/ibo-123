import { Card, CardContent } from "../ui/card";
import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  Code2,
  Target,
  Zap,
  Award,
  Sparkles,
  BarChart3,
} from "lucide-react";

const COLOR_STYLES = {
  blue: {
    iconBg: "bg-blue-500/10 border-blue-300/60 dark:border-blue-500/10",
    iconText: "text-blue-600 dark:text-blue-400",
    gradient: "from-blue-500 to-blue-400",
  },
  purple: {
    iconBg: "bg-purple-500/10 border-purple-300/60 dark:border-purple-500/10",
    iconText: "text-purple-600 dark:text-purple-400",
    gradient: "from-purple-500 to-purple-400",
  },
  amber: {
    iconBg: "bg-amber-500/10 border-amber-300/60 dark:border-amber-500/10",
    iconText: "text-amber-600 dark:text-amber-400",
    gradient: "from-amber-500 to-amber-400",
  },
  emerald: {
    iconBg: "bg-emerald-500/10 border-emerald-300/60 dark:border-emerald-500/10",
    iconText: "text-emerald-600 dark:text-emerald-400",
    gradient: "from-emerald-500 to-emerald-400",
  },
  rose: {
    iconBg: "bg-rose-500/10 border-rose-300/60 dark:border-rose-500/10",
    iconText: "text-rose-600 dark:text-rose-400",
    gradient: "from-rose-500 to-rose-400",
  },
  sky: {
    iconBg: "bg-sky-500/10 border-sky-300/60 dark:border-sky-500/10",
    iconText: "text-sky-600 dark:text-sky-400",
    gradient: "from-sky-500 to-sky-400",
  },
  cyan: {
    iconBg: "bg-cyan-500/10 border-cyan-300/60 dark:border-cyan-500/10",
    iconText: "text-cyan-600 dark:text-cyan-400",
    gradient: "from-cyan-500 to-cyan-400",
  },
  indigo: {
    iconBg: "bg-indigo-500/10 border-indigo-300/60 dark:border-indigo-500/10",
    iconText: "text-indigo-600 dark:text-indigo-400",
    gradient: "from-indigo-500 to-indigo-400",
  },
};

const iconMap = {
  Implementation: Code2,
  Math: Zap,
  Greedy: Target,
  "Dynamic Programming": TrendingUp,
  Graphs: Award,
  "Binary Search": Sparkles,
  "Easy (≤ 1200)": Target,
  "Medium (1201–1800)": TrendingUp,
  "Hard (> 1800)": Award,
};

const FADE_IN_STYLES = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

function ProgressCard({
  data: propData = [],
  title = "Problem Tags",
  className = "",
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const progress = useMemo(() => {
    if (!propData || propData.length === 0) return [];
    const maxVal = Math.max(
      ...propData.map((p) => p.rawCount ?? p.value ?? 0),
      1
    );
    return propData.map((item) => ({
      ...item,
      percent: Math.round(((item.rawCount ?? item.value ?? 0) / maxVal) * 100),
    }));
  }, [propData]);

  const totalItems = progress.reduce(
    (s, p) => s + (p.rawCount ?? p.value ?? 0),
    0
  );

  if (progress.length === 0) {
    return (
      <Card
        className={`overflow-hidden border border-slate-200 dark:border-0 shadow-xl bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 ${className}`}
      >
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/15 to-blue-500/15 dark:from-purple-500/20 dark:to-blue-500/20 border border-slate-200 dark:border-white/5">
              <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No data yet
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-10">
            <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 mb-4">
              <Code2 className="w-8 h-8 text-slate-400 dark:text-slate-600" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              No problems synced yet
            </p>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
              Sync your Codeforces account to see your topic breakdown
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <style>{FADE_IN_STYLES}</style>
      <Card
        className={`overflow-hidden border border-slate-200 dark:border-0 shadow-xl bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 ${className}`}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/15 to-blue-500/15 dark:from-purple-500/20 dark:to-blue-500/20 border border-slate-200 dark:border-white/5">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {title}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {progress.length}{" "}
                  {progress.length === 1 ? "category" : "categories"} ·{" "}
                  {totalItems} solved
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {progress.map((item, index) => {
              const Icon = iconMap[item.name] || Code2;
              const colorStyle = COLOR_STYLES[item.color] || COLOR_STYLES.blue;
              const pct = mounted ? item.percent : 0;

              return (
                <div
                  key={item.name}
                  className="group"
                  style={{
                    animation: `fadeIn 0.4s ease-out ${index * 0.06}s both`,
                  }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`p-1.5 rounded-lg border ${colorStyle.iconBg}`}
                      >
                        <Icon
                          className={`w-3.5 h-3.5 ${colorStyle.iconText}`}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {item.rawCount ?? item.value ?? 0}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {pct >= 80
                          ? "🚀"
                          : pct >= 60
                          ? "📈"
                          : pct >= 40
                          ? "📊"
                          : "📚"}
                      </span>
                    </div>
                  </div>

                  <div className="relative w-full h-2.5 bg-slate-200 dark:bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r ${colorStyle.gradient} transition-all duration-1000 ease-out`}
                      style={{ width: `${pct}%` }}
                    >
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/5 flex items-center justify-between">
            <span className="text-[10px] text-slate-500 dark:text-slate-500">
              Based on synced Codeforces submissions
            </span>
            <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-500">
              <span>{progress.filter((p) => p.percent >= 70).length}</span>
              <span className="text-slate-400 dark:text-slate-600">/</span>
              <span>{progress.length}</span>
              <span className="ml-1">dominant topics</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export default ProgressCard;