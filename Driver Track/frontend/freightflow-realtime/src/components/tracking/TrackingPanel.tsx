import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, Copy, Gauge, MapPin, Navigation, Radio, Search, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StatusBadge from "@/components/common/StatusBadge";
import { ErrorState, LoadingState } from "@/components/common/States";
import { TrackingMap } from "@/components/map";
import { etaMinutes, haversineKm, type MapDriverMarker } from "@/components/map/map-types";
import { useTripWatcher } from "@/hooks/useTripTracking";
import { useTripContext } from "@/context/TripContext";
import { isValidTripId, normalizeTripId } from "@/lib/config";
import { apiErrorMessage } from "@/services/api";
import tripService from "@/services/tripService";

function timeAgo(timestamp: number | null) {
  if (!timestamp) return "No updates yet";
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

export function TrackingPanel({ initialTripId = "" }: { initialTripId?: string }) {
  const { watchedTripId, setWatchedTripId } = useTripContext();
  const [input, setInput] = useState(initialTripId || watchedTripId || "");
  const [tripId, setTripId] = useState<string | null>(
    initialTripId && isValidTripId(initialTripId) ? normalizeTripId(initialTripId) : watchedTripId,
  );
  const [inputError, setInputError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const tripQuery = useQuery({
    queryKey: ["trip", tripId],
    queryFn: () => tripService.getTrip(tripId as string),
    enabled: Boolean(tripId),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const live = useTripWatcher(tripId);
  const trip = tripQuery.data ?? null;

  useEffect(() => {
    const interval = window.setInterval(() => setTick((n) => n + 1), 10000);
    return () => window.clearInterval(interval);
  }, []);

  const location = live.location ?? trip?.currentLocation ?? null;

  const destination = useMemo(() => {
    if (typeof trip?.destination?.lat === "number" && typeof trip?.destination?.lng === "number") {
      return {
        lat: trip.destination.lat,
        lng: trip.destination.lng,
        label: trip.destination.label ?? "Destination",
      };
    }
    return null;
  }, [trip]);

  const remainingKm =
    location && destination ? haversineKm(location, destination) : (trip?.distanceKm ?? null);
  const eta = remainingKm ? etaMinutes(remainingKm) : (trip?.etaMinutes ?? null);

  const drivers: MapDriverMarker[] = location
    ? [
        {
          id: trip?.driver?.id ?? "driver",
          label: trip?.driver?.name ?? "Driver",
          ...(trip?.driver?.vehicle ? { sublabel: trip.driver.vehicle } : {}),
          location,
          live: live.live,
        },
      ]
    : [];

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const normalized = normalizeTripId(input);
    if (!isValidTripId(normalized)) {
      setInputError("Trip IDs look like TRIP-H5UGGP.");
      return;
    }
    setInputError(null);
    setTripId(normalized);
    setWatchedTripId(normalized);
  }

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="surface-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="tripId">Trip ID</Label>
          <Input
            id="tripId"
            value={input}
            onChange={(event) => setInput(event.target.value.toUpperCase())}
            placeholder="TRIP-H5UGGP"
            autoCapitalize="characters"
            spellCheck={false}
            className="h-12 font-mono tracking-wider"
            aria-invalid={Boolean(inputError)}
            aria-describedby={inputError ? "tripId-error" : undefined}
          />
          {inputError ? (
            <p id="tripId-error" className="text-xs text-destructive">
              {inputError}
            </p>
          ) : null}
        </div>
        <Button type="submit" size="lg" className="h-12 sm:w-40">
          <Search className="size-4" aria-hidden />
          Track trip
        </Button>
      </form>

      {!tripId ? (
        <div className="surface-panel p-8 text-center">
          <span className="mx-auto grid size-11 place-items-center rounded-full bg-secondary text-secondary-foreground">
            <Radio className="size-5" aria-hidden />
          </span>
          <h2 className="mt-3 font-display text-lg font-semibold">Enter a Trip ID to go live</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Your driver shares the Trip ID when they start the journey. Locations arrive straight
            from the driver's device GPS.
          </p>
        </div>
      ) : tripQuery.isPending ? (
        <LoadingState label={`Looking up ${tripId}…`} />
      ) : tripQuery.isError ? (
        <ErrorState
          title={`Trip ${tripId} not found`}
          message={apiErrorMessage(tripQuery.error, "We couldn't load this trip.")}
          onRetry={() => tripQuery.refetch()}
        />
      ) : trip ? (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TrackingMap
              drivers={drivers}
              destination={destination}
              className="h-[320px] w-full sm:h-[460px]"
              emptyLabel="No GPS fix received yet — the driver's device will appear here."
            />
          </div>

          <div className="space-y-4">
            <div className="surface-panel p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Trip ID</p>
                  <p className="font-mono text-lg font-semibold">{trip.tripId}</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard?.writeText(trip.tripId);
                    toast.success("Trip ID copied");
                  }}
                  aria-label="Copy Trip ID"
                >
                  <Copy className="size-4" aria-hidden />
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={trip.status} />
                <span
                  className={
                    live.live
                      ? "inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success"
                      : "inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                  }
                >
                  <span className="size-1.5 rounded-full bg-current" aria-hidden />
                  {live.live ? "Live GPS" : "Offline"}
                </span>
              </div>
            </div>

            <dl className="surface-panel divide-y divide-border p-0 text-sm">
              <div className="flex items-start justify-between gap-3 p-4">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <Truck className="size-4" aria-hidden />
                  Driver
                </dt>
                <dd className="text-right font-medium">
                  {trip.driver?.name ?? "Awaiting assignment"}
                  {trip.driver?.vehicle ? (
                    <span className="block text-xs font-normal text-muted-foreground">
                      {trip.driver.vehicle}
                    </span>
                  ) : null}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3 p-4">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="size-4" aria-hidden />
                  Driver location
                </dt>
                <dd className="text-right font-mono text-xs">
                  {location
                    ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
                    : "Waiting for GPS"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3 p-4">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <Navigation className="size-4" aria-hidden />
                  Destination
                </dt>
                <dd className="text-right font-medium">{trip.destination?.label ?? "—"}</dd>
              </div>
              <div className="flex items-start justify-between gap-3 p-4">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <Gauge className="size-4" aria-hidden />
                  Remaining distance
                </dt>
                <dd className="text-right font-medium tabular-nums">
                  {remainingKm ? `${remainingKm.toFixed(1)} km` : "—"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3 p-4">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="size-4" aria-hidden />
                  ETA
                </dt>
                <dd className="text-right font-medium tabular-nums">{eta ? `${eta} min` : "—"}</dd>
              </div>
              <div className="flex items-start justify-between gap-3 p-4">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <Radio className="size-4" aria-hidden />
                  Last update
                </dt>
                <dd className="text-right text-xs text-muted-foreground" data-tick={tick}>
                  {timeAgo(live.lastUpdate)}
                </dd>
              </div>
            </dl>

            {live.error ? (
              <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {live.error}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default TrackingPanel;
