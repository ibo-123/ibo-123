
import { useEffect, useRef, useState } from "react";
import socket from "../socket";

function Driver() {
  const [tracking, setTracking] = useState(false);
  const [gpsStatus, setGpsStatus] = useState("idle");
  const [location, setLocation] = useState(null);
  const [error, setError] = useState("");
  const [tripId, setTripId] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  const driverId = "driver-1";

  const watchIdRef = useRef(null);
  const tripIdRef = useRef(null);

  /*
  |--------------------------------------------------------------------------
  | Start GPS watching
  |--------------------------------------------------------------------------
  */
const startGPS = (newTripId) => {
  if (!navigator.geolocation) {
    setGpsStatus("error");

    setError(
      "Geolocation is not supported by this browser."
    );

    return;
  }

  tripIdRef.current = newTripId;

  /*
  |--------------------------------------------------------------------------
  | Start watching GPS
  |--------------------------------------------------------------------------
  */
if (watchIdRef.current !== null) {
  navigator.geolocation.clearWatch(
    watchIdRef.current
  );

  watchIdRef.current = null;
}
  watchIdRef.current =
    navigator.geolocation.watchPosition(
      (position) => {
        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        const accuracy =
          position.coords.accuracy;

        const updatedAt =
          new Date().toISOString();

        const newLocation = {
          latitude,
          longitude,
          accuracy,
          updatedAt,
        };

        /*
        |--------------------------------------------------------------------------
        | Update UI
        |--------------------------------------------------------------------------
        */

        setLocation(newLocation);

        setTracking(true);

        setGpsStatus("active");

        setError("");

        /*
        |--------------------------------------------------------------------------
        | Send location to backend
        |--------------------------------------------------------------------------
        */

        socket.emit(
          "driver:locationUpdate",
          {
            tripId: newTripId,
            driverId,
            latitude,
            longitude,
            accuracy,
          }
        );

        console.log(
          `📍 ${newTripId} → ${latitude}, ${longitude} ±${Math.round(
            accuracy
          )}m`
        );
      },

   (gpsError) => {
  console.warn("📡 GPS Error:", gpsError);

  if (gpsError.code === gpsError.TIMEOUT) {
    console.warn(
      "⚠️ GPS timeout - keeping last known location"
    );

    // DO NOT stop tracking
    setTracking(true);
    setGpsStatus("active");

    setError(
      "GPS signal is taking longer than expected. Waiting for the next update..."
    );

    return;
  }

  if (gpsError.code === gpsError.PERMISSION_DENIED) {
    setTracking(false);
    setGpsStatus("error");

    setError(
      "Location permission was denied. Please allow location access."
    );

    return;
  }

  if (gpsError.code === gpsError.POSITION_UNAVAILABLE) {
    console.warn(
      "⚠️ GPS position temporarily unavailable"
    );

    // Keep tracking alive
    setTracking(true);
    setGpsStatus("active");

    setError(
      "GPS position temporarily unavailable. Waiting for the next update..."
    );

    return;
  }

  setTracking(false);
  setGpsStatus("error");

  setError(
    "An unknown GPS error occurred."
  );
}
,
    {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 60000,
}
    );
};


  /*
  |--------------------------------------------------------------------------
  | Receive generated Trip ID from backend
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const handleConnect = () => {
      console.log("🟢 Driver connected to server");
      setSocketConnected(true);
      setError("");
    };

    const handleDisconnect = () => {
      console.log("🔴 Driver disconnected from server");
      setSocketConnected(false);
      setError("Connection lost. Attempting to reconnect...");
    };

    const handleTrackingStarted = (data) => {
  console.log(
    "🎫 Trip created:",
    JSON.stringify(data, null, 2)
  );

  const newTripId = data.tripId;

  setTripId(newTripId);

  tripIdRef.current = newTripId;

  startGPS(newTripId);
};

   const handleTrackingError = (data) => {
  console.error(
    "❌ TRACKING ERROR:",
    JSON.stringify(data, null, 2)
  );

  setTracking(false);
  setGpsStatus("error");

  setError(
    data?.message ||
      "Could not start tracking."
  );
};

    socket.on("connect", handleConnect);
    socket.on(
      "disconnect",
      handleDisconnect
    );
    socket.on(
      "driver:trackingStarted",
      handleTrackingStarted
    );

    socket.on(
      "tracking:error",
      handleTrackingError
    );

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off(
        "disconnect",
        handleDisconnect
      );
      socket.off(
        "driver:trackingStarted",
        handleTrackingStarted
      );

      socket.off(
        "tracking:error",
        handleTrackingError
      );
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Cleanup GPS when component is removed
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(
          watchIdRef.current
        );

        watchIdRef.current = null;
      }
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Start tracking
  |--------------------------------------------------------------------------
  */

  const startTracking = () => {
    // Validate connection
    if (!socketConnected) {
      setError("⚠️ Not connected to server. Please check your connection.");
      return;
    }

    if (tracking) {
      setError("⚠️ Already tracking. Please stop the current trip first.");
      return;
    }

    setError("");
    setGpsStatus("connecting");

    if (!navigator.geolocation) {
      setGpsStatus("error");

      setError(
        "Geolocation is not supported by this browser."
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Ask backend to create a new trip
    |--------------------------------------------------------------------------
    */

    console.log(
      "🚚 Requesting new trip..."
    );

    socket.emit(
      "driver:startTracking",
      {
        driverId,
      }
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Stop tracking
  |--------------------------------------------------------------------------
  */

  const stopTracking = () => {
    const currentTripId =
      tripIdRef.current;

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(
        watchIdRef.current
      );

      watchIdRef.current = null;
    }

    if (currentTripId) {
      socket.emit(
        "driver:stopTracking",
        {
          tripId: currentTripId,
          driverId,
        }
      );
    }

    setTracking(false);
    setGpsStatus("idle");
    setLocation(null);
  };

  /*
  |--------------------------------------------------------------------------
  | Status text
  |--------------------------------------------------------------------------
  */

  const getStatus = () => {
    if (gpsStatus === "connecting") {
      return (
        <span>
          🟡 Creating trip & getting GPS...
        </span>
      );
    }

    if (gpsStatus === "active") {
      return (
        <span className="online">
          🟢 GPS Tracking Active
        </span>
      );
    }

    if (gpsStatus === "error") {
      return (
        <span className="status-error">
          🔴 GPS Error
        </span>
      );
    }

    return (
      <span>
        ⚪ Not Tracking
      </span>
    );
  };

  return (
    <div className="driver-page">

      <div className="card">

        <h1>
          🚚 Driver Tracking
        </h1>

        {/* Connection Status */}

        <div className="connection-status-badge">
          {socketConnected ? (
            <span className="online">
              🟢 Connected to Server
            </span>
          ) : (
            <span className="offline">
              🔴 Disconnected
            </span>
          )}
        </div>

        {/* Trip */}

        <p>
          Trip:{" "}
          <strong>
            {tripId || "Not created yet"}
          </strong>
        </p>

        {/* Driver */}

        <p>
          Driver:{" "}
          <strong>
            {driverId}
          </strong>
        </p>

        {/* Status */}

        <div className="status">
          Status:{" "}
          {getStatus()}
        </div>

        {/* Tracking ID */}

        {tripId && (
          <div className="tracking-code">

            <h3>
              🎫 Customer Tracking ID
            </h3>

            <p>
              Give this ID to the customer:
            </p>

            <strong>
              {tripId}
            </strong>

          </div>
        )}

        {/* GPS Information */}

        {location && (
          <div className="location">

            <h3>
              📍 Current GPS
            </h3>

            <p>
              Latitude:{" "}
              <strong>
                {location.latitude.toFixed(
                  6
                )}
              </strong>
            </p>

            <p>
              Longitude:{" "}
              <strong>
                {location.longitude.toFixed(
                  6
                )}
              </strong>
            </p>

            <p>
              Accuracy:{" "}
              <strong>
                ±
                {Math.round(
                  location.accuracy
                )}{" "}
                meters
              </strong>
            </p>

            <p>
              Last update:{" "}
              <strong>
                {new Date(
                  location.updatedAt
                ).toLocaleTimeString()}
              </strong>
            </p>

          </div>
        )}

        {/* Error */}

        {error && (
          <p className="error">
            {error}
          </p>
        )}

        {/* Buttons */}

        {!tracking ? (
          <button
            onClick={startTracking}
            disabled={
              gpsStatus === "connecting" || !socketConnected
            }
          >
            {gpsStatus === "connecting"
              ? "Creating Trip..."
              : "Start Tracking"}
          </button>
        ) : (
          <button
            onClick={stopTracking}
            className="btn-danger"
          >
            Stop Tracking
          </button>
        )}

      </div>

    </div>
  );
}

export default Driver;
