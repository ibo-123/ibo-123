import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { useEffect, useState } from "react";
import "./DriverMap.css"; // We'll create this CSS file

/*
|--------------------------------------------------------------------------
| Driver icon (Green custom marker)
|--------------------------------------------------------------------------
*/

const driverIcon = new L.Icon({
  iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 36'%3E%3Cpath d='M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24c0-6.627-5.373-12-12-12z' fill='%233B82F6'/%3E%3Ccircle cx='12' cy='12' r='4' fill='white'/%3E%3C/svg%3E",
  iconSize: [30, 45],
  iconAnchor: [15, 45],
  popupAnchor: [0, -45],
});

/*
|--------------------------------------------------------------------------
| Destination icon (Red custom marker)
|--------------------------------------------------------------------------
*/

const destinationIcon = new L.Icon({
  iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 36'%3E%3Cpath d='M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24c0-6.627-5.373-12-12-12z' fill='%23EF4444'/%3E%3Ccircle cx='12' cy='12' r='4' fill='white'/%3E%3C/svg%3E",
  iconSize: [30, 45],
  iconAnchor: [15, 45],
  popupAnchor: [0, -45],
});

/*
|--------------------------------------------------------------------------
| Keep map centered on driver
|--------------------------------------------------------------------------
*/

function MapCenter({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, 14, {
        animate: true,
        duration: 1,
      });
    }
  }, [position, map]);

  return null;
}

/*
|--------------------------------------------------------------------------
| Driver Map
|--------------------------------------------------------------------------
*/

function DriverMap({
  location,
  onRouteInfo,
  destination,
}) {
  const [route, setRoute] = useState([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | Calculate driver position
  |--------------------------------------------------------------------------
  */

  const driverPosition = location
    ? [location.latitude, location.longitude]
    : null;

  /*
  |--------------------------------------------------------------------------
  | Calculate destination position
  |--------------------------------------------------------------------------
  */

  const destinationPosition = destination
    ? [destination.latitude, destination.longitude]
    : null;

  /*
  |--------------------------------------------------------------------------
  | Get route from OSRM
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!location || !destination) {
      setRoute([]);
      setRouteInfo(null);
      return;
    }

    const getRoute = async () => {
      try {
        setRouteLoading(true);

        const start = `${location.longitude},${location.latitude}`;
        const end = `${destination.longitude},${destination.latitude}`;

        const url =
          `https://router.project-osrm.org/route/v1/driving/` +
          `${start};${end}` +
          `?overview=full&geometries=geojson`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Failed to calculate route");
        }

        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          const routeData = data.routes[0];

          const distanceKm = routeData.distance / 1000;
          const durationMinutes = routeData.duration / 60;

          const info = {
            distanceKm,
            durationMinutes,
          };

          setRouteInfo(info);

          if (onRouteInfo) {
            onRouteInfo(info);
          }

          const coordinates = routeData.geometry.coordinates;
          const leafletCoordinates = coordinates.map(
            ([longitude, latitude]) => [latitude, longitude]
          );

          setRoute(leafletCoordinates);
        }
      } catch (error) {
        console.error("Route error:", error);
        setRoute([]);
        setRouteInfo(null);

        if (onRouteInfo) {
          onRouteInfo(null);
        }
      } finally {
        setRouteLoading(false);
      }
    };

    getRoute();
  }, [
    location?.latitude,
    location?.longitude,
    destination?.latitude,
    destination?.longitude,
    onRouteInfo,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Loading state
  |--------------------------------------------------------------------------
  */

  if (!destinationPosition) {
    return (
      <div className="map-loading-state">
        <div className="map-loading-content">
          <div className="loading-spinner"></div>
          <p>Loading destination...</p>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Map center
  |--------------------------------------------------------------------------
  */

  const mapCenter = driverPosition || destinationPosition;

  return (
    <div className="driver-map-container">
      {/* Route Info Bar */}
      {routeInfo && (
        <div className="route-info-bar">
          <div className="route-info-item">
            <span className="route-info-label">📍 Distance</span>
            <span className="route-info-value">
              {routeInfo.distanceKm.toFixed(1)} km
            </span>
          </div>
          <div className="route-info-divider"></div>
          <div className="route-info-item">
            <span className="route-info-label">⏱️ Estimated Time</span>
            <span className="route-info-value">
              {Math.round(routeInfo.durationMinutes)} min
            </span>
          </div>
          <div className="route-info-divider"></div>
          <div className="route-info-item">
            <span className="route-info-label">🔄 Status</span>
            <span className="route-info-value status-live">
              ● Live Tracking
            </span>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="map-wrapper">
        <MapContainer
          center={mapCenter}
          zoom={14}
          scrollWheelZoom={true}
          className="leaflet-container-custom"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapCenter position={mapCenter} />

          {/* Driver Marker */}
          {location && (
            <Marker position={driverPosition} icon={driverIcon}>
              <Popup className="custom-popup">
                <div className="popup-content">
                  <h4>🚚 Driver</h4>
                  <p>
                    <strong>Status:</strong> 
                    <span className="status-badge live">● Live</span>
                  </p>
                  <p>
                    <strong>Location:</strong>
                    <br />
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Destination Marker */}
          <Marker position={destinationPosition} icon={destinationIcon}>
            <Popup className="custom-popup">
              <div className="popup-content">
                <h4>📍 Destination</h4>
                <p>
                  <strong>Address:</strong>
                  <br />
                  {destination.address || "Destination Location"}
                </p>
                <p>
                  <strong>Coordinates:</strong>
                  <br />
                  {destination.latitude.toFixed(6)}, {destination.longitude.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>

          {/* Route Polyline */}
          {route.length > 0 && (
            <Polyline
              positions={route}
              pathOptions={{
                weight: 5,
                color: '#3B82F6',
                opacity: 0.8,
                dashArray: null,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          )}
        </MapContainer>

        {/* Route Loading Overlay */}
        {routeLoading && (
          <div className="route-loading-overlay">
            <div className="route-loading-content">
              <div className="loading-spinner small"></div>
              <p>Calculating route...</p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="map-legend">
        <div className="legend-item">
          <div className="legend-marker driver-marker"></div>
          <span>Driver Location</span>
        </div>
        <div className="legend-item">
          <div className="legend-marker destination-marker"></div>
          <span>Destination</span>
        </div>
        <div className="legend-item">
          <div className="legend-line"></div>
          <span>Route</span>
        </div>
      </div>
    </div>
  );
}

export default DriverMap;