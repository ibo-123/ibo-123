import { Routes, Route, Navigate } from "react-router-dom";

import Settings from "../pages/Settings";
import Login from "../pages/Login";
import Register from "../pages/Register";
import VerifyOtp from "../pages/VerifyOtp";
import Dashboard from "../pages/Dashboard";
import Profile from "../pages/Profile";
import Analytics from "../pages/Analytics";
import Contests from "../pages/Contests";
import Home from "../pages/Home";

import DashboardLayout from "../layouts/DashboardLayout";
import ProtectedRoute from "../components/ProtectedRoute";

function AppRoutes() {
  return (
    <Routes>
      {/* =========================
          Public Routes
      ========================== */}

      <Route path="/" element={<Home />} />

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      {/* OTP Verification */}
      <Route
        path="/verify-email"
        element={<VerifyOtp />}
      />

      {/* Keep old URL working */}
      <Route
        path="/verify-otp"
        element={
          <Navigate
            to="/verify-email"
            replace
          />
        }
      />

      {/* =========================
          Protected Routes
      ========================== */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Profile />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Analytics />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Settings />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/contests"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Contests />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* =========================
          Fallback
      ========================== */}

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}

export default AppRoutes;