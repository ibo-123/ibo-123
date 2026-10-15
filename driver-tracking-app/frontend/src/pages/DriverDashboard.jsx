import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";
import { useAuth } from "../context/AuthContext";
import DriverMap from "../components/DriverMap";
import "./DriverDashboard.css"; // We'll create this CSS file

function DriverDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [tracking, setTracking] = useState(false);
  const [tripId, setTripId] = useState("");
  const [location, setLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);

  // ---------------------------------------------------------
  // Socket connection
  // ---------------------------------------------------------

  useEffect(() => {
    const handleConnect = () => {
      console.log("🟢 Driver connected to Socket.IO");
      setConnected(true);
    };

    const handleDisconnect = () => {
      console.log("🔴 Driver disconnected");
      setConnected(false);
    };

    const handleTrackingStarted = (data) => {
      console.log("🚚 Tracking started:", data);

      setTripId(data.tripId);
      setTracking(true);
      setDestination(data.destination || null);
      setError("");
    };

    const handleTrackingStopped = (data) => {
      console.log("🛑 Tracking stopped:", data);

      setTracking(false);
      setTripId("");
      setLocation(null);
      setDestination(null);
    };

    const handleError = (data) => {
      console.error("❌ Tracking error:", data);
      setError(data?.message || "Tracking error occurred.");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("driver:trackingStarted", handleTrackingStarted);
    socket.on("driver:trackingStopped", handleTrackingStopped);
    socket.on("tracking:error", handleError);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("driver:trackingStarted", handleTrackingStarted);
      socket.off("driver:trackingStopped", handleTrackingStopped);
      socket.off("tracking:error", handleError);
    };
  }, []);

  // ---------------------------------------------------------
  // Start tracking
  // ---------------------------------------------------------

  const startTracking = () => {
    setError("");

    if (!socket.connected) {
      setError("Not connected to tracking server.");
      return;
    }

    console.log("🚚 Starting tracking...");
    socket.emit("driver:startTracking");
  };

  // ---------------------------------------------------------
  // Stop tracking
  // ---------------------------------------------------------

  const stopTracking = () => {
    if (!tripId) return;
    console.log("🛑 Stopping tracking:", tripId);
    socket.emit("driver:stopTracking", { tripId });
  };

  // ---------------------------------------------------------
  // GPS tracking
  // ---------------------------------------------------------

  useEffect(() => {
    if (!tracking || !tripId) {
      return;
    }

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    console.log("📍 Starting GPS tracking...");

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log("📍 GPS:", latitude, longitude);

        const currentLocation = { latitude, longitude, accuracy };
        setLocation(currentLocation);

        socket.emit("driver:locationUpdate", {
          tripId,
          latitude,
          longitude,
          accuracy,
        });
      },
      (error) => {
        console.error("❌ GPS error:", error);
        setError("Unable to get your location.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );

    return () => {
      console.log("🛑 Stopping GPS watcher");
      navigator.geolocation.clearWatch(watchId);
    };
  }, [tracking, tripId]);

  // ---------------------------------------------------------
  // Route information
  // ---------------------------------------------------------

  const handleRouteInfo = (routeInfo) => {
    if (!routeInfo) {
      console.log("❌ Route information unavailable");
      return;
    }
    console.log("🛣️ Route:", routeInfo);
  };

  // ---------------------------------------------------------
  // Logout
  // ---------------------------------------------------------

  const handleLogout = () => {
    if (tracking) {
      stopTracking();
    }
    logout();
    navigate("/login");
  };

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------

  return (
    <div className="driver-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>🚚 Driver Dashboard</h1>
          <p className="welcome-text">
            Welcome, <strong>{user?.name || "Driver"}</strong>
          </p>
        </div>
        <div className="header-right">
          <div className="connection-status">
            {connected ? (
              <span className="status-connected">🟢 Connected</span>
            ) : (
              <span className="status-disconnected">🔴 Disconnected</span>
            )}
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        {!tracking ? (
          // Not Tracking State
          <section className="tracking-section idle-state">
            <div className="idle-content">
              <h2>Ready to start a delivery?</h2>
              <p>Start tracking to create a new delivery trip.</p>
              <button
                onClick={startTracking}
                disabled={!connected}
                className="start-tracking-btn"
              >
                🚚 Start Tracking
              </button>
            </div>
          </section>
        ) : (
          // Tracking State
          <section className="tracking-section active-state">
            <div className="tracking-header">
              <h2>🟢 Delivery Tracking Active</h2>
              <div className="trip-id-container">
                <p>Trip ID:</p>
                <strong className="trip-id">{tripId}</strong>
              </div>
              <p className="trip-instruction">
                Give this Trip ID to the customer so they can track the delivery.
              </p>
            </div>

            <div className="tracking-grid">
              {/* Location Info */}
              <div className="location-card">
                <h3>📍 Current Location</h3>
                {location ? (
                  <div className="location-details">
                    <p>
                      <span className="label">Latitude:</span>
                      <span className="value">{location.latitude.toFixed(6)}</span>
                    </p>
                    <p>
                      <span className="label">Longitude:</span>
                      <span className="value">{location.longitude.toFixed(6)}</span>
                    </p>
                    <p>
                      <span className="label">Accuracy:</span>
                      <span className="value">±{Math.round(location.accuracy)} m</span>
                    </p>
                  </div>
                ) : (
                  <p className="gps-waiting">📡 Waiting for GPS location...</p>
                )}
              </div>

              {/* Map */}
              {destination && (
                <div className="map-container">
                  <DriverMap
                    location={location}
                    destination={destination}
                    onRouteInfo={handleRouteInfo}
                  />
                </div>
              )}

              {/* Stop Tracking Button */}
              <div className="action-container">
                <button onClick={stopTracking} className="stop-tracking-btn">
                  🛑 Stop Tracking
                </button>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default DriverDashboard;