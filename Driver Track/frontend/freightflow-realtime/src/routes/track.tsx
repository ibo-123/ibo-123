import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import TrackingPanel from "@/components/tracking/TrackingPanel";

export const Route = createFileRoute("/track")({
  validateSearch: (search: Record<string, unknown>) => ({
    tripId: typeof search['tripId'] === "string" ? search['tripId'] : "",
  }),
  head: () => ({
    meta: [
      { title: "Track a shipment — HabeshaFreight" },
      {
        name: "description",
        content:
          "Enter your HabeshaFreight Trip ID to follow your driver's live GPS location, route and ETA.",
      },
      { property: "og:title", content: "Track a shipment — HabeshaFreight" },
      {
        property: "og:description",
        content: "Live driver location, route and ETA for any HabeshaFreight Trip ID.",
      },
    ],
  }),
  component: TrackPage,
});

function TrackPage() {
  const { tripId } = Route.useSearch();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Truck className="size-5" aria-hidden />
            </span>
            <span className="font-display text-base font-semibold">HabeshaFreight</span>
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <ArrowLeft className="size-4" aria-hidden />
              Home
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">Track your shipment</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Paste the Trip ID your driver shared. Locations stream in real time from the driver's
          device — nothing is simulated.
        </p>
        <div className="mt-6">
          <TrackingPanel initialTripId={tripId} />
        </div>
      </main>
    </div>
  );
}
