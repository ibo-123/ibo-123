import { AlertTriangle, Inbox, Loader2, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function LoadingState({
  label = "Loading…",
  rows = 3,
  className,
}: {
  label?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("surface-panel p-6", className)} aria-busy="true">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        {label}
      </div>
      <div className="mt-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

export function ErrorState({
  title = "Couldn't load this data",
  message,
  onRetry,
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("surface-panel p-6 text-center", className)} role="alert">
      <span className="mx-auto grid size-11 place-items-center rounded-full bg-destructive/15 text-destructive">
        <AlertTriangle className="size-5" aria-hidden />
      </span>
      <h3 className="mt-3 text-base font-semibold">{title}</h3>
      {message ? (
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{message}</p>
      ) : null}
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw className="size-4" aria-hidden />
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title = "Nothing here yet",
  message,
  action,
  className,
}: {
  title?: string;
  message?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("surface-panel p-8 text-center", className)}>
      <span className="mx-auto grid size-11 place-items-center rounded-full bg-secondary text-secondary-foreground">
        <Inbox className="size-5" aria-hidden />
      </span>
      <h3 className="mt-3 text-base font-semibold">{title}</h3>
      {message ? (
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{message}</p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
