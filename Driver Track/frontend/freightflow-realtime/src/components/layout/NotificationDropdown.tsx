import { Bell, CheckCheck } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { NotificationItem } from "@/types";

export function NotificationDropdown({
  notifications,
  onMarkAllRead,
}: {
  notifications: NotificationItem[];
  onMarkAllRead?: () => void;
}) {
  const unread = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-5" aria-hidden />
          {unread > 0 ? (
            <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          {onMarkAllRead && unread > 0 ? (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="flex items-center gap-1 text-xs font-normal text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="size-3.5" aria-hidden />
              Mark all read
            </button>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            You're all caught up.
          </p>
        ) : (
          <ScrollArea className="max-h-72">
            {notifications.map((item) => (
              <DropdownMenuItem key={item.id} className="flex-col items-start gap-0.5 py-2.5">
                <span className="flex w-full items-center gap-2 text-sm font-medium">
                  <span
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      item.level === "error"
                        ? "bg-destructive"
                        : item.level === "warning"
                          ? "bg-warning"
                          : item.level === "success"
                            ? "bg-success"
                            : "bg-info",
                    )}
                    aria-hidden
                  />
                  {item.title}
                </span>
                {item.body ? (
                  <span className="text-xs text-muted-foreground">{item.body}</span>
                ) : null}
                <span className="text-[11px] text-muted-foreground/80">{item.createdAt}</span>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NotificationDropdown;
