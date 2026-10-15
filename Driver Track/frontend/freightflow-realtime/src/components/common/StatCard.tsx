import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  hint?: string;
  trend?: { value: string; positive?: boolean };
  tone?: "default" | "success" | "warning" | "info" | "destructive";
  className?: string;
}

const toneMap = {
  default: "bg-secondary text-secondary-foreground",
  success: "bg-success/15 text-success",
  warning: "bg-warning/20 text-warning",
  info: "bg-info/15 text-info",
  destructive: "bg-destructive/15 text-destructive",
} as const;

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  trend,
  tone = "default",
  className,
}: StatCardProps) {
  return (
    <div className={cn("surface-panel p-4 sm:p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {Icon ? (
          <span className={cn("grid size-9 place-items-center rounded-lg", toneMap[tone])}>
            <Icon className="size-4" aria-hidden />
          </span>
        ) : null}
      </div>
      <p className="mt-3 font-display text-3xl font-semibold tabular-nums">{value}</p>
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        {trend ? (
          <span className={cn("font-medium", trend.positive ? "text-success" : "text-destructive")}>
            {trend.value}
          </span>
        ) : null}
        {hint ? <span>{hint}</span> : null}
      </div>
    </div>
  );
}

export default StatCard;
