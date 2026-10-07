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
} from "../Controllers/adminController.js";

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

export default router;

