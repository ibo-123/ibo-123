import { cn } from "@/lib/utils";
import type { TripStatus } from "@/types";

type AnyStatus = TripStatus | "available" | "on_delivery" | "offline" | "active" | "suspended" | "pending" | string;

const LABELS: Record<string, string> = {
  pending: "Pending",
  assigned: "Assigned",
  in_transit: "In transit",
  delayed: "Delayed",
  completed: "Completed",
  cancelled: "Cancelled",
  available: "Available",
  on_delivery: "On delivery",
  offline: "Offline",
  active: "Active",
  suspended: "Suspended",
};

const TONES: Record<string, string> = {
  pending: "bg-secondary text-secondary-foreground",
  assigned: "bg-info/15 text-info",
  in_transit: "bg-success/15 text-success",
  delayed: "bg-warning/20 text-warning",
  completed: "bg-success/15 text-success",
  cancelled: "bg-destructive/15 text-destructive",
  available: "bg-success/15 text-success",
  on_delivery: "bg-info/15 text-info",
  offline: "bg-muted text-muted-foreground",
  active: "bg-success/15 text-success",
  suspended: "bg-destructive/15 text-destructive",
};

export function StatusBadge({
  status,
  className,
  dot = true,
}: {
  status: AnyStatus;
  className?: string;
  dot?: boolean;
}) {
  const key = String(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        TONES[key] ?? "bg-secondary text-secondary-foreground",
        className,
      )}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current" aria-hidden /> : null}
      {LABELS[key] ?? key}
    </span>
  );
}

export default StatusBadge;
