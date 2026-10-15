
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import socket from "../socket";
import DriverMap from "../components/DriverMap";

const API_URL = import.meta.env.VITE_API_URL;

function Customer() {
  const { tripId: urlTripId } = useParams();
  const navigate = useNavigate();

  const [searchTripId, setSearchTripId] = useState(
    urlTripId || ""
  );

  const [trip, setTrip] = useState(null);
  const [location, setLocation] = useState(null);

  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Load Trip from MongoDB
  |--------------------------------------------------------------------------
  */

  const loadTrip = async (id) => {
    try {
      setLoading(true);
      setError("");
      setTrip(null);
      setLocation(null);
      setRouteInfo(null);

      const cleanId = id.trim().toUpperCase();

      console.log("🔎 Loading trip:", cleanId);
      console.log("🌐 API server:", API_URL);

      const response = await fetch(
        `${API_URL}/api/trips/${cleanId}`
      );

      if (!response.ok) {
        throw new Error("Trip not found");
      }

      const data = await response.json();

      console.log("📦 Trip loaded:", data);

      setTrip(data);

      /*
      |--------------------------------------------------------------------------
      | Load existing driver location
      |--------------------------------------------------------------------------
      */

      if (data.currentLocation) {
        setLocation({
          latitude: data.currentLocation.latitude,
          longitude: data.currentLocation.longitude,
          accuracy: data.currentLocation.accuracy,
          updatedAt: data.currentLocation.updatedAt,
        });
      }
    } catch (error) {
      console.error(
        "❌ Trip loading error:",
        error
      );

      setTrip(null);
      setLocation(null);

      setError(
        "Trip not found. Please check the tracking ID."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | When URL contains /customer/:tripId
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!urlTripId) {
      return;
    }

    const cleanId = urlTripId.trim().toUpperCase();

    setSearchTripId(cleanId);

    loadTrip(cleanId);
  }, [urlTripId]);

  /*
  |--------------------------------------------------------------------------
  | Search Trip
  |--------------------------------------------------------------------------
  */

  const handleSearch = (event) => {
    event.preventDefault();

    const id = searchTripId.trim().toUpperCase();

    if (!id) {
      setError("Please enter a tracking ID.");
      return;
    }

    navigate(`/customer/${id}`);
  };

  /*
  |--------------------------------------------------------------------------
  | Socket.IO
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    /*
    |--------------------------------------------------------------------------
    | Driver location update
    |--------------------------------------------------------------------------
    */

    const handleLocation = (data) => {
      console.log(
        "🚚 Driver location:",
        data
      );

      /*
      |--------------------------------------------------------------------------
      | Only accept location for currently viewed trip
      |--------------------------------------------------------------------------
      */

      if (
        data.tripId &&
        data.tripId !== urlTripId?.trim().toUpperCase()
      ) {
        console.log(
          "⚠️ Ignoring location from another trip:",
          data.tripId
        );

        return;
      }

      setLocation({
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        updatedAt:
          data.updatedAt ||
          new Date().toISOString(),
      });

      setError("");
    };

    /*
    |--------------------------------------------------------------------------
    | Tracking error
    |--------------------------------------------------------------------------
    */

    const handleError = (data) => {
      console.error(
        "❌ Tracking error:",
        data
      );

      setError(
        data?.message ||
          "Tracking error occurred."
      );
    };

    /*
    |--------------------------------------------------------------------------
    | Connect
    |--------------------------------------------------------------------------
    */

    const handleConnect = () => {
      console.log(
        "🟢 Customer connected to server"
      );

      setConnected(true);

      /*
      |--------------------------------------------------------------------------
      | Watch ONLY this trip
      |--------------------------------------------------------------------------
      */

      if (urlTripId) {
        const cleanTripId =
          urlTripId.trim().toUpperCase();

        console.log(
          "👀 Watching trip:",
          cleanTripId
        );

        socket.emit(
          "customer:watchTrip",
          {
            tripId: cleanTripId,
          }
        );
      }
    };

    /*
    |--------------------------------------------------------------------------
    | Disconnect
    |--------------------------------------------------------------------------
    */

    const handleDisconnect = () => {
      console.log(
        "🔴 Customer disconnected"
      );

      setConnected(false);
    };

    /*
    |--------------------------------------------------------------------------
    | Register listeners
    |--------------------------------------------------------------------------
    */

    socket.on(
      "connect",
      handleConnect
    );

    socket.on(
      "disconnect",
      handleDisconnect
    );

    socket.on(
      "driver:locationUpdated",
      handleLocation
    );

    socket.on(
      "driver:currentLocation",
      handleLocation
    );

    socket.on(
      "tracking:error",
      handleError
    );

    /*
    |--------------------------------------------------------------------------
    | Socket may already be connected
    |--------------------------------------------------------------------------
    */

    if (socket.connected) {
      handleConnect();
    }

    /*
    |--------------------------------------------------------------------------
    | Cleanup
    |--------------------------------------------------------------------------
    */

    return () => {
      socket.off(
        "connect",
        handleConnect
      );

      socket.off(
        "disconnect",
        handleDisconnect
      );

      socket.off(
        "driver:locationUpdated",
        handleLocation
      );

      socket.off(
        "driver:currentLocation",
        handleLocation
      );

      socket.off(
        "tracking:error",
        handleError
      );
    };
  }, [urlTripId]);

  /*
  |--------------------------------------------------------------------------
  | Render Trip ID Search
  |--------------------------------------------------------------------------
  */

  if (!urlTripId) {
    return (
      <div className="tracking-search">
        <h1>
          📦 Track Your Delivery
        </h1>

        <p>
          Enter the tracking ID provided
          by your driver.
        </p>

        <form
          onSubmit={handleSearch}
        >
          <input
            type="text"
            value={searchTripId}
            onChange={(event) =>
              setSearchTripId(
                event.target.value
              )
            }
            placeholder="TRIP-XXXXXX"
            disabled={loading}
          />

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Finding Trip..."
              : "Track Delivery"}
          </button>
        </form>

        {error && (
          <p className="error">
            {error}
          </p>
        )}
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="tracking-search">
        <h1>
          🔎 Finding Trip...
        </h1>

        <p>
          Loading trip{" "}
          <strong>
            {urlTripId}
          </strong>
          ...
        </p>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Trip not found
  |--------------------------------------------------------------------------
  */

  if (!trip) {
    return (
      <div className="tracking-search">
        <h1>
          ❌ Trip Not Found
        </h1>

        <p>
          No trip was found with ID:
        </p>

        <strong>
          {urlTripId}
        </strong>

        {error && (
          <p className="error">
            {error}
          </p>
        )}

        <button
          onClick={() =>
            navigate("/customer")
          }
        >
          Search Another Trip
        </button>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Tracking Page
  |--------------------------------------------------------------------------
  */

  return (
    <div>
      {/* Header */}

      <div className="customer-header">
        <div>
          <h1>
            📦 Track Your Delivery
          </h1>

          <p>
            Trip ID:{" "}
            <strong>
              {trip.tripId}
            </strong>
          </p>

          <p>
            Driver:{" "}
            <strong>
              {trip.driverId}
            </strong>
          </p>
        </div>

        <div className="connection-status">
          {connected ? (
            <span className="online">
              🟢 Live
            </span>
          ) : (
            <span>
              🔴 Offline
            </span>
          )}
        </div>
      </div>

      {/* Map */}

      <div className="map-wrapper">
        <DriverMap
          location={location}
          destination={
            trip.destination
          }
          onRouteInfo={
            setRouteInfo
          }
        />
      </div>

      {/* Driver information */}

      <div className="driver-info">
        <h2>
          🚚 Delivery Status
        </h2>

        <div className="delivery-status">
          {location ? (
            <span className="status-live">
              🟢 Driver location available
            </span>
          ) : (
            <span>
              🟡 Waiting for driver location
            </span>
          )}
        </div>

        {/* Coordinates */}

        {location && (
          <div className="coordinates">
            <div>
              <span>
                Latitude
              </span>

              <strong>
                {location.latitude.toFixed(
                  6
                )}
              </strong>
            </div>

            <div>
              <span>
                Longitude
              </span>

              <strong>
                {location.longitude.toFixed(
                  6
                )}
              </strong>
            </div>

            {location.accuracy && (
              <div>
                <span>
                  Accuracy
                </span>

                <strong>
                  ±
                  {Math.round(
                    location.accuracy
                  )}{" "}
                  m
                </strong>
              </div>
            )}
          </div>
        )}

        {/* Destination */}

        {trip.destination && (
          <div className="destination-info">
            <span>
              Destination
            </span>

            <strong>
              📍{" "}
              {trip.destination.address ||
                "Destination"}
            </strong>
          </div>
        )}

        {/* Distance and ETA */}

        {routeInfo && (
          <div className="route-info">
            <div>
              <span>
                Distance
              </span>

              <strong>
                {routeInfo.distanceKm.toFixed(
                  1
                )}{" "}
                km
              </strong>
            </div>

            <div>
              <span>
                Estimated arrival
              </span>

              <strong>
                {Math.ceil(
                  routeInfo.durationMinutes
                )}{" "}
                min
              </strong>
            </div>
          </div>
        )}

        {/* Last update */}

        {location?.updatedAt && (
          <p className="last-update">
            Last location update:{" "}
            {new Date(
              location.updatedAt
            ).toLocaleTimeString()}
          </p>
        )}

        {/* Error */}

        {error && (
          <p className="error">
            {error}
          </p>
        )}

        {/* Search another trip */}

        <button
          onClick={() =>
            navigate("/customer")
          }
        >
          🔍 Track Another Trip
        </button>
      </div>
    </div>
  );
}

export default Customer;
