import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { LogOut, Menu, Moon, Settings, Sun, UserCircle, WifiOff, Wifi } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import SidebarNav from "@/components/layout/Sidebar";
import MobileNavbar from "@/components/layout/MobileNavbar";
import NotificationDropdown from "@/components/layout/NotificationDropdown";
import { ROLE_LABEL } from "@/components/layout/nav-config";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { useTheme } from "@/context/ThemeContext";
import type { NotificationItem, Role } from "@/types";

function titleCase(segment: string) {
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const DEMO_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    title: "Realtime channel ready",
    body: "Socket.IO will stream driver GPS as soon as a trip starts.",
    createdAt: "Just now",
    level: "info",
  },
];

export function DashboardLayout({
  role,
  title,
  description,
  actions,
  children,
}: {
  role: Role;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout, offlineSession } = useAuth();
  const { connected } = useSocket();
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const crumbs = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    return segments.map((segment, index) => ({
      label: titleCase(segment),
      href: `/${segments.slice(0, index + 1).join("/")}`,
      last: index === segments.length - 1,
    }));
  }, [pathname]);

  const initials = (user?.name ?? "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border lg:block">
        <SidebarNav role={role} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 border-sidebar-border p-0">
          <SidebarNav role={role} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
          <div className="flex items-center gap-2 px-4 py-3 sm:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="size-5" aria-hidden />
            </Button>

            <Breadcrumb className="hidden md:block">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/">Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {crumbs.map((crumb) => (
                  <span key={crumb.href} className="flex items-center gap-1.5">
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      {crumb.last ? (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link to={crumb.href as "/"}>{crumb.label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </span>
                ))}
              </BreadcrumbList>
            </Breadcrumb>

            <div className="ml-auto flex items-center gap-1">
              <span
                className="hidden items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground sm:flex"
                title={connected ? "Realtime connected" : "Realtime disconnected"}
              >
                {connected ? (
                  <Wifi className="size-3.5 text-success" aria-hidden />
                ) : (
                  <WifiOff className="size-3.5 text-muted-foreground" aria-hidden />
                )}
                {connected ? "Live" : "Offline"}
              </span>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? (
                  <Sun className="size-5" aria-hidden />
                ) : (
                  <Moon className="size-5" aria-hidden />
                )}
              </Button>

              <NotificationDropdown notifications={DEMO_NOTIFICATIONS} />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-2">
                    <span className="grid size-8 place-items-center rounded-full bg-primary font-display text-xs font-semibold text-primary-foreground">
                      {initials}
                    </span>
                    <span className="hidden text-left leading-tight sm:block">
                      <span className="block text-sm font-medium">{user?.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {ROLE_LABEL[role]}
                      </span>
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <span className="block text-sm font-medium">{user?.name}</span>
                    <span className="block text-xs text-muted-foreground">{user?.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={`/${role}/profile` as "/"}>
                      <UserCircle className="size-4" aria-hidden />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={(role === "dispatcher" ? "/dispatcher" : `/${role}/settings`) as "/"}>
                      <Settings className="size-4" aria-hidden />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      logout();
                      navigate({ to: "/login" });
                    }}
                  >
                    <LogOut className="size-4" aria-hidden />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="px-4 pb-28 pt-5 sm:px-6 lg:pb-10">
          {offlineSession ? (
            <div className="mb-4 rounded-lg border border-warning/40 bg-warning/10 px-4 py-2.5 text-xs text-foreground">
              Preview session — the HabeshaFreight API is not reachable. Live trips and GPS
              tracking activate once the backend is running at your VITE_API_URL.
            </div>
          ) : null}

          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-semibold sm:text-3xl">{title}</h1>
              {description ? (
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
            {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
          </div>

          {children}
        </main>
      </div>

      <MobileNavbar role={role} />
    </div>
  );
}

export default DashboardLayout;
