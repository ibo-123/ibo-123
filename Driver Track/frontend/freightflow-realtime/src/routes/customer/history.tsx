import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Gauge, Route as RouteIcon } from "lucide-react";
import RolePage from "@/components/layout/RolePage";
import StatCard from "@/components/common/StatCard";
import TripTable from "@/components/common/TripTable";
import { ErrorState, LoadingState } from "@/components/common/States";
import tripService from "@/services/tripService";
import { apiErrorMessage } from "@/services/api";

export const Route = createFileRoute("/customer/history")({
  head: () => ({
    meta: [
      { title: "Delivery history — HabeshaFreight" },
      { name: "description", content: "Completed and cancelled shipments with distance totals." },
      { property: "og:title", content: "Delivery history — HabeshaFreight" },
      { property: "og:description", content: "Review your past HabeshaFreight deliveries." },
    ],
  }),
  component: CustomerHistoryPage,
});

function CustomerHistoryPage() {
  const history = useQuery({
    queryKey: ["trips", "me", "history"],
    queryFn: () => tripService.myTrips({ status: "completed" }),
    retry: false,
  });

  const rows = history.data ?? [];
  const totalKm = rows.reduce((sum, trip) => sum + (trip.distanceKm ?? 0), 0);

  return (
    <RolePage
      role="customer"
      title="Delivery history"
      description="A record of every shipment that reached its destination."
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Delivered" value={rows.length} icon={CheckCircle2} tone="success" />
          <StatCard label="Total distance" value={`${totalKm.toFixed(0)} km`} icon={RouteIcon} />
          <StatCard
            label="Avg distance"
            value={rows.length ? `${(totalKm / rows.length).toFixed(1)} km` : "—"}
            icon={Gauge}
            tone="info"
          />
        </div>

        {history.isPending ? (
          <LoadingState label="Loading history…" />
        ) : history.isError ? (
          <ErrorState
            message={apiErrorMessage(history.error, "Could not load your history.")}
            onRetry={() => history.refetch()}
          />
        ) : (
          <TripTable trips={rows} emptyMessage="No completed deliveries yet." />
        )}
      </div>
    </RolePage>
  );
}
