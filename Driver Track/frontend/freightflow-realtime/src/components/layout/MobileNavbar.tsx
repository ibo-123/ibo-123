import { Link, useLocation } from "@tanstack/react-router";
import { NAV_BY_ROLE } from "@/components/layout/nav-config";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

export function MobileNavbar({ role }: { role: Role }) {
  const { pathname } = useLocation();
  const items = NAV_BY_ROLE[role].filter((item) => item.mobile).slice(0, 5);

  return (
    <nav
      aria-label="Primary mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
        {items.map((item) => {
          const active =
            item.to.split("/").length === 2 ? pathname === item.to : pathname.startsWith(item.to);
          return (
            <li key={item.to}>
              <Link
                to={item.to as "/"}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="size-5" aria-hidden />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default MobileNavbar;
