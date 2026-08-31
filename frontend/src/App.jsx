// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';
import LoadingSpinner from './components/common/LoadingSpinner';
import GlobalAlert from './components/common/GlobalAlert';

const Login = React.lazy(() => import('./pages/auth/Login'));
const ForgotPassword = React.lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/auth/ResetPassword'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const EmployeeApp = React.lazy(() => import('./pages/employees/EmployeeApp'));

const AppContent = () => {
  const { user, loading, isAdmin } = useAuth();

  const getDashboardPath = (userData) => {
    if (!userData) return '/login';
    if (isAdmin || userData?.position === 'admin') return '/admin';
    return '/dashboard';
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner text="Loading application..." />
      </div>
    );
  }

  return (
    <React.Suspense fallback={<LoadingSpinner text="Loading page..." />}>
      <Routes>
        <Route
          path="/login"
          element={
            user ? <Navigate to={getDashboardPath(user)} replace /> : <Login />
          }
        />
        <Route
          path="/forgot-password"
          element={
            user ? <Navigate to={getDashboardPath(user)} replace /> : <ForgotPassword />
          }
        />
        <Route
          path="/reset-password/:token"
          element={<ResetPassword />}
        />

        <Route
          path="/admin/*"
          element={
            <PrivateRoute adminOnly>
              <AdminDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/dashboard/*"
          element={
            <PrivateRoute employeeOnly>
              <EmployeeApp />
            </PrivateRoute>
          }
        />

        <Route
          path="/"
          element={
            user ? (
              <Navigate to={getDashboardPath(user)} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="*"
          element={
            user ? <Navigate to={getDashboardPath(user)} replace /> : <Navigate to="/login" replace />
          }
        />
      </Routes>
    </React.Suspense>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <GlobalAlert />
          <AppContent />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
