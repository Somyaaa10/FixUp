import express from "express";
import { authenticate } from "../middleware/verifyToken.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";
import {
  getAdminDashboardStats,
  getRecentBookings,
  getRecentUsers,
  getRecentProfessionals,
  getAdminUsers,
  getAdminUserById,
  updateUserStatus,
  deleteUserByAdmin,
  getAdminProfessionals,
  getAdminProfessionalById,
  createProfessionalByAdmin,
  updateProfessionalByAdmin,
  updateProfessionalStatusByAdmin,
  deleteProfessionalByAdmin,
  getAdminBookings,
  getAdminBookingById,
  updateBookingStatusByAdmin,
  getAdminServices,
  getAdminServiceById,
  createServiceByAdmin,
  updateServiceByAdmin,
  updateServiceStatusByAdmin,
  deleteServiceByAdmin,
} from "../Controllers/adminController.js";
import {
  getAdminContactMessages,
  getAdminContactMessageById,
  updateContactMessageStatus,
  deleteContactMessage,
} from "../Controllers/contactController.js";

const router = express.Router();

// Apply authenticate & adminMiddleware to all routes in this router
router.use(authenticate, adminMiddleware);

// GET /api/v1/admin/test - Authorization test endpoint
router.get("/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Admin authorization successful",
  });
});

// Analytics & Dashboard Overview
router.get("/dashboard", getAdminDashboardStats);
router.get("/recent-bookings", getRecentBookings);
router.get("/recent-users", getRecentUsers);
router.get("/recent-professionals", getRecentProfessionals);

// User Management Routes
router.get("/users", getAdminUsers);
router.get("/users/:id", getAdminUserById);
router.patch("/users/:id/status", updateUserStatus);
router.delete("/users/:id", deleteUserByAdmin);

// Professional Management Routes
router.get("/professionals", getAdminProfessionals);
router.get("/professionals/:id", getAdminProfessionalById);
router.post("/professionals", createProfessionalByAdmin);
router.patch("/professionals/:id", updateProfessionalByAdmin);
router.patch("/professionals/:id/status", updateProfessionalStatusByAdmin);
router.delete("/professionals/:id", deleteProfessionalByAdmin);

// Booking Management Routes
router.get("/bookings", getAdminBookings);
router.get("/bookings/:id", getAdminBookingById);
router.patch("/bookings/:id/status", updateBookingStatusByAdmin);

// Service Management Routes (Phase 4)
router.get("/services", getAdminServices);
router.get("/services/:id", getAdminServiceById);
router.post("/services", createServiceByAdmin);
router.patch("/services/:id", updateServiceByAdmin);
router.patch("/services/:id/status", updateServiceStatusByAdmin);
router.delete("/services/:id", deleteServiceByAdmin);

// Contact Message Management Routes (Phase 5)
router.get("/contact-messages", getAdminContactMessages);
router.get("/contact-messages/:id", getAdminContactMessageById);
router.patch("/contact-messages/:id/status", updateContactMessageStatus);
router.delete("/contact-messages/:id", deleteContactMessage);

export default router;
