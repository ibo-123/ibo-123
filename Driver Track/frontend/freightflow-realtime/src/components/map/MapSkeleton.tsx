import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function MapSkeleton({ className }: { className?: string | undefined }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-muted",
        className ?? "h-[420px] w-full",
      )}
      aria-busy="true"
      aria-label="Loading map"
    >
      <Skeleton className="h-full w-full" />
      <span className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
        Loading map…
      </span>
    </div>
  );
}

export default MapSkeleton;
