import { Link } from "@tanstack/react-router";
import { Truck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NAV_BY_ROLE, ROLE_LABEL } from "@/components/layout/nav-config";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

export function SidebarNav({
  role,
  onNavigate,
  className,
  onClose,
}: {
  role: Role;
  onNavigate?: () => void;
  className?: string;
  onClose?: () => void;
}) {
  const items = NAV_BY_ROLE[role];

  return (
    <div className={cn("flex h-full flex-col bg-sidebar text-sidebar-foreground", className)}>
      <div className="flex items-center justify-between gap-2 px-5 py-5">
        <Link to="/" className="flex items-center gap-2.5" onClick={onNavigate}>
          <span className="grid size-9 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Truck className="size-5" aria-hidden />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-sm font-semibold">HabeshaFreight</span>
            <span className="block text-xs text-sidebar-foreground/60">{ROLE_LABEL[role]}</span>
          </span>
        </Link>
        {onClose ? (
          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
            <X className="size-4" aria-hidden />
            <span className="sr-only">Close navigation</span>
          </Button>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4" aria-label="Main navigation">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to as "/"}
            onClick={onNavigate}
            activeOptions={{ exact: item.to.split("/").length === 2 }}
            activeProps={{
              className: "bg-sidebar-accent text-sidebar-accent-foreground",
            }}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
          >
            <item.icon className="size-4 shrink-0" aria-hidden />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-5 py-4 text-xs text-sidebar-foreground/60">
        Realtime freight operations across Ethiopia.
      </div>
    </div>
  );
}

export default SidebarNav;
