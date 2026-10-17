import express from "express";
import {
  updateProfessional,
  deleteProfessional,
  getSingleProfessional,
  getAllProfessionals,
  getProfessionalProfile,
  getProfessionalAppointments,
  updateBookingStatusByProfessional,
  updateProfessionalProfileMe,
} from "../Controllers/professionalController.js";
import { authenticate, restrict } from "../middleware/verifyToken.js";
import reviewRouter from "./review.js";

const router = express.Router();

// Nested route for reviews
router.use("/:professionalId/reviews", reviewRouter);

// Profile and assigned bookings for authenticated professional
router.get("/profile/me", authenticate, restrict(["professional"]), getProfessionalProfile);
router.put("/profile/me", authenticate, restrict(["professional"]), updateProfessionalProfileMe);
router.get("/appointments/my-appointments", authenticate, restrict(["professional"]), getProfessionalAppointments);
router.patch("/appointments/:bookingId/status", authenticate, restrict(["professional"]), updateBookingStatusByProfessional);

router.get("/:id", getSingleProfessional);
router.get("/", getAllProfessionals);
router.put("/:id", authenticate, restrict(["professional"]), updateProfessional);
router.delete("/:id", authenticate, restrict(["professional", "admin"]), deleteProfessional);

export default router;
