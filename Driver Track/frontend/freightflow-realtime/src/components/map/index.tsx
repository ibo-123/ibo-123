import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import MapSkeleton from "@/components/map/MapSkeleton";
import type { FreightMapProps } from "@/components/map/map-types";

// Leaflet touches window at import time — keep it out of the SSR graph.
const FreightMap = lazy(() => import("@/components/map/FreightMap"));

function LazyMap(props: FreightMapProps) {
  return (
    <ClientOnly fallback={<MapSkeleton className={props.className} />}>
      <Suspense fallback={<MapSkeleton className={props.className} />}>
        <FreightMap {...props} />
      </Suspense>
    </ClientOnly>
  );
}

/** Driver-facing map: single real GPS position with accuracy ring. */
export function DriverMap(props: FreightMapProps) {
  return <LazyMap showAccuracy autoCenter zoom={15} {...props} />;
}

/** Customer tracking map: driver + destination + route. */
export function TrackingMap(props: FreightMapProps) {
  return <LazyMap showRoute autoCenter zoom={13} {...props} />;
}

/** Dispatcher fleet map: many drivers, fit-to-bounds. */
export function DispatcherMap(props: FreightMapProps) {
  return <LazyMap showAccuracy={false} autoCenter zoom={11} {...props} />;
}

export default LazyMap;
