import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import RolePage from "@/components/layout/RolePage";
import BookTripDialog from "@/components/customer/BookTripDialog";
import TripTable from "@/components/common/TripTable";
import { ErrorState, LoadingState } from "@/components/common/States";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import tripService from "@/services/tripService";
import { apiErrorMessage } from "@/services/api";
import type { TripStatus } from "@/types";

const STATUSES: Array<TripStatus | "all"> = [
  "all",
  "pending",
  "assigned",
  "in_transit",
  "delayed",
  "completed",
  "cancelled",
];

export const Route = createFileRoute("/customer/trips")({
  head: () => ({
    meta: [
      { title: "My trips — HabeshaFreight" },
      { name: "description", content: "Every shipment you have booked, with status and ETA." },
      { property: "og:title", content: "My trips — HabeshaFreight" },
      { property: "og:description", content: "Manage and filter your HabeshaFreight shipments." },
    ],
  }),
  component: CustomerTripsPage,
});

function CustomerTripsPage() {
  const [status, setStatus] = useState<TripStatus | "all">("all");
  const [search, setSearch] = useState("");

  const trips = useQuery({
    queryKey: ["trips", "me", status],
    queryFn: () => tripService.myTrips(status === "all" ? undefined : { status }),
    retry: false,
  });

  const rows = (trips.data ?? []).filter((trip) =>
    search.trim()
      ? `${trip.tripId} ${trip.destination?.label ?? ""} ${trip.driver?.name ?? ""}`
          .toLowerCase()
          .includes(search.trim().toLowerCase())
      : true,
  );

  return (
    <RolePage
      role="customer"
      title="My trips"
      description="Filter, search and track everything you've shipped."
      actions={<BookTripDialog />}
    >
      <div className="space-y-4">
        <div className="surface-panel flex flex-col gap-3 p-4 sm:flex-row">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by Trip ID, destination or driver"
            aria-label="Search trips"
            className="sm:max-w-sm"
          />
          <Select value={status} onValueChange={(value) => setStatus(value as TripStatus | "all")}>
            <SelectTrigger className="sm:w-48" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((option) => (
                <SelectItem key={option} value={option}>
                  {option === "all" ? "All statuses" : option.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {trips.isPending ? (
          <LoadingState label="Loading trips…" />
        ) : trips.isError ? (
          <ErrorState
            message={apiErrorMessage(trips.error, "Could not load your trips.")}
            onRetry={() => trips.refetch()}
          />
        ) : (
          <TripTable trips={rows} />
        )}
      </div>
    </RolePage>
  );
}
