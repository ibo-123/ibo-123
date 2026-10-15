import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import Attendance from './pages/Attendance';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="page-form">Loading session...</div>;
  }

  return user ? children : <Navigate to="/login" replace />;
}

function RootLayout() {
  return (
    <>
      <Navbar />
      <main className="app-shell">
        <Outlet />
      </main>
    </>
  );
}

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <RootLayout />,
      children: [
        { path: '/', element: <Navigate to="/dashboard" replace /> },
        { path: '/login', element: <Login /> },
        { path: '/register', element: <Register /> },
        { path: '/dashboard', element: <PrivateRoute><Dashboard /></PrivateRoute> },
        { path: '/courses', element: <PrivateRoute><Courses /></PrivateRoute> },
        { path: '/attendance', element: <PrivateRoute><Attendance /></PrivateRoute> },
      ],
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
