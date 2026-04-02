  // src/App.jsx
  import React from 'react';
  import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
  import { AuthProvider, useAuth } from './contexts/AuthContext';
  import PrivateRoute from './components/common/PrivateRoute';
  import LoadingSpinner from './components/common/LoadingSpinner';
  import FaceDetectionAttendance from './components/FaceDetectionAttendance/FaceDetectionAttendance';

  // Components
  const Login = React.lazy(() => import('./pages/auth/Login'));
  const ForgotPassword = React.lazy(() => import('./pages/auth/ForgotPassword'));
  const ResetPassword = React.lazy(() => import('./pages/auth/ResetPassword'));
  const AdminDashboard = React.lazy(() => import('./pages/dashboard/AdminDashboard'));
  const SubAdminDashboard = React.lazy(() => import('./pages/dashboard/SubAdminDashboard'));
  const EmployeeDashboard = React.lazy(() => import('./pages/dashboard/EmployeeDashboard'));
  const StudentDashboard = React.lazy(() => import('./pages/dashboard/StudentDashboard'));

  const AppContent = () => {
    const { user, loading } = useAuth();

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
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              user ? <Navigate to={`/${user.role.replace('_', '-')}`} replace /> : <Login />
            } 
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          
          {/* Protected Routes */}
          <Route path="/admin/*" element={
            <PrivateRoute requiredRole="admin">
              <AdminDashboard />
            </PrivateRoute>
          } />
          
          <Route path="/hr/*" element={
            <PrivateRoute requiredRole="hr">
              <SubAdminDashboard />
            </PrivateRoute>
          } />
          
          <Route path="/employee/*" element={
            <PrivateRoute requiredRole="employee">
              <EmployeeDashboard />
            </PrivateRoute>
          } />
          
          <Route path="/student/*" element={
            <PrivateRoute requiredRole="student">
              <StudentDashboard />
            </PrivateRoute>
          } />

          {/* Default redirect */}
          <Route path="/" element={
            user ? (
              <Navigate to={`/${user.role.replace('_', '-')}`} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } />

          {/* Catch all route */}
      
        <Route path="/face-detection-attendance" element={<FaceDetectionAttendance />} />
          <Route path="*" element={<Navigate to={window.location.pathname} replace />} />
        
        </Routes>
      </React.Suspense>
    );
  };

  function App() {
    return (
      <Router>
        <AuthProvider>
          <div className="App">
            <AppContent />
          </div>
        </AuthProvider>
      </Router>
    );
  }

  export default App;