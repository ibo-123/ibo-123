import { Phone, Star, Truck } from "lucide-react";
import type { ReactNode } from "react";
import StatusBadge from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/States";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Driver } from "@/types";

export function DriverCard({ driver, actions }: { driver: Driver; actions?: ReactNode }) {
  return (
    <article className="surface-panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-secondary font-display text-sm font-semibold text-secondary-foreground">
            {driver.name
              .split(" ")
              .map((part) => part[0])
              .slice(0, 2)
              .join("")}
          </span>
          <div>
            <p className="text-sm font-semibold">{driver.name}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Truck className="size-3.5" aria-hidden />
              {driver.vehicle ?? "Vehicle unassigned"}
              {driver.plate ? ` · ${driver.plate}` : ""}
            </p>
          </div>
        </div>
        <StatusBadge status={driver.status} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {driver.phone ? (
          <span className="flex items-center gap-1">
            <Phone className="size-3.5" aria-hidden />
            {driver.phone}
          </span>
        ) : null}
        {typeof driver.rating === "number" ? (
          <span className="flex items-center gap-1">
            <Star className="size-3.5" aria-hidden />
            {driver.rating.toFixed(1)}
          </span>
        ) : null}
        {driver.activeTripId ? <span>Active: {driver.activeTripId}</span> : null}
      </div>
      {actions ? <div className="mt-3 flex flex-wrap gap-2">{actions}</div> : null}
    </article>
  );
}

export function DriverTable({
  drivers,
  rowAction,
}: {
  drivers: Driver[];
  rowAction?: (driver: Driver) => ReactNode;
}) {
  if (drivers.length === 0) {
    return <EmptyState title="No drivers" message="No drivers match the current filters." />;
  }
  return (
    <div className="surface-panel overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Driver</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Trips</TableHead>
              <TableHead className="text-right">Distance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.map((driver) => (
              <TableRow key={driver.id}>
                <TableCell className="font-medium">{driver.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {driver.vehicle ?? "—"}
                  {driver.plate ? ` · ${driver.plate}` : ""}
                </TableCell>
                <TableCell className="text-muted-foreground">{driver.phone ?? "—"}</TableCell>
                <TableCell className="text-right tabular-nums">{driver.totalTrips ?? 0}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {driver.totalDistanceKm ? `${driver.totalDistanceKm.toFixed(0)} km` : "—"}
                </TableCell>
                <TableCell>
                  <StatusBadge status={driver.status} />
                </TableCell>
                <TableCell className="text-right">{rowAction?.(driver)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
