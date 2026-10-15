import { Link } from "@tanstack/react-router";
import { Copy, MapPin, Navigation, Package, Route } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/common/StatusBadge";
import type { Trip } from "@/types";

export function copyTripId(tripId: string) {
  navigator.clipboard
    ?.writeText(tripId)
    .then(() => toast.success(`Trip ID ${tripId} copied`))
    .catch(() => toast.error("Could not copy the Trip ID"));
}

export function TripCard({ trip, actions }: { trip: Trip; actions?: React.ReactNode }) {
  return (
    <article className="surface-panel p-4 sm:p-5">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-lg bg-secondary text-secondary-foreground">
            <Package className="size-4" aria-hidden />
          </span>
          <div>
            <p className="font-display text-sm font-semibold tracking-tight">{trip.tripId}</p>
            <p className="text-xs text-muted-foreground">
              {trip.cargo ?? "General freight"}
              {trip.weightKg ? ` · ${trip.weightKg} kg` : ""}
            </p>
          </div>
        </div>
        <StatusBadge status={trip.status} />
      </header>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">Origin</dt>
          <dd className="flex items-center gap-1.5">
            <MapPin className="size-3.5 text-muted-foreground" aria-hidden />
            {trip.origin?.label ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Destination</dt>
          <dd className="flex items-center gap-1.5">
            <Navigation className="size-3.5 text-muted-foreground" aria-hidden />
            {trip.destination?.label ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Distance</dt>
          <dd className="flex items-center gap-1.5 tabular-nums">
            <Route className="size-3.5 text-muted-foreground" aria-hidden />
            {trip.distanceKm ? `${trip.distanceKm.toFixed(1)} km` : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Driver</dt>
          <dd>{trip.driver?.name ?? "Unassigned"}</dd>
        </div>
      </dl>

      <footer className="mt-4 flex flex-wrap items-center gap-2">
        <Button asChild size="sm" variant="secondary">
          <Link to="/track" search={{ tripId: trip.tripId }}>
            Track
          </Link>
        </Button>
        <Button size="sm" variant="ghost" onClick={() => copyTripId(trip.tripId)}>
          <Copy className="size-4" aria-hidden />
          Copy ID
        </Button>
        {actions}
      </footer>
    </article>
  );
}

export default TripCard;
