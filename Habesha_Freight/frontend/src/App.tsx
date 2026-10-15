import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './layouts/MainLayout';
import DriverLayout from './layouts/DriverLayout';
import CompanyLayout from './layouts/CompanyLayout';
import ShipperLayout from './pages/shipper/ShipperLayout';
import PendingApproval from './pages/PendingApproval';

// Public / Shipper pages
import {
  ShipperHome,
  Login,
  Register,
  VerifyOTP,
  ShipperDashboard,
  ShipperProfile,
  ShipperShipments,
  ShipperCreateShipment,
  ShipperBids,
  ShipperTracking,
  ShipperHistory,
  ShipperRatings,
  ShipperFleet,
  ShipperPayments,
} from './pages/shipper';

// Transport Company pages
import {
  CompanyDashboard,
  CompanyFleetRequests,
  CompanyDeliveries,
  CompanyVehicles,
  CompanyDrivers,
  CompanyRatings,
  CompanyProfile,
  CompanySettings,
} from './pages/company';

// Driver pages
import {
  DriverDashboard,
  IncomingRequests,
  AvailableLoads,
  RequestDetails,
  ActiveDelivery,
  DeliveryDetails,
  BidHistory,
  SubmitBid,
  DeliveryHistory,
  LiveTracking,
  DriverRatings,
  DriverMessages,
  DriverInfo,
  DriverLicense,
  DriverSettings,
  DriverWallet,
} from './pages/driver';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDrivers from './pages/admin/AdminDrivers';
import AdminCompanies from './pages/admin/AdminCompanies';
import AdminVehicles from './pages/admin/AdminVehicles';
import AdminDeliveries from './pages/admin/AdminDeliveries';
import AdminVerification from './pages/admin/AdminVerification';
import AdminPayments from './pages/admin/AdminPayments';
import AdminDisputes from './pages/admin/AdminDisputes';
import AdminReports from './pages/admin/AdminReports';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            {/* ── Admin portal routes ── */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/drivers"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDrivers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/companies"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminCompanies />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/vehicles"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminVehicles />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/deliveries"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDeliveries />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/verification"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminVerification />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/payments"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminPayments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/escrow"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminPayments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/disputes"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDisputes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminAuditLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/logs"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminAuditLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* ── Driver portal routes ── */}
            <Route
              path="/driver/*"
              element={
                <ProtectedRoute allowedRoles={['DRIVER']}>
                  <DriverLayout>
                    <Routes>
                      <Route index element={<DriverDashboard />} />
                      <Route path="dashboard" element={<DriverDashboard />} />
                      <Route path="requests" element={<IncomingRequests />} />
                      <Route path="requests/loads" element={<AvailableLoads />} />
                      <Route path="requests/:id" element={<RequestDetails />} />
                      <Route path="bids" element={<BidHistory />} />
                      <Route path="bids/history" element={<BidHistory />} />
                      <Route path="bids/submit" element={<SubmitBid />} />
                      <Route path="active-delivery" element={<ActiveDelivery />} />
                      <Route path="active-delivery/:id" element={<DeliveryDetails />} />
                      <Route path="deliveries/active" element={<ActiveDelivery />} />
                      <Route path="deliveries/tracking" element={<LiveTracking />} />
                      <Route path="gps" element={<LiveTracking />} />
                      <Route path="deliveries/history" element={<DeliveryHistory />} />
                      <Route path="history" element={<DeliveryHistory />} />
                      <Route path="history/tracking" element={<LiveTracking />} />
                      <Route path="ratings" element={<DriverRatings />} />
                      <Route path="messages" element={<DriverMessages />} />
                      <Route path="wallet" element={<DriverWallet />} />
                      <Route path="profile" element={<DriverInfo />} />
                      <Route path="profile/info" element={<DriverInfo />} />
                      <Route path="profile/license" element={<DriverLicense />} />
                      <Route path="profile/settings" element={<DriverSettings />} />
                      <Route path="*" element={<Navigate to="dashboard" replace />} />
                    </Routes>
                  </DriverLayout>
                </ProtectedRoute>
              }
            />

            {/* ── Transport Company routes ── */}
            <Route
              path="/company/*"
              element={
                <ProtectedRoute allowedRoles={['FLEET_OWNER']}>
                  <CompanyLayout>
                    <Routes>
                      <Route index element={<Navigate to="dashboard" replace />} />
                      <Route path="dashboard" element={<CompanyDashboard />} />
                      <Route path="fleet-requests" element={<CompanyFleetRequests />} />
                      <Route path="deliveries" element={<CompanyDeliveries />} />
                      <Route path="vehicles" element={<CompanyVehicles />} />
                      <Route path="drivers" element={<CompanyDrivers />} />
                      <Route path="ratings" element={<CompanyRatings />} />
                      <Route path="settings" element={<CompanySettings />} />
                      <Route path="profile" element={<CompanyProfile />} />
                      <Route path="company-profile" element={<CompanyProfile />} />
                      <Route path="*" element={<Navigate to="dashboard" replace />} />
                    </Routes>
                  </CompanyLayout>
                </ProtectedRoute>
              }
            />

            {/* ── Auth routes (standalone — no marketing navbar) ── */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route path="/pending-approval" element={<PendingApproval />} />

            {/* ── Public marketing routes ── */}
            <Route
              element={
                <Layout>
                  <Outlet />
                </Layout>
              }
            >
              <Route path="/" element={<ShipperHome />} />
            </Route>

            {/* ── Authenticated Shipper routes ── */}
            <Route
              element={
                <ProtectedRoute allowedRoles={['SHIPPER']}>
                  <ShipperLayout>
                    <Outlet />
                  </ShipperLayout>
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<ShipperDashboard />} />
              <Route path="/profile" element={<ShipperProfile />} />
              <Route path="/shipments" element={<ShipperShipments />} />
              <Route path="/shipments/create" element={<ShipperCreateShipment />} />
              <Route path="/bids" element={<ShipperBids />} />
              <Route path="/messages" element={<DriverMessages />} />
              <Route path="/tracking" element={<ShipperTracking />} />
              <Route path="/history" element={<ShipperHistory />} />
              <Route path="/ratings" element={<ShipperRatings />} />
              <Route path="/fleet" element={<ShipperFleet />} />
              <Route path="/payments" element={<ShipperPayments />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;