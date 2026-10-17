import React, { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const AdminRoute = ({ children }) => {
  const { token, role, user } = useContext(AuthContext);
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role !== "admin") {
    if (role === "professional") {
      return <Navigate to="/professional/dashboard" replace />;
    }
    return <Navigate to="/users/profile/me" replace />;
  }

  return children ? children : <Outlet />;
};

export default AdminRoute;
