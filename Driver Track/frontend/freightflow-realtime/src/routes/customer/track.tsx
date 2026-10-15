import { createFileRoute } from "@tanstack/react-router";
import RolePage from "@/components/layout/RolePage";
import TrackingPanel from "@/components/tracking/TrackingPanel";

export const Route = createFileRoute("/customer/track")({
  validateSearch: (search: Record<string, unknown>) => ({
    tripId: typeof search['tripId'] === "string" ? search['tripId'] : "",
  }),
  head: () => ({
    meta: [
      { title: "Live tracking — HabeshaFreight" },
      { name: "description", content: "Follow your driver's live GPS location, route and ETA." },
      { property: "og:title", content: "Live tracking — HabeshaFreight" },
      { property: "og:description", content: "Real-time shipment tracking on a live map." },
    ],
  }),
  component: CustomerTrackPage,
});

function CustomerTrackPage() {
  const { tripId } = Route.useSearch();

  return (
    <RolePage
      role="customer"
      title="Live tracking"
      description="Locations stream directly from your driver's device GPS."
    >
      <TrackingPanel initialTripId={tripId} />
    </RolePage>
  );
}
