import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useAuth, ROLE_HOME } from "@/context/AuthContext";
import type { Role } from "@/types";

/**
 * Client-side route protection. The session lives in localStorage, so the gate
 * runs after hydration to avoid SSR mismatches.
 */
export function RoleGate({ role, children }: { role: Role; children: ReactNode }) {
  const { user, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      navigate({ to: "/login", search: { redirect: window.location.pathname }, replace: true });
      return;
    }
    if (user.role !== role) {
      navigate({ to: ROLE_HOME[user.role] as "/", replace: true });
    }
  }, [ready, user, role, navigate]);

  if (!ready || !user || user.role !== role) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Checking your access…
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default RoleGate;
