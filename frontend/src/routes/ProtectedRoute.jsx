import React, { useContext } from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

/**
 * Robust role-based ProtectedRoute component:
 * - Redirects unauthenticated users to /login
 * - Allows users whose role is in allowedRoles
 * - Redirects authenticated users attempting to access unauthorized roles to their own dashboard
 */
const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { token, role, user } = useContext(AuthContext);
  const location = useLocation();

  // If not authenticated, redirect to login
  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role is authorized for this route, allow access
  if (allowedRoles.length === 0 || allowedRoles.includes(role)) {
    return children ? children : <Outlet />;
  }

  // If role is not authorized, redirect to their dedicated dashboard
  if (role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  if (role === "professional") {
    return <Navigate to="/professional/dashboard" replace />;
  }

  if (role === "customer") {
    return <Navigate to="/users/profile/me" replace />;
  }

  return <Navigate to="/home" replace />;
};

export default ProtectedRoute;
