// src/components/common/PrivateRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const PrivateRoute = ({
  children,
  requiredRole,
  adminOnly = false,
  employeeOnly = false,
}) => {
  const { isAuthenticated, user, loading, isAdmin } = useAuth();

  if (loading) {
    return <LoadingSpinner text="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (employeeOnly && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  if (requiredRole && user?.position !== requiredRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
