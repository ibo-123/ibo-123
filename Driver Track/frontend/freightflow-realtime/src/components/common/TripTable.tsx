import { Link } from "@tanstack/react-router";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import StatusBadge from "@/components/common/StatusBadge";
import { copyTripId } from "@/components/common/TripCard";
import { EmptyState } from "@/components/common/States";
import type { Trip } from "@/types";
import type { ReactNode } from "react";

export function TripTable({
  trips,
  rowAction,
  emptyMessage = "No trips match the current filters.",
}: {
  trips: Trip[];
  rowAction?: (trip: Trip) => ReactNode;
  emptyMessage?: string;
}) {
  if (trips.length === 0) {
    return <EmptyState title="No trips" message={emptyMessage} />;
  }

  return (
    <div className="surface-panel overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Trip ID</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead className="text-right">Distance</TableHead>
              <TableHead className="text-right">ETA</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trips.map((trip) => (
              <TableRow key={trip.tripId}>
                <TableCell className="font-medium">{trip.tripId}</TableCell>
                <TableCell className="max-w-[16rem] truncate text-muted-foreground">
                  {(trip.origin?.label ?? "—") + " → " + (trip.destination?.label ?? "—")}
                </TableCell>
                <TableCell>{trip.driver?.name ?? "Unassigned"}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {trip.distanceKm ? `${trip.distanceKm.toFixed(1)} km` : "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {trip.etaMinutes ? `${trip.etaMinutes} min` : "—"}
                </TableCell>
                <TableCell>
                  <StatusBadge status={trip.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" onClick={() => copyTripId(trip.tripId)}>
                      <Copy className="size-4" aria-hidden />
                      <span className="sr-only">Copy Trip ID</span>
                    </Button>
                    <Button asChild size="sm" variant="ghost">
                      <Link to="/track" search={{ tripId: trip.tripId }}>
                        Track
                      </Link>
                    </Button>
                    {rowAction?.(trip)}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default TripTable;
