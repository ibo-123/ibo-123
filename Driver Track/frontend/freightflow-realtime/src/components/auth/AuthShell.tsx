import { Link } from "@tanstack/react-router";
import { Truck } from "lucide-react";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hero-gradient relative hidden flex-col justify-between p-10 text-sidebar-foreground lg:flex">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Truck className="size-5" aria-hidden />
          </span>
          <span className="font-display text-lg font-semibold">HabeshaFreight</span>
        </Link>
        <div className="max-w-md">
          <h2 className="font-display text-3xl font-semibold leading-tight">
            Every shipment, <span className="text-gradient-accent">live on the map</span>.
          </h2>
          <p className="mt-3 text-sm text-sidebar-foreground/70">
            Real device GPS from drivers, streamed over Socket.IO to customers and dispatchers the
            moment a trip starts.
          </p>
        </div>
        <p className="text-xs text-sidebar-foreground/50">
          Addis Ababa · Adama · Dire Dawa · Mekelle · Hawassa
        </p>
      </div>

      <div className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Truck className="size-5" aria-hidden />
            </span>
            <span className="font-display text-lg font-semibold">HabeshaFreight</span>
          </Link>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p> : null}
          <div className="mt-7">{children}</div>
          {footer ? <div className="mt-6 text-sm text-muted-foreground">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}

export default AuthShell;
