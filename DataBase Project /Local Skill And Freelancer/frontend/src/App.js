import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const Register = lazy(() => import('./pages/Register'));
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const JobDetails = lazy(() => import('./pages/JobDetails'));
const PostJob = lazy(() => import('./pages/PostJob'));
const Messaging = lazy(() => import('./pages/Messaging'));
const CreateService = lazy(() => import('./pages/CreateService'));
const ServiceDetails = lazy(() => import('./pages/ServiceDetails'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Proposals = lazy(() => import('./pages/Proposals'));

// Loading component for suspense fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" text="Loading page..." />
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <NotificationProvider>
          <AuthProvider>
            <div className="App bg-gradient-to-b from-gray-50 to-white min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-grow">
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />
                    
                    {/* Protected Routes - General */}
                    <Route 
                      path="/dashboard" 
                      element={
                        <ProtectedRoute roles={['client', 'freelancer', 'admin']}>
                          <Dashboard />
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/profile" 
                      element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/settings" 
                      element={
                        <ProtectedRoute>
                          <Settings />
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route path="/jobs" element={<Home />} />
                    <Route 
                      path="/proposals" 
                      element={
                        <ProtectedRoute roles={['freelancer']}>
                          <Proposals />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/my-proposals" 
                      element={
                        <ProtectedRoute roles={['freelancer']}>
                          <Proposals />
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/messages" 
                      element={
                        <ProtectedRoute>
                          <Messaging />
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/messages/:userId" 
                      element={
                        <ProtectedRoute>
                          <Messaging />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Job Routes */}
                    <Route 
                      path="/job/:id" 
                      element={
                        <ProtectedRoute roles={['client', 'freelancer', 'admin']}>
                          <JobDetails />
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/post-job" 
                      element={
                        <ProtectedRoute roles={['client']}>
                          <PostJob />
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/edit-job/:id" 
                      element={
                        <ProtectedRoute roles={['client']}>
                          <PostJob />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Service Routes */}
                    <Route 
                      path="/services" 
                      element={
                        <ProtectedRoute roles={['client', 'freelancer']}>
                          <Home />
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/service/:id" 
                      element={
                        <ProtectedRoute roles={['client', 'freelancer']}>
                          <ServiceDetails />
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/create-service" 
                      element={
                        <ProtectedRoute roles={['freelancer']}>
                          <CreateService />
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/edit-service/:id" 
                      element={
                        <ProtectedRoute roles={['freelancer']}>
                          <CreateService />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Admin Routes */}
                    <Route 
                      path="/admin" 
                      element={
                        <ProtectedRoute roles={['admin']}>
                          <Dashboard />
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/admin/users" 
                      element={
                        <ProtectedRoute roles={['admin']}>
                          <Dashboard />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* 404 Not Found Route */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </main>
              <Footer />
            </div>
          </AuthProvider>
        </NotificationProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;