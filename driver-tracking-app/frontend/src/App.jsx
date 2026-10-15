
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Driver from "./pages/Driver";
import Customer from "./pages/Customer";
import "./App.css";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DriverDashboard from "./pages/DriverDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
function Home() {
  return (
    <div className="page">
      <div className="card">
        <h1>🚚 Driver Tracking Demo</h1>

        <p>
          Real-time driver tracking system
        </p>

        <div className="links">
          <Link to="/driver">
            🚚 Driver Dashboard
          </Link>

          <Link to="/customer">
            📦 Customer Tracking
          </Link>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Home */}
        <Route
          path="/"
          element={<Home />}
        />

        {/* Driver */}
        <Route
          path="/driver"
          element={<Driver />}
        />
        <Route element={<ProtectedRoute />}>
  <Route path="/driver" element={<Driver />} />
  <Route path="/driver/dashboard" element={<DriverDashboard />} />
</Route>

        {/* Customer enters Trip ID */}
        <Route
          path="/customer"
          element={<Customer />}
        />
<Route
  path="/login"
  element={<Login />}
/>

<Route
  path="/register"
  element={<Register />}
/>
        {/* Customer tracks specific Trip */}
        <Route
          path="/customer/:tripId"
          element={<Customer />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
