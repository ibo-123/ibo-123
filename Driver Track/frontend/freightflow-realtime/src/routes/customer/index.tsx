import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, MapPin, Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import RolePage from "@/components/layout/RolePage";
import StatCard from "@/components/common/StatCard";
import TripCard from "@/components/common/TripCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import tripService from "@/services/tripService";
import { apiErrorMessage } from "@/services/api";

export const Route = createFileRoute("/customer/")({
  head: () => ({
    meta: [
      { title: "Customer overview — HabeshaFreight" },
      { name: "description", content: "Your active shipments, ETAs and delivery history." },
      { property: "og:title", content: "Customer overview — HabeshaFreight" },
      { property: "og:description", content: "Track every shipment you have booked." },
    ],
  }),
  component: CustomerOverview,
});

function CustomerOverview() {
  const trips = useQuery({
    queryKey: ["trips", "me"],
    queryFn: () => tripService.myTrips(),
    retry: false,
  });

  const list = trips.data ?? [];
  const active = list.filter((trip) => ["assigned", "in_transit", "delayed"].includes(trip.status));
  const completed = list.filter((trip) => trip.status === "completed");
  const pending = list.filter((trip) => trip.status === "pending");

  return (
    <RolePage
      role="customer"
      title="Your shipments"
      description="Live status for everything you have booked with HabeshaFreight."
      actions={
        <Button asChild>
          <Link to="/customer/trips">
            <Plus className="size-4" aria-hidden />
            Book shipment
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Active" value={active.length} icon={MapPin} tone="info" />
          <StatCard label="Awaiting driver" value={pending.length} icon={Clock} tone="warning" />
          <StatCard label="Delivered" value={completed.length} icon={CheckCircle2} tone="success" />
          <StatCard label="Total shipments" value={list.length} icon={Package} />
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">Active shipments</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/customer/track">Open live tracking</Link>
            </Button>
          </div>

          {trips.isPending ? (
            <LoadingState label="Loading your shipments…" />
          ) : trips.isError ? (
            <ErrorState
              message={apiErrorMessage(trips.error, "Could not load your shipments.")}
              onRetry={() => trips.refetch()}
            />
          ) : active.length === 0 ? (
            <EmptyState
              title="No active shipments"
              message="Book a shipment and you'll see live driver tracking here."
              action={
                <Button asChild>
                  <Link to="/customer/trips">Book a shipment</Link>
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {active.map((trip) => (
                <TripCard
                  key={trip.tripId}
                  trip={trip}
                  actions={
                    <Button asChild size="sm" variant="outline">
                      <Link to="/customer/track" search={{ tripId: trip.tripId }}>
                        Track live
                      </Link>
                    </Button>
                  }
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </RolePage>
  );
}
