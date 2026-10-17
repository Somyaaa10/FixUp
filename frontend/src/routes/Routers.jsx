import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Home from '../pages/Home';
import Services from '../pages/Services';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import Contact from '../pages/Contact';
import Professionals from '../pages/Professionals/Professionals';
import ProfessionalDetails from '../pages/Professionals/ProfessionalDetails';
import MyAccount from '../pages/Users/MyAccount';
import CheckoutSuccess from '../pages/CheckoutSuccess';

import ProfessionalDashboard from '../pages/Professional/ProfessionalDashboard';
import ProfessionalJobs from '../pages/Professional/ProfessionalJobs';
import ProfessionalBookings from '../pages/Professional/ProfessionalBookings';
import ProfessionalProfile from '../pages/Professional/ProfessionalProfile';
import ProfessionalSettings from '../pages/Professional/ProfessionalSettings';

import AdminDashboard from '../pages/Admin/AdminDashboard';
import AdminUsers from '../pages/Admin/AdminUsers';
import AdminProfessionals from '../pages/Admin/AdminProfessionals';
import AdminBookings from '../pages/Admin/AdminBookings';
import AdminServices from '../pages/Admin/AdminServices';
import AdminContactMessages from '../pages/Admin/AdminContactMessages';
import AdminRoute from '../components/Admin/AdminRoute';
import ProtectedRoute from './ProtectedRoute';

const Routers = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/professionals" element={<Professionals />} />
      <Route path="/professionals/:id" element={<ProfessionalDetails />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Signup />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/services" element={<Services />} />
      <Route path="/checkout-success" element={<CheckoutSuccess />} />

      {/* Customer Protected Route */}
      <Route
        path="/users/profile/me"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <MyAccount />
          </ProtectedRoute>
        }
      />

      {/* Professional Protected Routes */}
      <Route
        path="/professional/dashboard"
        element={
          <ProtectedRoute allowedRoles={['professional']}>
            <ProfessionalDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/professional/jobs"
        element={
          <ProtectedRoute allowedRoles={['professional']}>
            <ProfessionalJobs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/professional/bookings"
        element={
          <ProtectedRoute allowedRoles={['professional']}>
            <ProfessionalBookings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/professional/profile"
        element={
          <ProtectedRoute allowedRoles={['professional']}>
            <ProfessionalProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/professional/settings"
        element={
          <ProtectedRoute allowedRoles={['professional']}>
            <ProfessionalSettings />
          </ProtectedRoute>
        }
      />

      {/* Legacy Route Aliases for backward compatibility */}
      <Route
        path="/professionals/profile/me"
        element={<Navigate to="/professional/dashboard" replace />}
      />

      {/* Admin Protected Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/professionals"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminProfessionals />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/bookings"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminBookings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/services"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminServices />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/contact-messages"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminContactMessages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/messages"
        element={<Navigate to="/admin/contact-messages" replace />}
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default Routers;